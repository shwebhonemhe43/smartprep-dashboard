import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  subject_id: z.string().uuid(),
  file_name: z.string().trim().min(1).max(300),
  file_type: z.string().trim().min(1).max(20),
  file_url: z.string().trim().min(1).max(500),
});

const idSchema = z.object({ id: z.string().uuid() });
const signSchema = z.object({ path: z.string().trim().min(1) });

export const listLectureFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("lecture_files")
      .select(
        "id, subject_id, file_name, file_type, file_url, uploaded_by, created_at, subjects(subject_code, subject_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLectureFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("lecture_files")
      .insert({
        subject_id: data.subject_id,
        file_name: data.file_name,
        file_type: data.file_type,
        file_url: data.file_url,
        uploaded_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteLectureFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing, error: fetchErr } = await context.supabase
      .from("lecture_files")
      .select("file_url")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (existing?.file_url) {
      await context.supabase.storage.from("lecture-files").remove([existing.file_url]);
    }
    const { error } = await context.supabase
      .from("lecture_files")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signLectureFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => signSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("lecture-files")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
