import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMySubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error: pErr } = await context.supabase
      .from("student_profiles")
      .select("program")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);

    const program = profile?.program ?? null;
    if (!program) return { program: null, subjects: [] as Array<any> };

    const { data, error } = await context.supabase
      .from("subjects")
      .select("id, subject_code, subject_name, level, description")
      .eq("level", program)
      .order("subject_code", { ascending: true });
    if (error) throw new Error(error.message);
    return { program, subjects: data ?? [] };
  });

const idSchema = z.object({ id: z.string().uuid() });
const signSchema = z.object({ path: z.string().trim().min(1) });

export const getSubjectWithTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: subject, error: sErr } = await context.supabase
      .from("subjects")
      .select("id, subject_code, subject_name, level, description")
      .eq("id", data.id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!subject) throw new Error("Subject not found");

    const { data: topics, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id, file_name, file_type, file_url, created_at")
      .eq("subject_id", data.id)
      .order("created_at", { ascending: true });
    if (tErr) throw new Error(tErr.message);

    return { subject, topics: topics ?? [] };
  });

export const signLectureUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => signSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("lecture-files")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
