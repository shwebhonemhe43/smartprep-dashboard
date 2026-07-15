import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const flashcardSchema = z.object({ front: z.string(), back: z.string() });

const saveSchema = z.object({
  subject_id: z.string().uuid().nullable().optional(),
  topic_id: z.string().uuid().nullable().optional(),
  subject_name: z.string(),
  topic_name: z.string(),
  flashcards: z.array(flashcardSchema).min(1),
});

export const saveFlashcardSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => saveSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_flashcards")
      .upsert(
        {
          student_id: context.userId,
          subject_id: data.subject_id ?? null,
          topic_id: data.topic_id ?? null,
          subject_name: data.subject_name,
          topic_name: data.topic_name,
          flashcards: data.flashcards,
        },
        { onConflict: "student_id,topic_id" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listSavedFlashcards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_flashcards")
      .select("id, subject_name, topic_name, flashcards, created_at, topic_id")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      subject_name: r.subject_name,
      topic_name: r.topic_name,
      count: Array.isArray(r.flashcards) ? (r.flashcards as unknown[]).length : 0,
      created_at: r.created_at,
      topic_id: r.topic_id,
    }));
  });

export const getSavedFlashcardSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("saved_flashcards")
      .select("id, subject_name, topic_name, flashcards, created_at")
      .eq("id", data.id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Saved flashcards not found");
    return {
      id: row.id,
      subject_name: row.subject_name,
      topic_name: row.topic_name,
      flashcards: row.flashcards as { front: string; back: string }[],
      created_at: row.created_at,
    };
  });

export const checkFlashcardSaved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ topic_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("saved_flashcards")
      .select("id")
      .eq("student_id", context.userId)
      .eq("topic_id", data.topic_id)
      .maybeSingle();
    return { saved: !!row };
  });

export const deleteSavedFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_flashcards")
      .delete()
      .eq("id", data.id)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
