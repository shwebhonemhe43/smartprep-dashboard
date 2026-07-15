import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ topic_id: z.string().uuid() });

export type Flashcard = { front: string; back: string };

export const getOrGenerateTopicFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Topic + subject metadata for display
    const { data: topic, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id, file_name, subject_id, subjects(subject_code, subject_name, level)")
      .eq("id", data.topic_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!topic) throw new Error("Topic not found");

    const topicName = topic.file_name.replace(/\.[^.]+$/, "");

    // 1. Existing flashcards?
    const { data: existing, error: exErr } = await context.supabase
      .from("student_topic_flashcards")
      .select("flashcards, created_at, updated_at")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    if (existing) {
      console.log("Existing flashcards found - loading saved flashcards");
      return {
        flashcards: existing.flashcards as Flashcard[],
        created_at: existing.created_at,
        updated_at: existing.updated_at,
        topic_name: topicName,
        subject: topic.subjects,
        subject_id: topic.subject_id,
      };
    }

    console.log("No flashcards found - generating AI flashcards");

    // 2. Need saved notes as source
    const { data: notesRow, error: nErr } = await context.supabase
      .from("student_topic_notes")
      .select("notes_content")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!notesRow?.notes_content) {
      throw new Error("Please open the Notes for this topic first — flashcards are generated from your saved notes.");
    }

    // 3. Generate via Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You create study flashcards from a student's lecture notes. Return ONLY strict JSON: an object with a "flashcards" array of 10 items, each { "front": string, "back": string }. Front is a concise question or key term. Back is a clear, complete answer/explanation. No markdown, no code fences.`;

    const userPrompt = `Topic: ${topicName}
Subject: ${(topic.subjects as any)?.subject_name ?? ""}

Notes:
${notesRow.notes_content}

Generate 10 flashcards as JSON: {"flashcards":[{"front":"...","back":"..."}]}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      throw new Error(`AI generation failed [${resp.status}]: ${body}`);
    }

    const json = await resp.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: { flashcards?: Flashcard[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    const cards = (parsed.flashcards ?? [])
      .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
      .map((c) => ({ front: c.front.trim(), back: c.back.trim() }));
    if (cards.length === 0) throw new Error("AI returned no flashcards.");

    // 4. Save once
    const { data: saved, error: insErr } = await context.supabase
      .from("student_topic_flashcards")
      .insert({
        student_id: context.userId,
        topic_id: data.topic_id,
        subject_id: topic.subject_id,
        flashcards: cards,
      })
      .select("flashcards, created_at, updated_at")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        const { data: existingRace } = await context.supabase
          .from("student_topic_flashcards")
          .select("flashcards, created_at, updated_at")
          .eq("student_id", context.userId)
          .eq("topic_id", data.topic_id)
          .maybeSingle();
        if (existingRace) {
          return {
            flashcards: existingRace.flashcards as Flashcard[],
            created_at: existingRace.created_at,
            updated_at: existingRace.updated_at,
            topic_name: topicName,
            subject: topic.subjects,
            subject_id: topic.subject_id,
          };
        }
      }
      throw new Error(insErr.message);
    }

    return {
      flashcards: saved.flashcards as Flashcard[],
      created_at: saved.created_at,
      updated_at: saved.updated_at,
      topic_name: topicName,
      subject: topic.subjects,
      subject_id: topic.subject_id,
    };
  });
