import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ study_plan_item_id: z.string().uuid() });

const submitSchema = z.object({
  study_plan_item_id: z.string().uuid(),
  mcq_answers: z.array(z.number().int().min(0).max(3)),
  short_answers: z.array(z.string().max(4000)),
});

export type MCQ = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};
export type SAQ = { question: string; expected_answer: string };
export type TestQuestions = { mcq: MCQ[]; short_answer: SAQ[] };

export type ShortAnswerEval = { score: number; feedback: string };
export type TestResult = {
  questions: TestQuestions;
  answers: {
    mcq: number[];
    short_answer: string[];
  } | null;
  score: number | null;
  feedback: string | null;
  short_answer_evals: ShortAnswerEval[] | null;
  mcq_correct_indices: number[] | null;
  completed_at: string | null;
};

async function callAI(apiKey: string, messages: any[], expectJson: boolean) {
  const body: any = {
    model: "google/gemini-3.5-flash",
    messages,
  };
  if (expectJson) body.response_format = { type: "json_object" };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
    throw new Error(`AI failed [${resp.status}]: ${text}`);
  }
  const j = await resp.json();
  return j?.choices?.[0]?.message?.content?.trim() ?? "";
}

function extractJson(raw: string): any {
  const s = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("AI returned invalid JSON");
  }
}

export const getOrGenerateSessionTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }): Promise<TestResult> => {
    // Verify session ownership
    const { data: item, error: itemErr } = await context.supabase
      .from("study_plan_items")
      .select("id, title, description, student_id")
      .eq("id", data.study_plan_item_id)
      .maybeSingle();
    if (itemErr) throw new Error(itemErr.message);
    if (!item) throw new Error("Study session not found");
    if (item.student_id !== context.userId) throw new Error("Forbidden");

    // Try existing test
    const { data: existing, error: exErr } = await context.supabase
      .from("study_session_tests")
      .select("questions_json, answers_json, score, feedback, completed_at")
      .eq("student_id", context.userId)
      .eq("study_plan_item_id", data.study_plan_item_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);

    if (existing) {
      const q = existing.questions_json as TestQuestions;
      const a = (existing.answers_json ?? null) as TestResult["answers"];
      return {
        questions: q,
        answers: a,
        score: existing.score !== null && existing.score !== undefined ? Number(existing.score) : null,
        feedback: existing.feedback,
        short_answer_evals: (a as any)?.short_answer_evals ?? null,
        mcq_correct_indices: q?.mcq?.map((m) => m.correct_index) ?? null,
        completed_at: existing.completed_at,
      };
    }

    // Load notes as source
    const { data: notes, error: nErr } = await context.supabase
      .from("study_session_notes")
      .select("notes_content")
      .eq("student_id", context.userId)
      .eq("study_plan_item_id", data.study_plan_item_id)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!notes?.notes_content) {
      throw new Error("Please open Notes for this session first — the test is generated from your notes.");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are creating an assessment test STRICTLY based on the study notes below.

Session Title: ${item.title}
${item.description ? `Focus: ${item.description}\n` : ""}
=== STUDY NOTES (source) ===
${notes.notes_content}
=== END NOTES ===

Create:
- 5 multiple-choice questions (each with exactly 4 options, one correct answer, and a short explanation).
- 3 short-answer questions with an "expected_answer" describing the ideal complete answer (for AI grading later).

Return ONLY valid JSON in this exact shape:
{
  "mcq": [
    { "question": "...", "options": ["a","b","c","d"], "correct_index": 0, "explanation": "..." }
  ],
  "short_answer": [
    { "question": "...", "expected_answer": "..." }
  ]
}`;

    const raw = await callAI(apiKey, [
      { role: "system", content: "You produce well-formed JSON assessments. Output only JSON, no prose." },
      { role: "user", content: prompt },
    ], true);
    const parsed = extractJson(raw);

    const questions: TestQuestions = {
      mcq: Array.isArray(parsed?.mcq) ? parsed.mcq.slice(0, 5).map((m: any) => ({
        question: String(m.question ?? ""),
        options: Array.isArray(m.options) ? m.options.slice(0, 4).map((o: any) => String(o)) : [],
        correct_index: Math.max(0, Math.min(3, Number(m.correct_index ?? 0))),
        explanation: String(m.explanation ?? ""),
      })).filter((m: MCQ) => m.question && m.options.length === 4) : [],
      short_answer: Array.isArray(parsed?.short_answer) ? parsed.short_answer.slice(0, 3).map((s: any) => ({
        question: String(s.question ?? ""),
        expected_answer: String(s.expected_answer ?? ""),
      })).filter((s: SAQ) => s.question) : [],
    };

    if (questions.mcq.length === 0 && questions.short_answer.length === 0) {
      throw new Error("AI failed to generate questions. Please try again.");
    }

    const { error: insErr } = await context.supabase
      .from("study_session_tests")
      .insert({
        student_id: context.userId,
        study_plan_item_id: data.study_plan_item_id,
        questions_json: questions,
      });
    if (insErr && insErr.code !== "23505") throw new Error(insErr.message);

    return {
      questions,
      answers: null,
      score: null,
      feedback: null,
      short_answer_evals: null,
      mcq_correct_indices: questions.mcq.map((m) => m.correct_index),
      completed_at: null,
    };
  });

function calcPercent(n: boolean, f: boolean, q: boolean) {
  return (n ? 33 : 0) + (f ? 33 : 0) + (q ? 34 : 0);
}

export const submitSessionTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }): Promise<TestResult> => {
    const { data: item, error: itemErr } = await context.supabase
      .from("study_plan_items")
      .select("id, title, student_id, topic_id, study_plan_id, completed")
      .eq("id", data.study_plan_item_id)
      .maybeSingle();
    if (itemErr) throw new Error(itemErr.message);
    if (!item) throw new Error("Study session not found");
    if (item.student_id !== context.userId) throw new Error("Forbidden");

    const { data: existing, error: exErr } = await context.supabase
      .from("study_session_tests")
      .select("questions_json")
      .eq("student_id", context.userId)
      .eq("study_plan_item_id", data.study_plan_item_id)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);
    if (!existing) throw new Error("No test found. Please generate the test first.");

    const questions = existing.questions_json as TestQuestions;

    // Grade MCQ locally
    const mcqCount = questions.mcq.length;
    let mcqCorrect = 0;
    for (let i = 0; i < mcqCount; i++) {
      if (data.mcq_answers[i] === questions.mcq[i].correct_index) mcqCorrect++;
    }
    const mcqScore = mcqCount ? (mcqCorrect / mcqCount) * 100 : 0;

    // Grade short answers via AI
    let saqEvals: ShortAnswerEval[] = [];
    let saqScore = 0;
    if (questions.short_answer.length > 0) {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

      const evalPrompt = `Grade the student's short answers. For each, give a score from 0 to 100 and brief feedback (1-2 sentences). Return ONLY JSON in this shape:
{ "evaluations": [ { "score": number, "feedback": "..." } ] }

${questions.short_answer.map((q, i) => `Q${i + 1}: ${q.question}
Expected: ${q.expected_answer}
Student answer: ${data.short_answers[i] ?? ""}`).join("\n\n")}`;

      const raw = await callAI(apiKey, [
        { role: "system", content: "You are a fair academic grader. Output only JSON." },
        { role: "user", content: evalPrompt },
      ], true);
      const parsed = extractJson(raw);
      const arr = Array.isArray(parsed?.evaluations) ? parsed.evaluations : [];
      saqEvals = questions.short_answer.map((_, i) => ({
        score: Math.max(0, Math.min(100, Number(arr[i]?.score ?? 0))),
        feedback: String(arr[i]?.feedback ?? "No feedback."),
      }));
      const sum = saqEvals.reduce((a, e) => a + e.score, 0);
      saqScore = saqEvals.length ? sum / saqEvals.length : 0;
    }

    // Weighted overall (MCQ 50%, SAQ 50% when both exist)
    let overall = 0;
    if (mcqCount > 0 && questions.short_answer.length > 0) overall = mcqScore * 0.5 + saqScore * 0.5;
    else if (mcqCount > 0) overall = mcqScore;
    else overall = saqScore;
    overall = Math.round(overall);

    const feedback =
      `You scored ${mcqCorrect}/${mcqCount} on multiple choice.` +
      (questions.short_answer.length ? ` Short-answer average: ${Math.round(saqScore)}%.` : "");

    const completedAt = new Date().toISOString();

    const answersPayload = {
      mcq: data.mcq_answers,
      short_answer: data.short_answers,
      short_answer_evals: saqEvals,
    };

    const { error: upErr } = await context.supabase
      .from("study_session_tests")
      .update({
        answers_json: answersPayload,
        score: overall,
        feedback,
        completed_at: completedAt,
      })
      .eq("student_id", context.userId)
      .eq("study_plan_item_id", data.study_plan_item_id);
    if (upErr) throw new Error(upErr.message);

    // Mark study_plan_item as completed
    if (!item.completed) {
      await context.supabase
        .from("study_plan_items")
        .update({ completed: true, completed_at: completedAt })
        .eq("id", data.study_plan_item_id);
    }

    // Update topic progress (quiz done) if topic-linked
    if (item.topic_id) {
      const { data: prog } = await context.supabase
        .from("student_topic_progress")
        .select("id, notes_completed, flashcards_completed, quiz_completed")
        .eq("student_id", context.userId)
        .eq("topic_id", item.topic_id)
        .maybeSingle();
      const next = {
        notes_completed: prog?.notes_completed ?? false,
        flashcards_completed: prog?.flashcards_completed ?? false,
        quiz_completed: true,
      };
      const pct = calcPercent(next.notes_completed, next.flashcards_completed, next.quiz_completed);
      const done_at = pct >= 100 ? completedAt : null;
      if (prog) {
        await context.supabase
          .from("student_topic_progress")
          .update({ ...next, progress_percentage: pct, completed_at: done_at })
          .eq("id", prog.id);
      } else {
        await context.supabase
          .from("student_topic_progress")
          .insert({
            student_id: context.userId,
            topic_id: item.topic_id,
            ...next,
            progress_percentage: pct,
            completed_at: done_at,
          });
      }
    }

    return {
      questions,
      answers: { mcq: data.mcq_answers, short_answer: data.short_answers },
      score: overall,
      feedback,
      short_answer_evals: saqEvals,
      mcq_correct_indices: questions.mcq.map((m) => m.correct_index),
      completed_at: completedAt,
    };
  });
