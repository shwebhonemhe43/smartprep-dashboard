import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ topic_id: z.string().uuid() });

export type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
  explanation?: string;
};

export const getOrGenerateTopicQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    console.log("topic_id received:", data.topic_id);

    const { data: topic, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id, file_name, subject_id, subjects(subject_code, subject_name, level)")
      .eq("id", data.topic_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!topic) throw new Error("Topic not found");

    const topicName = topic.file_name.replace(/\.[^.]+$/, "");

    // 1. Existing quiz?
    const { data: existing, error: exErr } = await context.supabase
      .from("student_topic_quizzes")
      .select("quiz, created_at, updated_at")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    if (existing) {
      console.log("Existing quiz found - loading saved quiz");
      return {
        quiz: existing.quiz as QuizQuestion[],
        created_at: existing.created_at,
        updated_at: existing.updated_at,
        topic_name: topicName,
        subject: topic.subjects,
        subject_id: topic.subject_id,
      };
    }

    console.log("No quiz found - generating AI quiz");

    // 2. Need saved notes
    const { data: notesRow, error: nErr } = await context.supabase
      .from("student_topic_notes")
      .select("notes_content")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!notesRow?.notes_content) {
      throw new Error("Please open the Notes for this topic first — the quiz is generated from your saved notes.");
    }
    console.log("Notes loaded successfully");

    // 3. Generate
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You create study quizzes from a student's lecture notes. Return ONLY strict JSON: an object with a "quiz" array of 10 multiple-choice questions. Each item = { "question": string, "options": string[4], "answer_index": number (0-3), "explanation": string }. No markdown, no code fences.`;
    const userPrompt = `Topic: ${topicName}
Subject: ${(topic.subjects as any)?.subject_name ?? ""}

Notes:
${notesRow.notes_content}

Generate 10 MCQ questions as JSON: {"quiz":[{"question":"...","options":["A","B","C","D"],"answer_index":0,"explanation":"..."}]}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
    let parsed: { quiz?: QuizQuestion[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    const quiz = (parsed.quiz ?? [])
      .filter(
        (q) =>
          q &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          typeof q.answer_index === "number" &&
          q.answer_index >= 0 &&
          q.answer_index < q.options.length,
      )
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => String(o).trim()),
        answer_index: q.answer_index,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
      }));
    if (quiz.length === 0) throw new Error("AI returned no quiz questions.");
    console.log(`Generated ${quiz.length} questions`);

    const { data: saved, error: insErr } = await context.supabase
      .from("student_topic_quizzes")
      .insert({
        student_id: context.userId,
        topic_id: data.topic_id,
        subject_id: topic.subject_id,
        quiz,
      })
      .select("quiz, created_at, updated_at")
      .single();

    if (insErr) {
      if (insErr.code === "23505") {
        const { data: race } = await context.supabase
          .from("student_topic_quizzes")
          .select("quiz, created_at, updated_at")
          .eq("student_id", context.userId)
          .eq("topic_id", data.topic_id)
          .maybeSingle();
        if (race) {
          return {
            quiz: race.quiz as QuizQuestion[],
            created_at: race.created_at,
            updated_at: race.updated_at,
            topic_name: topicName,
            subject: topic.subjects,
          };
        }
      }
      throw new Error(`Database insert failed: ${insErr.message}`);
    }

    console.log("Quiz saved successfully");
    return {
      quiz: saved.quiz as QuizQuestion[],
      created_at: saved.created_at,
      updated_at: saved.updated_at,
      topic_name: topicName,
      subject: topic.subjects,
    };
  });
