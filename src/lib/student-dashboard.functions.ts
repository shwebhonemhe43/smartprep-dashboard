import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DashboardActivity = {
  kind: "quiz" | "test" | "flashcards" | "notes" | "session" | "topic";
  what: string;
  when: string; // ISO
  score?: string;
};

export type TodaySession = {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  completed: boolean;
};

export type WeekPlanEntry = {
  name: string;
  total: number;
  done: number;
};

export type StudentDashboard = {
  totals: {
    subjects_enrolled: number;
    topics_completed: number;
    topics_total: number;
    quiz_avg_pct: number | null;
    quiz_attempt_count: number;
    upcoming_exam: { subject_name: string; exam_date: string; days_remaining: number } | null;
  };
  week_plan: WeekPlanEntry[];
  today: TodaySession[];
  activity: DashboardActivity[];
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function weekEndISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentDashboard> => {
    const uid = context.userId;
    const sb: any = context.supabase;

    // Enrollments + enrolled subject_ids
    const { data: enrollments } = await sb
      .from("student_subject_enrollments")
      .select("subject_id")
      .eq("student_id", uid);
    const enrolledIds: string[] = (enrollments ?? []).map((e: any) => e.subject_id);

    // Total topics across enrolled subjects
    let topicsTotal = 0;
    let enrolledTopicIds: string[] = [];
    if (enrolledIds.length > 0) {
      const { data: topics } = await sb
        .from("lecture_files")
        .select("id")
        .in("subject_id", enrolledIds);
      enrolledTopicIds = (topics ?? []).map((t: any) => t.id);
      topicsTotal = enrolledTopicIds.length;
    }

    // Completed topics for this student
    const { data: prog } = await sb
      .from("student_topic_progress")
      .select("topic_id, completed_at, updated_at, notes_completed, quiz_completed, flashcards_completed")
      .eq("student_id", uid);
    const progRows = (prog ?? []) as Array<{
      topic_id: string;
      completed_at: string | null;
      updated_at: string;
      notes_completed: boolean;
      quiz_completed: boolean;
      flashcards_completed: boolean;
    }>;
    const topicsCompleted = progRows.filter((p) => p.completed_at).length;

    // Quiz accuracy from study_session_tests (real completed scores)
    const { data: tests } = await sb
      .from("study_session_tests")
      .select("score, completed_at, study_plan_item_id")
      .eq("student_id", uid)
      .not("score", "is", null);
    const testRows = (tests ?? []) as Array<{ score: number; completed_at: string | null; study_plan_item_id: string }>;
    const quizAvg =
      testRows.length > 0
        ? Math.round(testRows.reduce((n, t) => n + Number(t.score ?? 0), 0) / testRows.length)
        : null;

    // Upcoming exam
    const today = todayISO();
    const { data: plans } = await sb
      .from("study_plans")
      .select("id, exam_date, subject_id")
      .eq("student_id", uid)
      .gte("exam_date", today)
      .order("exam_date", { ascending: true })
      .limit(1);
    let upcoming: StudentDashboard["totals"]["upcoming_exam"] = null;
    if (plans && plans.length > 0) {
      const p = plans[0];
      let subjectName = "Upcoming exam";
      if (p.subject_id) {
        const { data: s } = await sb
          .from("subjects")
          .select("subject_name")
          .eq("id", p.subject_id)
          .maybeSingle();
        if (s?.subject_name) subjectName = s.subject_name;
      }
      const days = Math.max(
        0,
        Math.ceil((new Date(p.exam_date).getTime() - new Date(today).getTime()) / 86400000),
      );
      upcoming = { subject_name: subjectName, exam_date: p.exam_date, days_remaining: days };
    }

    // This week's plan items
    const weekEnd = weekEndISO();
    const { data: weekItems } = await sb
      .from("study_plan_items")
      .select("id, title, date, completed")
      .eq("student_id", uid)
      .gte("date", today)
      .lte("date", weekEnd);
    const byTitle = new Map<string, WeekPlanEntry>();
    for (const it of (weekItems ?? []) as Array<{ title: string; completed: boolean }>) {
      const cur = byTitle.get(it.title) ?? { name: it.title, total: 0, done: 0 };
      cur.total += 1;
      if (it.completed) cur.done += 1;
      byTitle.set(it.title, cur);
    }
    const week_plan = Array.from(byTitle.values()).slice(0, 5);

    // Today's sessions
    const { data: todayItems } = await sb
      .from("study_plan_items")
      .select("id, title, description, start_time, end_time, duration_minutes, completed")
      .eq("student_id", uid)
      .eq("date", today)
      .order("start_time", { ascending: true, nullsFirst: true });
    const todaySessions: TodaySession[] = (todayItems ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      start_time: r.start_time ? String(r.start_time).slice(0, 5) : null,
      end_time: r.end_time ? String(r.end_time).slice(0, 5) : null,
      duration_minutes: r.duration_minutes,
      completed: !!r.completed,
    }));

    // Recent activity — collect + sort desc
    const activity: DashboardActivity[] = [];

    for (const t of testRows) {
      if (!t.completed_at) continue;
      activity.push({
        kind: "test",
        what: "Completed session test",
        when: t.completed_at,
        score: `${Math.round(Number(t.score))}%`,
      });
    }

    const { data: recentQuizzes } = await sb
      .from("student_topic_quizzes")
      .select("topic_id, updated_at, created_at")
      .eq("student_id", uid)
      .order("updated_at", { ascending: false })
      .limit(10);
    const quizTopicIds = (recentQuizzes ?? []).map((q: any) => q.topic_id).filter(Boolean);

    const { data: recentFlash } = await sb
      .from("student_topic_flashcards")
      .select("topic_id, updated_at, created_at")
      .eq("student_id", uid)
      .order("updated_at", { ascending: false })
      .limit(10);
    const flashTopicIds = (recentFlash ?? []).map((f: any) => f.topic_id).filter(Boolean);

    const { data: recentNotes } = await sb
      .from("student_topic_notes")
      .select("topic_id, updated_at")
      .eq("student_id", uid)
      .order("updated_at", { ascending: false })
      .limit(10);
    const noteTopicIds = (recentNotes ?? []).map((n: any) => n.topic_id).filter(Boolean);

    // Completed sessions
    const { data: completedSessions } = await sb
      .from("study_plan_items")
      .select("title, completed_at")
      .eq("student_id", uid)
      .eq("completed", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10);
    for (const s of (completedSessions ?? []) as Array<{ title: string; completed_at: string }>) {
      activity.push({ kind: "session", what: `Completed session: ${s.title}`, when: s.completed_at });
    }

    // Completed topics
    for (const p of progRows) {
      if (p.completed_at) {
        activity.push({ kind: "topic", what: `Finished a topic`, when: p.completed_at });
      }
    }

    // Resolve topic names in one batch
    const topicIdSet = new Set<string>([...quizTopicIds, ...flashTopicIds, ...noteTopicIds]);
    const topicNames = new Map<string, string>();
    if (topicIdSet.size > 0) {
      const { data: files } = await sb
        .from("lecture_files")
        .select("id, file_name")
        .in("id", Array.from(topicIdSet));
      for (const f of (files ?? []) as Array<{ id: string; file_name: string }>) {
        topicNames.set(f.id, f.file_name.replace(/\.[^.]+$/, ""));
      }
    }
    for (const q of (recentQuizzes ?? []) as Array<{ topic_id: string; updated_at: string }>) {
      activity.push({
        kind: "quiz",
        what: `Quiz — ${topicNames.get(q.topic_id) ?? "Topic"}`,
        when: q.updated_at,
      });
    }
    for (const f of (recentFlash ?? []) as Array<{ topic_id: string; updated_at: string }>) {
      activity.push({
        kind: "flashcards",
        what: `Reviewed flashcards — ${topicNames.get(f.topic_id) ?? "Topic"}`,
        when: f.updated_at,
      });
    }
    for (const n of (recentNotes ?? []) as Array<{ topic_id: string; updated_at: string }>) {
      activity.push({
        kind: "notes",
        what: `Viewed notes — ${topicNames.get(n.topic_id) ?? "Topic"}`,
        when: n.updated_at,
      });
    }

    activity.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    return {
      totals: {
        subjects_enrolled: enrolledIds.length,
        topics_completed: topicsCompleted,
        topics_total: topicsTotal,
        quiz_avg_pct: quizAvg,
        quiz_attempt_count: testRows.length,
        upcoming_exam: upcoming,
      },
      week_plan,
      today: todaySessions,
      activity: activity.slice(0, 8),
    };
  });
