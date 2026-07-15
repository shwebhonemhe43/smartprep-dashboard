import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subjectIdSchema = z.object({ subject_id: z.string().uuid() });

export const listMyEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("student_subject_enrollments")
      .select("subject_id, enrolled_at")
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const enrollInSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => subjectIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("student_subject_enrollments")
      .insert({ student_id: context.userId, subject_id: data.subject_id });
    if (error && (error as any).code !== "23505") throw new Error(error.message);
    return { ok: true };
  });
