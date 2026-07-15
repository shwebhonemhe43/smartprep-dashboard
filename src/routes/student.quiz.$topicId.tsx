import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sparkles, Check, X, RotateCw, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrGenerateTopicQuiz } from "@/lib/topic-quiz.functions";
import { markTopicProgress } from "@/lib/topic-progress.functions";
import { saveQuizSet, checkQuizSaved } from "@/lib/saved-quizzes.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/quiz/$topicId")({
  head: () => ({ meta: [{ title: "Quiz — NCC SmartPrep" }] }),
  component: QuizPage,
});

function QuizPage() {
  const { topicId } = Route.useParams();
  const fn = useServerFn(getOrGenerateTopicQuiz);
  const markFn = useServerFn(markTopicProgress);
  const saveFn = useServerFn(saveQuizSet);
  const checkFn = useServerFn(checkQuizSaved);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["topic-quiz", topicId],
    queryFn: () => fn({ data: { topic_id: topicId } }),
    staleTime: Infinity,
    retry: false,
  });

  const savedQ = useQuery({
    queryKey: ["quiz-saved", topicId],
    queryFn: () => checkFn({ data: { topic_id: topicId } }),
    staleTime: 60_000,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Nothing to save");
      return saveFn({
        data: {
          topic_id: topicId,
          subject_id: data.subject_id ?? null,
          subject_name: (data.subject as any)?.subject_name ?? "Subject",
          topic_name: data.topic_name,
          questions: data.quiz,
        },
      });
    },
    onSuccess: () => {
      toast.success("Quiz saved successfully");
      qc.invalidateQueries({ queryKey: ["quiz-saved", topicId] });
      qc.invalidateQueries({ queryKey: ["saved-quizzes-list"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });


  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const quiz = data?.quiz ?? [];
  const total = quiz.length;
  const current = quiz[index];
  const chosen = answers[index];

  const score = useMemo(
    () => quiz.reduce((n, q, i) => (answers[i] === q.answer_index ? n + 1 : n), 0),
    [quiz, answers],
  );

  useEffect(() => {
    if (submitted) {
      markFn({ data: { topic_id: topicId, kind: "quiz" } }).catch(() => {});
    }
  }, [submitted, topicId, markFn]);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
    setIndex(0);
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/student/subjects">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
        </Link>
      </Button>

      {isLoading ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Generating your quiz…</p>
            <p className="text-xs">We save it so you always see the same set.</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/40 shadow-soft">
          <CardContent className="p-8 text-center text-sm text-destructive">
            {(error as Error).message}
          </CardContent>
        </Card>
      ) : data && current ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> AI Quiz
              </Badge>
              {data.subject && (
                <span className="font-mono text-xs text-muted-foreground">
                  {(data.subject as any).subject_code}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{data.topic_name}</h1>
          </div>

          {submitted ? (
            <Card className="border-border/60 shadow-soft">
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="font-display text-5xl font-extrabold">
                  {score}<span className="text-2xl text-muted-foreground"> / {total}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSubmitted(false); setIndex(0); }}>
                    Review Answers
                  </Button>
                  <Button onClick={reset}>
                    <RotateCw className="mr-2 h-4 w-4" /> Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-mono">Question {index + 1} / {total}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>

              <Card className="border-border/60 shadow-soft">
                <CardContent className="space-y-4 p-6 sm:p-8">
                  <p className="font-display text-lg font-semibold sm:text-xl">{current.question}</p>
                  <div className="grid gap-2">
                    {current.options.map((opt, i) => {
                      const isChosen = chosen === i;
                      const isCorrect = i === current.answer_index;
                      const showResult = chosen !== undefined;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => !showResult && setAnswers((a) => ({ ...a, [index]: i }))}
                          disabled={showResult}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                            !showResult && "border-border/60 hover:border-primary/40 hover:bg-primary/5",
                            showResult && isCorrect && "border-green-500/60 bg-green-500/10",
                            showResult && isChosen && !isCorrect && "border-destructive/60 bg-destructive/10",
                            showResult && !isChosen && !isCorrect && "border-border/40 opacity-60",
                          )}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 font-mono text-xs">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {showResult && isCorrect && <Check className="h-4 w-4 text-green-600" />}
                          {showResult && isChosen && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                  {chosen !== undefined && current.explanation && (
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Explanation: </span>
                      {current.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                {index < total - 1 ? (
                  <Button onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < total}>
                    Submit
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
