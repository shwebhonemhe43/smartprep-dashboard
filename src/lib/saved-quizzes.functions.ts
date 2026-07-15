import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer_index: z.number(),
  explanation: z.string().optional(),
});

const saveSchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  topic_id: z.string().uuid().nullable().optional(),
  subject_name: z.string(),
  topic_name: z.string(),
  questions: z.array(questionSchema).min(1),
});

export const saveQuizSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => saveSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_quizzes")
      .upsert(
        {
          student_id: context.userId,
          subject_id: data.subject_id ?? null,
          topic_id: data.topic_id ?? null,
          subject_name: data.subject_name,
          topic_name: data.topic_name,
          questions: data.questions,
          question_count: data.questions.length,
        },
        { onConflict: "student_id,topic_id" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listSavedQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_quizzes")
      .select("id, subject_name, topic_name, question_count, created_at, topic_id")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSavedQuizSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_quizzes")
      .select("id, subject_name, topic_name, questions, created_at")
      .eq("id", data.id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Saved quiz not found");
    return {
      id: row.id,
      subject_name: row.subject_name,
      topic_name: row.topic_name,
      questions: row.questions as {
        question: string;
        options: string[];
        answer_index: number;
        explanation?: string;
      }[],
      created_at: row.created_at,
    };
  });

export const checkQuizSaved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ topic_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("saved_quizzes")
      .select("id")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    return { saved: !!row };
  });

export const deleteSavedQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_quizzes")
      .delete()
      .eq("id", data.id)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
