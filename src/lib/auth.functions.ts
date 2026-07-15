import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const programLevels = {
  NCC: ["NCC Level 3", "NCC Level 4", "NCC Level 5"],
  HNC: ["Level 4"],
  HND: ["Level 5"],
} as const;

const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    full_name: z.string().trim().min(1).max(200),
    password: z.string().min(6).max(200),
    program: z.enum(["NCC", "HNC", "HND"]),
    level: z.string().trim().min(1).max(50),
  })
  .refine((v) => (programLevels[v.program] as readonly string[]).includes(v.level), {
    message: "Invalid level for selected program",
    path: ["level"],
  });

function deriveStudentIdFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local.toUpperCase();
}

export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up any existing pre-registered record for this email (optional).
    const { data: pre } = await supabaseAdmin
      .from("pre_registered_students")
      .select("id, student_id, full_name, program, status, email")
      .eq("email", data.email)
      .maybeSingle();

    if (pre?.status === "registered") {
      throw new Error("This student has already registered. Please log in instead.");
    }

    const student_id = pre?.student_id ?? deriveStudentIdFromEmail(data.email);
    const full_name = pre?.full_name ?? data.full_name;
    const program = data.program ?? pre?.program ?? "NCC";
    const level = data.level;

    // Create the auth user.
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name, program, level, student_id },
    });

    if (createErr || !created?.user) {
      throw new Error(createErr?.message ?? "Could not create account.");
    }

    // Create the student profile (starts as pending approval).
    const { error: profileErr } = await supabaseAdmin.from("student_profiles").insert({
      auth_user_id: created.user.id,
      student_id,
      full_name,
      email: data.email,
      program,
    });

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileErr.message);
    }

    // Track in pre_registered_students so it appears in the admin list.
    if (pre) {
      await supabaseAdmin
        .from("pre_registered_students")
        .update({ status: "registered", register_status: "admin-register" })
        .eq("id", pre.id);
    } else {
      await supabaseAdmin.from("pre_registered_students").insert({
        student_id,
        full_name,
        email: data.email,
        phone_number: "",
        program,
        status: "registered",
        register_status: "admin-register",
      });
    }

    return { ok: true };
  });
