import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const studentIdRegex = /^\d{4}D\d{4}$/;

const addStudentSchema = z.object({
  student_id: z.string().regex(studentIdRegex, "Student ID must match YYYYDXXXX"),
  full_name: z.string().trim().min(1).max(200),
  phone_number: z.string().trim().min(1).max(50),
  program: z.literal("NCC"),
});

const deleteStudentSchema = z.object({ id: z.string().uuid() });

export const listPreRegisteredStudents = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("pre_registered_students")
      .select("id, student_id, full_name, phone_number, program, email, status, register_status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const addPreRegisteredStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => addStudentSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `${data.student_id.toLowerCase()}@student.strategyfirst.edu.mm`;

    const { data: row, error } = await supabaseAdmin
      .from("pre_registered_students")
      .insert({
        student_id: data.student_id,
        full_name: data.full_name,
        phone_number: data.phone_number,
        program: data.program,
        email,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("A student with this ID or email already exists.");
      }
      throw new Error(error.message);
    }
    return row;
  });

export const deletePreRegisteredStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteStudentSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("pre_registered_students")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
