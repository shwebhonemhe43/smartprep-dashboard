import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ topic_id: z.string().uuid() });

export const getOrGenerateTopicNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    // 1. Check for existing notes before any AI generation
    const { data: existing, error: exErr } = await context.supabase
      .from("student_topic_notes")
      .select("id, notes_content, created_at, updated_at, topic_id, subject_id")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    if (existing) {
      console.log("Existing notes found - loading saved notes");
    } else {
      console.log("No notes found - generating AI notes");
    }

    // Fetch topic + subject info for display
    const { data: topic, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id, file_name, file_type, subject_id, subjects(subject_code, subject_name, level, description)")
      .eq("id", data.topic_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!topic) throw new Error("Topic not found");

    if (existing) {
      return {
        notes_content: existing.notes_content,
        created_at: existing.created_at,
        updated_at: existing.updated_at,
        topic_name: topic.file_name.replace(/\.[^.]+$/, ""),
        subject: topic.subjects,
        subject_id: topic.subject_id,
      };
    }

    // 2. Generate via Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const topicName = topic.file_name.replace(/\.[^.]+$/, "");
    const subj = topic.subjects as any;
    const seed = `${context.userId}-${data.topic_id}`.slice(0, 24);

    const systemPrompt = `You are an academic tutor creating personalized study notes for a student. Produce clear, student-friendly notes in Markdown with proper headings (##, ###) and bullet points. Keep the same academic meaning as a standard lecture on this topic, but use a unique wording/style based on the student seed provided so different students receive different phrasings. Do NOT copy verbatim from any source. Notes should be comprehensive yet easy to understand.`;

    const userPrompt = `Generate personalized study notes for the following lecture topic.

Subject: ${subj?.subject_name ?? "Unknown"} (${subj?.subject_code ?? ""}) — ${subj?.level ?? ""}
${subj?.description ? `Subject description: ${subj.description}\n` : ""}Topic: ${topicName}

Student seed (use to vary wording/style, do NOT mention this in output): ${seed}

Output structure:
# ${topicName}
## Overview
## Key Concepts
## Detailed Explanation
## Examples
## Summary`;

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
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      throw new Error(`AI generation failed [${resp.status}]: ${body}`);
    }

    const json = await resp.json();
    const notesContent: string = json?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!notesContent) throw new Error("AI returned empty notes.");

    // 3. Save exactly one note per student + topic. The database unique constraint
    // prevents duplicates; if another request saved first, load that saved note.
    const { data: saved, error: insErr } = await context.supabase
      .from("student_topic_notes")
      .insert({
        student_id: context.userId,
        topic_id: data.topic_id,
        subject_id: topic.subject_id,
        notes_content: notesContent,
      })
      .select("notes_content, created_at, updated_at")
      .single();
    if (insErr) {
      if (insErr.code === "23505") {
        const { data: savedExisting, error: savedExistingErr } = await context.supabase
          .from("student_topic_notes")
          .select("notes_content, created_at, updated_at")
          .eq("student_id", context.userId)
          .eq("topic_id", data.topic_id)
          .maybeSingle();

        if (savedExistingErr) throw new Error(savedExistingErr.message);
        if (savedExisting) {
          console.log("Existing notes found - loading saved notes");
          return {
            notes_content: savedExisting.notes_content,
            created_at: savedExisting.created_at,
            updated_at: savedExisting.updated_at,
            topic_name: topicName,
            subject: topic.subjects,
            subject_id: topic.subject_id,
          };
        }
      }

      throw new Error(insErr.message);
    }

    return {
      notes_content: saved.notes_content,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
      topic_name: topicName,
      subject: topic.subjects,
      subject_id: topic.subject_id,
    };
  });
