import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  full_name: z.string().trim().min(1).max(200),
  password: z.string().min(6).max(200),
});

export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pre, error: lookupErr } = await supabaseAdmin
      .from("pre_registered_students")
      .select("id, student_id, full_name, program, status, email")
      .eq("email", data.email)
      .maybeSingle();

    if (lookupErr) throw new Error(lookupErr.message);

    if (!pre) {
      throw new Error("Your account is not approved by administrator.");
    }

    if (pre.program !== "NCC") {
      throw new Error("Your account is not approved by administrator.");
    }

    if (pre.status === "registered") {
      throw new Error("This student has already registered. Please log in instead.");
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: pre.full_name, program: pre.program, student_id: pre.student_id },
    });

    if (createErr || !created?.user) {
      throw new Error(createErr?.message ?? "Could not create account.");
    }

    const { error: profileErr } = await supabaseAdmin.from("student_profiles").insert({
      auth_user_id: created.user.id,
      student_id: pre.student_id,
      full_name: pre.full_name,
      email: pre.email,
      program: pre.program,
    });

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileErr.message);
    }

    const { error: updErr } = await supabaseAdmin
      .from("pre_registered_students")
      .update({ status: "registered", register_status: "admin-register" })
      .eq("id", pre.id);

    if (updErr) {
      await supabaseAdmin.from("student_profiles").delete().eq("auth_user_id", created.user.id);
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(updErr.message);
    }

    return { ok: true };
  });
