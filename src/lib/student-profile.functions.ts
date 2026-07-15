import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StudentProfile = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  student_id: string | null;
  phone_number: string | null;
  program: string;
  approval_status: string;
  created_at: string;
  stats: {
    subjects_enrolled: number;
    topics_completed: number;
    topics_total: number;
    quiz_avg_pct: number | null;
    quiz_attempt_count: number;
    saved_flashcards: number;
    saved_quizzes: number;
  };
  enrolled_subjects: Array<{ id: string; subject_code: string; subject_name: string; level: string | null }>;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentProfile> => {
    const uid = context.userId;
    const sb: any = context.supabase;

    const { data: profile, error } = await sb
      .from("student_profiles")
      .select("id, auth_user_id, email, full_name, student_id, program, approval_status, created_at")
      .eq("auth_user_id", uid)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Profile not found. Please complete registration.");

    // Phone from pre_registered_students (source of truth for that field)
    let phone: string | null = null;
    const { data: pre } = await sb
      .from("pre_registered_students")
      .select("phone_number")
      .eq("email", profile.email)
      .maybeSingle();
    if (pre?.phone_number) phone = pre.phone_number;

    // Enrolled subjects
    const { data: enrollments } = await sb
      .from("student_subject_enrollments")
      .select("subject_id")
      .eq("student_id", uid);
    const enrolledIds: string[] = (enrollments ?? []).map((e: any) => e.subject_id);

    let enrolled_subjects: StudentProfile["enrolled_subjects"] = [];
    let topics_total = 0;
    if (enrolledIds.length > 0) {
      const { data: subs } = await sb
        .from("subjects")
        .select("id, subject_code, subject_name, level")
        .in("id", enrolledIds)
        .order("subject_code", { ascending: true });
      enrolled_subjects = (subs ?? []) as StudentProfile["enrolled_subjects"];

      const { data: files } = await sb
        .from("lecture_files")
        .select("id")
        .in("subject_id", enrolledIds);
      topics_total = (files ?? []).length;
    }

    const { data: prog } = await sb
      .from("student_topic_progress")
      .select("completed_at")
      .eq("student_id", uid);
    const topics_completed = (prog ?? []).filter((p: any) => p.completed_at).length;

    const { data: tests } = await sb
      .from("study_session_tests")
      .select("score")
      .eq("student_id", uid)
      .not("score", "is", null);
    const testScores = ((tests ?? []) as Array<{ score: number }>).map((t) => Number(t.score));

    const { data: attempts } = await sb
      .from("quiz_attempts")
      .select("score_pct")
      .eq("student_id", uid);
    const attemptScores = ((attempts ?? []) as Array<{ score_pct: number }>).map((a) => Number(a.score_pct));

    const scores = [...testScores, ...attemptScores];
    const quiz_avg_pct =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const { count: saved_flashcards } = await sb
      .from("saved_flashcards")
      .select("id", { count: "exact", head: true })
      .eq("student_id", uid);
    const { count: saved_quizzes } = await sb
      .from("saved_quizzes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", uid);

    return {
      id: profile.id,
      auth_user_id: profile.auth_user_id,
      email: profile.email,
      full_name: profile.full_name,
      student_id: profile.student_id,
      phone_number: phone,
      program: profile.program,
      approval_status: profile.approval_status,
      created_at: profile.created_at,
      stats: {
        subjects_enrolled: enrolledIds.length,
        topics_completed,
        topics_total,
        quiz_avg_pct,
        quiz_attempt_count: scores.length,
        saved_flashcards: saved_flashcards ?? 0,
        saved_quizzes: saved_quizzes ?? 0,
      },
      enrolled_subjects,
    };
  });

const updateSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  phone_number: z.string().trim().max(50).nullable().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => updateSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb: any = context.supabase;

    const { data: profile, error: pErr } = await sb
      .from("student_profiles")
      .update({ full_name: data.full_name })
      .eq("auth_user_id", context.userId)
      .select("email")
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) throw new Error("Profile not found");

    if (data.phone_number !== undefined) {
      const { error: phErr } = await sb
        .from("pre_registered_students")
        .update({ phone_number: data.phone_number ?? "" })
        .eq("email", profile.email);
      if (phErr) throw new Error(phErr.message);
    }
    return { ok: true };
  });
