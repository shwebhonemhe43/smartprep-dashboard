import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subjectSchema = z.object({
  subject_code: z.string().trim().min(1).max(50),
  subject_name: z.string().trim().min(1).max(200),
  level: z.string().trim().min(1).max(100).default("NCC Level 4"),
  description: z.string().trim().max(2000).optional().nullable(),
});

const updateSchema = subjectSchema.extend({ id: z.string().uuid() });
const idSchema = z.object({ id: z.string().uuid() });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subjects")
      .select("id, subject_code, subject_name, level, description, created_at")
      .order("subject_code", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => subjectSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("subjects")
      .insert({
        subject_code: data.subject_code,
        subject_name: data.subject_name,
        level: data.level,
        description: data.description ?? null,
      })
      .select()
      .single();
    if (error) {
      if ((error as any).code === "23505") {
        throw new Error("A subject with this code already exists.");
      }
      throw new Error(error.message);
    }
    return row;
  });

export const updateSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    const { data: row, error } = await context.supabase
      .from("subjects")
      .update({
        subject_code: fields.subject_code,
        subject_name: fields.subject_name,
        level: fields.level,
        description: fields.description ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if ((error as any).code === "23505") {
        throw new Error("A subject with this code already exists.");
      }
      throw new Error(error.message);
    }
    return row;
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("subjects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
