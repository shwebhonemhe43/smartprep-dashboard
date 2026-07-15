import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyApprovalStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("student_profiles")
      .select("approval_status, full_name, student_id")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const listPendingApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("student_profiles")
      .select("id, auth_user_id, student_id, full_name, email, program, created_at, approval_status")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listStudentProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("student_profiles")
      .select("id, student_id, full_name, email, program, approval_status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const approveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from("student_profiles")
      .select("id, student_id, full_name, email, program")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!profile) throw new Error("Student profile not found.");

    const { error } = await supabaseAdmin
      .from("student_profiles")
      .update({ approval_status: "approved" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const { data: existing } = await supabaseAdmin
      .from("pre_registered_students")
      .select("id")
      .eq("email", profile.email)
      .maybeSingle();

    if (existing) {
      const { error: upErr } = await supabaseAdmin
        .from("pre_registered_students")
        .update({
          status: "registered",
          register_status: "admin-register",
          student_id: profile.student_id,
          full_name: profile.full_name,
          program: profile.program ?? "NCC",
        })
        .eq("id", existing.id);
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: insErr } = await supabaseAdmin
        .from("pre_registered_students")
        .insert({
          student_id: profile.student_id,
          full_name: profile.full_name,
          email: profile.email,
          phone_number: "-",
          program: profile.program ?? "NCC",
          status: "registered",
          register_status: "admin-register",
        });
      if (insErr) throw new Error(insErr.message);
    }

    return { ok: true };
  });

