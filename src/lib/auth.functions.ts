import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PROGRAM_OPTIONS = [
  "NCC Level 3",
  "NCC Level 4",
  "NCC Level 5",
  "HNC",
  "HND",
] as const;

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  full_name: z.string().trim().min(1).max(200),
  password: z.string().min(6).max(200),
  program: z.enum(PROGRAM_OPTIONS),
});

export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up any existing pre-registered record for this email (optional).
    const { data: pre } = await supabaseAdmin
      .from("pre_registered_students")
      .select("id, full_name, program, status, email")
      .eq("email", data.email)
      .maybeSingle();

    if (pre?.status === "registered") {
      throw new Error("This student has already registered. Please log in instead.");
    }

    const full_name = data.full_name;
    const program = data.program;

    // Create the auth user.
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name, program },
    });

    if (createErr || !created?.user) {
      throw new Error(createErr?.message ?? "Could not create account.");
    }

    // Create the student profile (starts as pending approval).
    const { error: profileErr } = await supabaseAdmin.from("student_profiles").insert({
      auth_user_id: created.user.id,
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
        .update({
          status: "registered",
          register_status: "self-register",
          full_name,
          program,
        })
        .eq("id", pre.id);
    } else {
      await supabaseAdmin.from("pre_registered_students").insert({
        full_name,
        email: data.email,
        phone_number: "",
        program,
        status: "registered",
        register_status: "self-register",
      });
    }

    return { ok: true };
  });
