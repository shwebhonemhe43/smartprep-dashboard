import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      studentsRes,
      studentsWeekRes,
      lecturesRes,
      lecturesWeekRes,
      questionsRes,
      plansRes,
      plansWeekRes,
      activeQuizRes,
      activeNotesRes,
      activeFlashRes,
    ] = await Promise.all([
      supabaseAdmin.from("student_profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("student_profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabaseAdmin.from("lecture_files").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("lecture_files")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabaseAdmin.from("old_questions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("study_plans").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("study_plans")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabaseAdmin
        .from("quiz_attempts")
        .select("student_id")
        .gte("created_at", weekAgo),
      supabaseAdmin
        .from("study_session_notes")
        .select("student_id")
        .gte("created_at", weekAgo),
      supabaseAdmin
        .from("saved_flashcards")
        .select("student_id")
        .gte("created_at", weekAgo),
    ]);

    const active = new Set<string>();
    for (const row of activeQuizRes.data ?? []) if (row.student_id) active.add(row.student_id);
    for (const row of activeNotesRes.data ?? []) if (row.student_id) active.add(row.student_id);
    for (const row of activeFlashRes.data ?? []) if (row.student_id) active.add(row.student_id);

    return {
      totalStudents: studentsRes.count ?? 0,
      newStudentsThisWeek: studentsWeekRes.count ?? 0,
      totalResources: (lecturesRes.count ?? 0) + (questionsRes.count ?? 0),
      newResourcesThisWeek: lecturesWeekRes.count ?? 0,
      activeThisWeek: active.size,
      totalStudyPlans: plansRes.count ?? 0,
      newStudyPlansThisWeek: plansWeekRes.count ?? 0,
    };
  });

export type AdminActivity = {
  title: string;
  when: string;
  tag: "Students" | "Resources" | "Study Plans";
};

export const getAdminActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminActivity[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [approvals, students, lectures, questions, plans] = await Promise.all([
      supabaseAdmin
        .from("student_profiles")
        .select("full_name, created_at, approval_status")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("student_profiles")
        .select("full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("lecture_files")
        .select("file_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("old_questions")
        .select("file_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("study_plans")
        .select("title, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const items: (AdminActivity & { ts: number })[] = [];

    for (const r of approvals.data ?? []) {
      items.push({
        title: `Approved ${r.full_name}`,
        when: r.created_at as string,
        tag: "Students",
        ts: new Date(r.created_at as string).getTime(),
      });
    }
    for (const r of students.data ?? []) {
      items.push({
        title: `New student registered: ${r.full_name}`,
        when: r.created_at as string,
        tag: "Students",
        ts: new Date(r.created_at as string).getTime(),
      });
    }
    for (const r of lectures.data ?? []) {
      items.push({
        title: `Uploaded lecture "${r.file_name}"`,
        when: r.created_at as string,
        tag: "Resources",
        ts: new Date(r.created_at as string).getTime(),
      });
    }
    for (const r of questions.data ?? []) {
      items.push({
        title: `Uploaded old question "${r.file_name}"`,
        when: r.created_at as string,
        tag: "Resources",
        ts: new Date(r.created_at as string).getTime(),
      });
    }
    for (const r of plans.data ?? []) {
      items.push({
        title: `Study plan created: ${r.title ?? "Untitled"}`,
        when: r.created_at as string,
        tag: "Study Plans",
        ts: new Date(r.created_at as string).getTime(),
      });
    }

    items.sort((a, b) => b.ts - a.ts);
    return items.slice(0, 8).map(({ ts: _ts, ...rest }) => rest);
  });
