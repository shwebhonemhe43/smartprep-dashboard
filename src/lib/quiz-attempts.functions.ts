import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  topic_id: z.string().uuid(),
  subject_id: z.string().uuid().nullable().optional(),
  correct_count: z.number().int().min(0),
  total_count: z.number().int().min(1),
});

export const recordQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => schema.parse(i))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;
    const pct = Math.round((data.correct_count / data.total_count) * 100);
    const { error } = await sb.from("quiz_attempts").insert({
      student_id: context.userId,
      topic_id: data.topic_id,
      subject_id: data.subject_id ?? null,
      correct_count: data.correct_count,
      total_count: data.total_count,
      score_pct: pct,
    });
    if (error) throw new Error(error.message);
    return { ok: true, score_pct: pct };
  });
