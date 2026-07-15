import { createServerFn } from "@tanstack/react-start";
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
