import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SLOT_TIMES: Record<string, { start: string; end: string; minutes: number }> = {
  morning: { start: "09:00", end: "12:00", minutes: 180 },
  afternoon: { start: "14:00", end: "17:00", minutes: 180 },
  evening: { start: "19:00", end: "22:00", minutes: 180 },
};

const availableHoursSchema = z.record(
  z.string(), // weekday: monday..sunday
  z.array(z.enum(["morning", "afternoon", "evening"])),
);

const createSchema = z.object({
  exam_date: z.string().min(1),
  plan_type: z.enum(["topic", "priority"]),
  available_hours: availableHoursSchema,
  priorities: z.array(z.string().trim().min(1)).optional(),
});

const toggleSchema = z.object({
  item_id: z.string().uuid(),
  completed: z.boolean(),
});

export type StudyPlan = {
  id: string;
  student_id: string;
  plan_type: "topic" | "priority";
  exam_date: string;
  available_hours: Record<string, string[]>;
  priorities: string[] | null;
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

export const listMyStudyPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("study_plans")
      .select("*")
      .eq("student_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as StudyPlan[];
  });

export const getStudyPlanWithItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: plan, error: pErr } = await (context.supabase as any)
      .from("study_plans")
      .select("*")
      .eq("id", data.plan_id)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!plan) throw new Error("Plan not found");

    const { data: items, error: iErr } = await (context.supabase as any)
      .from("study_plan_items")
      .select("*")
      .eq("study_plan_id", plan.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true });
    if (iErr) throw new Error(iErr.message);

    return { plan: plan as StudyPlan, items: (items ?? []) as StudyPlanItem[] };
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

    return { plan: plan as StudyPlan, items: (items ?? []) as StudyPlanItem[] };
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

export const createStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    // 1. Gather student context: enrolled subjects, topics, progress
    const { data: enrollments, error: eErr } = await (context.supabase as any)
      .from("student_subject_enrollments")
      .select("subject_id")
      .eq("student_id", context.userId);
    if (eErr) throw new Error(eErr.message);
    const subjectIds = (enrollments ?? []).map((e: any) => e.subject_id);

    let subjects: any[] = [];
    let topics: any[] = [];
    let progressBy = new Map<string, number>();

    if (subjectIds.length > 0) {
      const { data: subs, error: sErr } = await (context.supabase as any)
        .from("subjects")
        .select("id, subject_code, subject_name")
        .in("id", subjectIds);
      if (sErr) throw new Error(sErr.message);
      subjects = subs ?? [];

      const { data: tps, error: tErr } = await (context.supabase as any)
        .from("lecture_files")
        .select("id, file_name, subject_id")
        .in("subject_id", subjectIds);
      if (tErr) throw new Error(tErr.message);
      topics = tps ?? [];

      const topicIds = topics.map((t) => t.id);
      if (topicIds.length > 0) {
        const { data: pr } = await (context.supabase as any)
          .from("student_topic_progress")
          .select("topic_id, progress_percentage")
          .eq("student_id", context.userId)
          .in("topic_id", topicIds);
        progressBy = new Map((pr ?? []).map((p: any) => [p.topic_id, p.progress_percentage]));
      }
    }

    // 2. Build available time list between today and exam date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(data.exam_date);
    exam.setHours(0, 0, 0, 0);
    if (exam <= today) throw new Error("Exam date must be in the future.");

    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    type Slot = { date: string; weekday: string; slot: string; start: string; end: string; minutes: number };
    const availableSlots: Slot[] = [];
    // Leave 2 days buffer before exam for revision (still schedule revision items there)
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
      throw new Error("No available study time selected. Please pick at least one day and slot.");
    }

    // 3. Prepare AI prompt
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const topicSummary = topics.map((t) => ({
      topic_id: t.id,
      topic_name: (t.file_name as string).replace(/\.[^.]+$/, ""),
      subject_id: t.subject_id,
      subject_code: subjects.find((s) => s.id === t.subject_id)?.subject_code ?? "",
      subject_name: subjects.find((s) => s.id === t.subject_id)?.subject_name ?? "",
      progress_percentage: progressBy.get(t.id) ?? 0,
    }));

    const systemPrompt = `You are an academic study planner. Given a student's exam date, available study slots, and either their enrolled topics or their priority goals, produce a realistic, balanced schedule.

Rules:
- Only schedule sessions in the provided available_slots.
- Every scheduled item must reuse one of the provided slot date + start_time + end_time triples exactly.
- Prefer incomplete topics (lower progress_percentage) and give them more sessions.
- Distribute sessions across subjects; avoid overloading a single day.
- Reserve the final 1-2 days before the exam for revision.
- Do not create more items than available_slots; you may leave some slots empty for rest.
- Output STRICT JSON only, no prose.`;

    const userPayload = {
      exam_date: data.exam_date,
      today: today.toISOString().slice(0, 10),
      plan_type: data.plan_type,
      available_slots: availableSlots,
      topics: data.plan_type === "topic" ? topicSummary : [],
      priorities: data.plan_type === "priority" ? data.priorities ?? [] : [],
    };

    const userPrompt = `Create a study plan.

Input:
${JSON.stringify(userPayload, null, 2)}

Output JSON schema:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "subject_id": "uuid or null",
      "topic_id": "uuid or null",
      "title": "short session title",
      "description": "1-2 sentence focus",
      "duration_minutes": number
    }
  ]
}

For topic plans, set subject_id and topic_id from the provided topics.
For priority plans, leave subject_id and topic_id as null and use the priority text in the title.
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

    // Validate items belong to available slots
    const slotKey = new Set(availableSlots.map((s) => `${s.date}|${s.start}|${s.end}`));
    const validItems = rawItems.filter((it) =>
      typeof it?.date === "string" &&
      typeof it?.start_time === "string" &&
      typeof it?.end_time === "string" &&
      slotKey.has(`${it.date}|${it.start_time}|${it.end_time}`) &&
      typeof it?.title === "string" && it.title.trim().length > 0
    );
    if (validItems.length === 0) throw new Error("AI schedule did not match available slots. Try again.");

    // 4. Insert plan + items
    const { data: plan, error: pInsErr } = await (context.supabase as any)
      .from("study_plans")
      .insert({
        student_id: context.userId,
        plan_type: data.plan_type,
        exam_date: data.exam_date,
        available_hours: data.available_hours,
        priorities: data.plan_type === "priority" ? data.priorities ?? [] : null,
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
      subject_id: typeof it.subject_id === "string" && it.subject_id.length === 36 ? it.subject_id : null,
      topic_id: typeof it.topic_id === "string" && it.topic_id.length === 36 ? it.topic_id : null,
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
