import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSavedQuizzes } from "@/lib/saved-quizzes.functions";

export const Route = createFileRoute("/student/quiz/")({
  head: () => ({ meta: [{ title: "Saved Quizzes — NCC SmartPrep" }] }),
  component: SavedQuizzesList,
});

function SavedQuizzesList() {
  const fn = useServerFn(listSavedQuizzes);
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-quizzes-list"],
    queryFn: () => fn(),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Your Library
        </Badge>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Saved Quizzes</h1>
        <p className="text-sm text-muted-foreground">
          Open a topic and click Save Quiz to add it here. Saved quizzes never regenerate.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : !data || data.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No saved quizzes yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Link
              key={s.id}
              to="/student/quiz/saved/$id"
              params={{ id: s.id }}
              className="group"
            >
              <Card className="h-full border-border/60 shadow-soft transition hover:border-primary/50 hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs uppercase tracking-wider text-primary">{s.subject_name}</p>
                  <h3 className="font-display text-lg font-semibold leading-tight">{s.topic_name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" /> {s.question_count} Questions
                    </span>
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
