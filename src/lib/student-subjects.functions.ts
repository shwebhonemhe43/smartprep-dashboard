import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

    const { data: subjects, error } = await context.supabase
      .from("subjects")
      .select("id, subject_code, subject_name, level, description")
      .eq("level", program)
      .order("subject_code", { ascending: true });
    if (error) throw new Error(error.message);
    const subjList = subjects ?? [];
    if (subjList.length === 0) return { program, subjects: [] as Array<any> };

    // Fetch all topics for these subjects
    const subjectIds = subjList.map((s) => s.id);
    const { data: topics, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id, subject_id")
      .in("subject_id", subjectIds);
    if (tErr) throw new Error(tErr.message);
    const topicList = topics ?? [];
    const topicIds = topicList.map((t) => t.id);

    // Fetch student progress for these topics
    let progressRows: Array<{ topic_id: string; progress_percentage: number }> = [];
    if (topicIds.length > 0) {
      const { data: pr, error: prErr } = await context.supabase
        .from("student_topic_progress")
        .select("topic_id, progress_percentage")
        .eq("student_id", context.userId)
        .in("topic_id", topicIds);
      if (prErr) throw new Error(prErr.message);
      progressRows = pr ?? [];
    }
    const progressByTopic = new Map(progressRows.map((p) => [p.topic_id, p.progress_percentage]));

    const enriched = subjList.map((s) => {
      const subjTopics = topicList.filter((t) => t.subject_id === s.id);
      const topicCount = subjTopics.length;
      const studyHours = topicCount; // 1 hr per topic estimate
      const totalPct = subjTopics.reduce((sum, t) => sum + (progressByTopic.get(t.id) ?? 0), 0);
      const progress = topicCount > 0 ? Math.round(totalPct / topicCount) : 0;
      return { ...s, topic_count: topicCount, study_hours: studyHours, progress };
    });

    return { program, subjects: enriched };
  });


const idSchema = z.object({ id: z.string().uuid() });
const signSchema = z.object({ path: z.string().trim().min(1) });

export const getSubjectWithTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: subject, error: sErr } = await context.supabase
      .from("subjects")
      .select("id, subject_code, subject_name, level, description")
      .eq("id", data.id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!subject) throw new Error("Subject not found");

    const { data: topics, error: tErr } = await context.supabase
      .from("lecture_files")
      .select("id, file_name, file_type, file_url, created_at")
      .eq("subject_id", data.id)
      .order("created_at", { ascending: true });
    if (tErr) throw new Error(tErr.message);

    return { subject, topics: topics ?? [] };
  });

export const signLectureUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => signSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("lecture-files")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
