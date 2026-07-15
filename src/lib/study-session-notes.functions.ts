import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ study_plan_item_id: z.string().uuid() });

export type SessionNotes = {
  notes_content: string;
  created_at: string;
  updated_at: string;
  session_title: string;
  session_description: string | null;
};

export const getOrGenerateSessionNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }): Promise<SessionNotes> => {
    const { data: item, error: itemErr } = await context.supabase
      .from("study_plan_items")
      .select("id, title, description, subject_id, topic_id, student_id")
      .eq("id", data.study_plan_item_id)
      .maybeSingle();
    if (itemErr) throw new Error(itemErr.message);
    if (!item) throw new Error("Study session not found");
    if (item.student_id !== context.userId) throw new Error("Forbidden");

    const { data: existing, error: exErr } = await context.supabase
      .from("study_session_notes")
      .select("notes_content, created_at, updated_at")
      .eq("student_id", context.userId)
      .eq("study_plan_item_id", data.study_plan_item_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    if (existing) {
      return {
        notes_content: existing.notes_content,
        created_at: existing.created_at,
        updated_at: existing.updated_at,
        session_title: item.title,
        session_description: item.description,
      };
    }

    // Load subject + topic context if available
    let subjectInfo: any = null;
    if (item.subject_id) {
      const { data: subj } = await context.supabase
        .from("subjects")
        .select("subject_code, subject_name, level, description")
        .eq("id", item.subject_id)
        .maybeSingle();
      subjectInfo = subj;
    }
    let topicName: string | null = null;
    if (item.topic_id) {
      const { data: topic } = await context.supabase
        .from("lecture_files")
        .select("file_name")
        .eq("id", item.topic_id)
        .maybeSingle();
      if (topic?.file_name) topicName = topic.file_name.replace(/\.[^.]+$/, "");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an academic tutor generating focused study notes for one specific study session. Produce clear, student-friendly Markdown with proper headings (##, ###) and bullet points. Keep the notes SCOPED strictly to the session title/topic — do not stray to unrelated material.`;

    const userPrompt = `Generate concise personalized study notes for THIS specific session only.

${subjectInfo ? `Subject: ${subjectInfo.subject_name} (${subjectInfo.subject_code})${subjectInfo.level ? ` — ${subjectInfo.level}` : ""}\n${subjectInfo.description ? `Subject description: ${subjectInfo.description}\n` : ""}` : ""}${topicName ? `Related Topic: ${topicName}\n` : ""}Session Title: ${item.title}
${item.description ? `Session Focus: ${item.description}\n` : ""}
Output structure:
# ${item.title}
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

    const { data: saved, error: insErr } = await context.supabase
      .from("study_session_notes")
      .insert({
        student_id: context.userId,
        study_plan_item_id: data.study_plan_item_id,
        subject_id: item.subject_id,
        topic_id: item.topic_id,
        notes_content: notesContent,
      })
      .select("notes_content, created_at, updated_at")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        const { data: again } = await context.supabase
          .from("study_session_notes")
          .select("notes_content, created_at, updated_at")
          .eq("student_id", context.userId)
          .eq("study_plan_item_id", data.study_plan_item_id)
          .single();
        if (again) {
          return {
            notes_content: again.notes_content,
            created_at: again.created_at,
            updated_at: again.updated_at,
            session_title: item.title,
            session_description: item.description,
          };
        }
      }
      throw new Error(insErr.message);
    }

    return {
      notes_content: saved.notes_content,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
      session_title: item.title,
      session_description: item.description,
    };
  });
