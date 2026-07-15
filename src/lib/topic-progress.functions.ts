import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProgressRow = {
  topic_id: string;
  notes_completed: boolean;
  flashcards_completed: boolean;
  quiz_completed: boolean;
  progress_percentage: number;
  completed_at: string | null;
};

const markSchema = z.object({
  topic_id: z.string().uuid(),
  kind: z.enum(["notes", "flashcards", "quiz"]),
});

const subjectSchema = z.object({ subject_id: z.string().uuid() });

function calcPercent(n: boolean, f: boolean, q: boolean) {
  return (n ? 33 : 0) + (f ? 33 : 0) + (q ? 34 : 0);
}

export const listMyProgressForSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => subjectSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: topics, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id")
      .eq("subject_id", data.subject_id);
    if (tErr) throw new Error(tErr.message);
    const ids = (topics ?? []).map((t) => t.id);
    if (ids.length === 0) return { progress: [] as ProgressRow[] };

    const { data: rows, error } = await context.supabase
      .from("student_topic_progress")
      .select("topic_id, notes_completed, flashcards_completed, quiz_completed, progress_percentage, completed_at")
      .eq("student_id", context.userId)
      .in("topic_id", ids);
    if (error) throw new Error(error.message);
    return { progress: (rows ?? []) as ProgressRow[] };
  });

export const markTopicProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => markSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing, error: exErr } = await context.supabase
      .from("student_topic_progress")
      .select("id, notes_completed, flashcards_completed, quiz_completed")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    const next = {
      notes_completed: existing?.notes_completed ?? false,
      flashcards_completed: existing?.flashcards_completed ?? false,
      quiz_completed: existing?.quiz_completed ?? false,
    };
    if (data.kind === "notes") next.notes_completed = true;
    if (data.kind === "flashcards") next.flashcards_completed = true;
    if (data.kind === "quiz") next.quiz_completed = true;

    const percent = calcPercent(next.notes_completed, next.flashcards_completed, next.quiz_completed);
    const completed_at = percent >= 100 ? new Date().toISOString() : null;

    if (existing) {
      const { error } = await context.supabase
        .from("student_topic_progress")
        .update({ ...next, progress_percentage: percent, completed_at })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("student_topic_progress")
        .insert({
          student_id: context.userId,
          topic_id: data.topic_id,
          ...next,
          progress_percentage: percent,
          completed_at,
        });
      if (error && error.code !== "23505") throw new Error(error.message);
    }

    return { ok: true, progress_percentage: percent, ...next };
  });
