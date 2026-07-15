import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SLOT_TIMES: Record<string, { start: string; end: string; minutes: number }> = {
  morning: { start: "09:00", end: "12:00", minutes: 180 },
  afternoon: { start: "14:00", end: "17:00", minutes: 180 },
  evening: { start: "19:00", end: "22:00", minutes: 180 },
};

const availableHoursSchema = z.record(
  z.string(),
  z.array(z.enum(["morning", "afternoon", "evening"])),
);

const createSchema = z.object({
  subject_id: z.string().uuid(),
  exam_date: z.string().min(1),
  plan_type: z.enum(["topic", "priority"]),
  proficiency: z.enum(["strong", "medium", "weak"]),
  available_hours: availableHoursSchema,
  priorities: z.array(z.string().trim().min(1)).optional(),
});

const toggleSchema = z.object({
  item_id: z.string().uuid(),
  completed: z.boolean(),
});

const updateSchema = z.object({
  plan_id: z.string().uuid(),
  exam_date: z.string().min(1),
  proficiency: z.enum(["strong", "medium", "weak"]),
  available_hours: availableHoursSchema,
  priorities: z.array(z.string().trim().min(1)).optional(),
});

export type StudyPlan = {
  id: string;
  student_id: string;
  subject_id: string | null;
  plan_type: "topic" | "priority";
  exam_date: string;
  available_hours: Record<string, string[]>;
  priorities: string[] | null;
  subject_proficiency: "strong" | "medium" | "weak" | null;
  generated_plan: any;
  status: string;
  created_at: string;
  updated_at: string;
};

export type StudyPlanItem = {
  id: string;
  study_plan_id: string;
  student_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  subject_id: string | null;
  topic_id: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  completed: boolean;
  completed_at: string | null;
};

export type SubjectRef = { id: string; subject_code: string; subject_name: string };

export type StudyPlanWithStats = {
  plan: StudyPlan;
  subject: SubjectRef | null;
  total_items: number;
  completed_items: number;
};

export const listMyStudyPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: plans, error } = await (context.supabase as any)
      .from("study_plans")
      .select("*")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const planList = (plans ?? []) as StudyPlan[];
    if (planList.length === 0) return [] as StudyPlanWithStats[];

    const subjectIds = Array.from(
      new Set(planList.map((p) => p.subject_id).filter((v): v is string => Boolean(v))),
    );
    const subjectMap = new Map<string, SubjectRef>();
    if (subjectIds.length > 0) {
      const { data: subs } = await (context.supabase as any)
        .from("subjects")
        .select("id, subject_code, subject_name")
        .in("id", subjectIds);
      for (const s of (subs ?? []) as SubjectRef[]) subjectMap.set(s.id, s);
    }

    const planIds = planList.map((p) => p.id);
    const { data: items } = await (context.supabase as any)
      .from("study_plan_items")
      .select("study_plan_id, completed")
      .in("study_plan_id", planIds);
    const totals = new Map<string, { total: number; done: number }>();
    for (const it of (items ?? []) as { study_plan_id: string; completed: boolean }[]) {
      const cur = totals.get(it.study_plan_id) ?? { total: 0, done: 0 };
      cur.total += 1;
      if (it.completed) cur.done += 1;
      totals.set(it.study_plan_id, cur);
    }

    return planList.map((p) => ({
      plan: p,
      subject: p.subject_id ? subjectMap.get(p.subject_id) ?? null : null,
      total_items: totals.get(p.id)?.total ?? 0,
      completed_items: totals.get(p.id)?.done ?? 0,
    })) as StudyPlanWithStats[];
  });

export const getStudyPlanById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: plan, error } = await (context.supabase as any)
      .from("study_plans")
      .select("*")
      .eq("id", data.plan_id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!plan) return null;

    const { data: items, error: iErr } = await (context.supabase as any)
      .from("study_plan_items")
      .select("*")
      .eq("study_plan_id", plan.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true });
    if (iErr) throw new Error(iErr.message);

    let subject: SubjectRef | null = null;
    if (plan.subject_id) {
      const { data: subj } = await (context.supabase as any)
        .from("subjects")
        .select("id, subject_code, subject_name")
        .eq("id", plan.subject_id)
        .maybeSingle();
      subject = (subj as SubjectRef | null) ?? null;
    }

    return { plan: plan as StudyPlan, items: (items ?? []) as StudyPlanItem[], subject };
  });

export const togglePlanItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => toggleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("study_plan_items")
      .update({
        completed: data.completed,
        completed_at: data.completed ? new Date().toISOString() : null,
      })
      .eq("id", data.item_id)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLatestStudyPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: plan, error } = await (context.supabase as any)
      .from("study_plans")
      .select("*")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!plan) return null;

    const { data: items, error: iErr } = await (context.supabase as any)
      .from("study_plan_items")
      .select("*")
      .eq("study_plan_id", plan.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true });
    if (iErr) throw new Error(iErr.message);

    let subject: SubjectRef | null = null;
    if (plan.subject_id) {
      const { data: subj } = await (context.supabase as any)
        .from("subjects")
        .select("id, subject_code, subject_name")
        .eq("id", plan.subject_id)
        .maybeSingle();
      subject = (subj as SubjectRef | null) ?? null;
    }

    return { plan: plan as StudyPlan, items: (items ?? []) as StudyPlanItem[], subject };
  });

export const listEnrolledSubjectsForPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: enrollments, error: eErr } = await (context.supabase as any)
      .from("student_subject_enrollments")
      .select("subject_id")
      .eq("student_id", context.userId);
    if (eErr) throw new Error(eErr.message);
    const ids = (enrollments ?? []).map((e: any) => e.subject_id);
    if (ids.length === 0) return [] as SubjectRef[];
    const { data, error } = await (context.supabase as any)
      .from("subjects")
      .select("id, subject_code, subject_name")
      .in("id", ids)
      .order("subject_code", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as SubjectRef[];
  });

export const createStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Verify enrollment
    const { data: enrollment, error: enrErr } = await (context.supabase as any)
      .from("student_subject_enrollments")
      .select("subject_id")
      .eq("student_id", context.userId)
      .eq("subject_id", data.subject_id)
      .maybeSingle();
    if (enrErr) throw new Error(enrErr.message);
    if (!enrollment) throw new Error("You are not enrolled in that subject.");

    // Fetch subject + topics for this subject only
    const { data: subject, error: sErr } = await (context.supabase as any)
      .from("subjects")
      .select("id, subject_code, subject_name")
      .eq("id", data.subject_id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!subject) throw new Error("Subject not found.");

    const { data: topics, error: tErr } = await (context.supabase as any)
      .from("lecture_files")
      .select("id, file_name")
      .eq("subject_id", data.subject_id);
    if (tErr) throw new Error(tErr.message);
    const topicList = topics ?? [];

    let progressBy = new Map<string, number>();
    if (topicList.length > 0) {
      const { data: pr } = await (context.supabase as any)
        .from("student_topic_progress")
        .select("topic_id, progress_percentage")
        .eq("student_id", context.userId)
        .in("topic_id", topicList.map((t: any) => t.id));
      progressBy = new Map((pr ?? []).map((p: any) => [p.topic_id, p.progress_percentage]));
    }

    // Available slots from today -> exam date (remaining days only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(data.exam_date);
    exam.setHours(0, 0, 0, 0);
    if (exam <= today) throw new Error("Exam date must be in the future.");

    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    type Slot = { date: string; weekday: string; slot: string; start: string; end: string; minutes: number };
    const availableSlots: Slot[] = [];
    for (let d = new Date(today); d <= exam; d.setDate(d.getDate() + 1)) {
      const weekday = weekdayNames[d.getDay()];
      const slots = data.available_hours[weekday] ?? [];
      for (const slot of slots) {
        const t = SLOT_TIMES[slot];
        if (!t) continue;
        availableSlots.push({
          date: d.toISOString().slice(0, 10),
          weekday,
          slot,
          start: t.start,
          end: t.end,
          minutes: t.minutes,
        });
      }
    }

    if (availableSlots.length === 0) {
      throw new Error("No available study time between today and the exam date. Pick more slots or a later exam date.");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const topicSummary = topicList.map((t: any) => ({
      topic_id: t.id,
      topic_name: (t.file_name as string).replace(/\.[^.]+$/, ""),
      progress_percentage: progressBy.get(t.id) ?? 0,
    }));

    const systemPrompt = `You are an academic study planner. Given a single subject, an exam date, remaining available study slots, and either topics or priority goals, produce a realistic schedule.

Rules:
- Only schedule sessions in the provided available_slots (no past dates).
- Every scheduled item must reuse an available_slots date + start_time + end_time triple exactly.
- All sessions belong to the single provided subject.
- For topic plans: distribute the provided topics across sessions, favoring lower progress_percentage.
- For priority plans: use the provided priority titles for session titles; topic_id must be null.
- Adjust total time allocation and session depth based on subject_proficiency (the student's self-rated confidence in this subject):
  * "weak": HIGHEST time allocation. Use as many available_slots as possible, prefer longer sessions, and schedule this subject earlier in the timeline. Emphasize foundational learning, detailed explanations, worked examples, then revision and practice.
  * "medium": NORMAL allocation. Balanced mix of learning, revision, and practice.
  * "strong": LOWEST time allocation. Use fewer available_slots (leave some empty for rest), keep sessions shorter, and focus on advanced practice, mock questions, and revision. Skip basic explanations.
- Reserve the final 1-2 days before the exam for revision.
- Do not create more items than available_slots; leaving slots empty for rest is fine.
- Output STRICT JSON only.`;

    const userPayload = {
      subject: { id: subject.id, code: subject.subject_code, name: subject.subject_name },
      exam_date: data.exam_date,
      today: today.toISOString().slice(0, 10),
      plan_type: data.plan_type,
      subject_proficiency: data.proficiency,
      available_slots: availableSlots,
      topics: data.plan_type === "topic" ? topicSummary : [],
      priorities: data.plan_type === "priority" ? data.priorities ?? [] : [],
    };

    const userPrompt = `Create a study plan for ONE subject only.

Input:
${JSON.stringify(userPayload, null, 2)}

Output JSON schema:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "topic_id": "uuid or null",
      "title": "short session title",
      "description": "1-2 sentence focus",
      "duration_minutes": number
    }
  ]
}
Return only the JSON object.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      throw new Error(`AI generation failed [${resp.status}]: ${body}`);
    }

    const json = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    const rawItems: any[] = Array.isArray(parsed?.items) ? parsed.items : [];
    if (rawItems.length === 0) throw new Error("AI produced no schedule items. Try again.");

    const slotKey = new Set(availableSlots.map((s) => `${s.date}|${s.start}|${s.end}`));
    const validTopicIds = new Set(topicList.map((t: any) => t.id));
    const validItems = rawItems.filter((it) =>
      typeof it?.date === "string" &&
      typeof it?.start_time === "string" &&
      typeof it?.end_time === "string" &&
      slotKey.has(`${it.date}|${it.start_time}|${it.end_time}`) &&
      typeof it?.title === "string" && it.title.trim().length > 0
    );
    if (validItems.length === 0) throw new Error("AI schedule did not match available slots. Try again.");

    const { data: plan, error: pInsErr } = await (context.supabase as any)
      .from("study_plans")
      .insert({
        student_id: context.userId,
        subject_id: data.subject_id,
        plan_type: data.plan_type,
        exam_date: data.exam_date,
        available_hours: data.available_hours,
        priorities: data.plan_type === "priority" ? data.priorities ?? [] : null,
        subject_proficiency: data.proficiency,
        generated_plan: { items: validItems },
        status: "active",
      })
      .select("*")
      .single();
    if (pInsErr) throw new Error(pInsErr.message);

    const itemRows = validItems.map((it) => ({
      study_plan_id: plan.id,
      student_id: context.userId,
      date: it.date,
      start_time: it.start_time,
      end_time: it.end_time,
      subject_id: data.subject_id,
      topic_id:
        data.plan_type === "topic" && typeof it.topic_id === "string" && validTopicIds.has(it.topic_id)
          ? it.topic_id
          : null,
      title: String(it.title).slice(0, 200),
      description: it.description ? String(it.description).slice(0, 500) : null,
      duration_minutes: typeof it.duration_minutes === "number" ? it.duration_minutes : 60,
    }));

    const { error: iInsErr } = await (context.supabase as any)
      .from("study_plan_items")
      .insert(itemRows);
    if (iInsErr) throw new Error(iInsErr.message);

    return { ok: true, plan_id: plan.id as string };
  });

export const deleteStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: plan, error: pErr } = await (context.supabase as any)
      .from("study_plans")
      .select("id")
      .eq("id", data.plan_id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!plan) throw new Error("Study plan not found.");

    const { error: iErr } = await (context.supabase as any)
      .from("study_plan_items")
      .delete()
      .eq("study_plan_id", data.plan_id)
      .eq("student_id", context.userId);
    if (iErr) throw new Error(iErr.message);

    const { error: dErr } = await (context.supabase as any)
      .from("study_plans")
      .delete()
      .eq("id", data.plan_id)
      .eq("student_id", context.userId);
    if (dErr) throw new Error(dErr.message);

    return { ok: true };
  });

export const updateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Load existing plan (owned by user)
    const { data: existing, error: eErr } = await (context.supabase as any)
      .from("study_plans")
      .select("*")
      .eq("id", data.plan_id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (eErr) throw new Error(eErr.message);
    if (!existing) throw new Error("Study plan not found.");
    if (!existing.subject_id) throw new Error("Plan is missing a subject.");

    const { data: subject, error: sErr } = await (context.supabase as any)
      .from("subjects")
      .select("id, subject_code, subject_name")
      .eq("id", existing.subject_id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!subject) throw new Error("Subject not found.");

    const { data: topics } = await (context.supabase as any)
      .from("lecture_files")
      .select("id, file_name")
      .eq("subject_id", existing.subject_id);
    const topicList = topics ?? [];

    let progressBy = new Map<string, number>();
    if (topicList.length > 0) {
      const { data: pr } = await (context.supabase as any)
        .from("student_topic_progress")
        .select("topic_id, progress_percentage")
        .eq("student_id", context.userId)
        .in("topic_id", topicList.map((t: any) => t.id));
      progressBy = new Map((pr ?? []).map((p: any) => [p.topic_id, p.progress_percentage]));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(data.exam_date);
    exam.setHours(0, 0, 0, 0);
    if (exam <= today) throw new Error("Exam date must be in the future.");

    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    type Slot = { date: string; weekday: string; slot: string; start: string; end: string; minutes: number };
    const availableSlots: Slot[] = [];
    for (let d = new Date(today); d <= exam; d.setDate(d.getDate() + 1)) {
      const weekday = weekdayNames[d.getDay()];
      const slots = data.available_hours[weekday] ?? [];
      for (const slot of slots) {
        const t = SLOT_TIMES[slot];
        if (!t) continue;
        availableSlots.push({
          date: d.toISOString().slice(0, 10),
          weekday,
          slot,
          start: t.start,
          end: t.end,
          minutes: t.minutes,
        });
      }
    }
    if (availableSlots.length === 0) {
      throw new Error("No available study time between today and the exam date. Pick more slots or a later exam date.");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const planType = existing.plan_type as "topic" | "priority";
    const topicSummary = topicList.map((t: any) => ({
      topic_id: t.id,
      topic_name: (t.file_name as string).replace(/\.[^.]+$/, ""),
      progress_percentage: progressBy.get(t.id) ?? 0,
    }));

    const userPayload = {
      subject: { id: subject.id, code: subject.subject_code, name: subject.subject_name },
      exam_date: data.exam_date,
      today: today.toISOString().slice(0, 10),
      plan_type: planType,
      subject_proficiency: data.proficiency,
      available_slots: availableSlots,
      topics: planType === "topic" ? topicSummary : [],
      priorities: planType === "priority" ? data.priorities ?? [] : [],
    };

    const systemPrompt = `You are an academic study planner. Given a single subject, an exam date, remaining available study slots, and either topics or priority goals, produce a realistic schedule.

Rules:
- Only schedule sessions in the provided available_slots (no past dates).
- Every scheduled item must reuse an available_slots date + start_time + end_time triple exactly.
- All sessions belong to the single provided subject.
- For topic plans: distribute the provided topics across sessions, favoring lower progress_percentage.
- For priority plans: use the provided priority titles for session titles; topic_id must be null.
- Adjust total time allocation and session depth based on subject_proficiency:
  * "weak": HIGHEST time allocation. Use as many available_slots as possible, prefer longer sessions, foundational learning first.
  * "medium": NORMAL allocation. Balanced learning, revision, and practice.
  * "strong": LOWEST time allocation. Fewer sessions, focus on advanced practice and revision.
- Reserve the final 1-2 days before the exam for revision.
- Output STRICT JSON only.`;

    const userPrompt = `Regenerate the study plan.

Input:
${JSON.stringify(userPayload, null, 2)}

Output JSON schema:
{
  "items": [
    { "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "topic_id": "uuid or null", "title": "short session title", "description": "1-2 sentence focus", "duration_minutes": number }
  ]
}
Return only the JSON object.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
      throw new Error(`AI generation failed [${resp.status}]: ${body}`);
    }

    const json = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    const rawItems: any[] = Array.isArray(parsed?.items) ? parsed.items : [];
    if (rawItems.length === 0) throw new Error("AI produced no schedule items. Try again.");

    const slotKey = new Set(availableSlots.map((s) => `${s.date}|${s.start}|${s.end}`));
    const validTopicIds = new Set(topicList.map((t: any) => t.id));
    const validItems = rawItems.filter((it) =>
      typeof it?.date === "string" &&
      typeof it?.start_time === "string" &&
      typeof it?.end_time === "string" &&
      slotKey.has(`${it.date}|${it.start_time}|${it.end_time}`) &&
      typeof it?.title === "string" && it.title.trim().length > 0
    );
    if (validItems.length === 0) throw new Error("AI schedule did not match available slots. Try again.");

    // Update plan row
    const { error: uErr } = await (context.supabase as any)
      .from("study_plans")
      .update({
        exam_date: data.exam_date,
        available_hours: data.available_hours,
        priorities: planType === "priority" ? data.priorities ?? [] : null,
        subject_proficiency: data.proficiency,
        generated_plan: { items: validItems },
      })
      .eq("id", data.plan_id)
      .eq("student_id", context.userId);
    if (uErr) throw new Error(uErr.message);

    // Replace items
    const { error: dErr } = await (context.supabase as any)
      .from("study_plan_items")
      .delete()
      .eq("study_plan_id", data.plan_id)
      .eq("student_id", context.userId);
    if (dErr) throw new Error(dErr.message);

    const itemRows = validItems.map((it) => ({
      study_plan_id: data.plan_id,
      student_id: context.userId,
      date: it.date,
      start_time: it.start_time,
      end_time: it.end_time,
      subject_id: existing.subject_id,
      topic_id:
        planType === "topic" && typeof it.topic_id === "string" && validTopicIds.has(it.topic_id)
          ? it.topic_id
          : null,
      title: String(it.title).slice(0, 200),
      description: it.description ? String(it.description).slice(0, 500) : null,
      duration_minutes: typeof it.duration_minutes === "number" ? it.duration_minutes : 60,
    }));

    const { error: iErr } = await (context.supabase as any)
      .from("study_plan_items")
      .insert(itemRows);
    if (iErr) throw new Error(iErr.message);

    return { ok: true, plan_id: data.plan_id };
  });
