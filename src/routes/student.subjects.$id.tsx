import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2, Presentation, BookOpen, Brain, HelpCircle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSubjectWithTopics } from "@/lib/student-subjects.functions";
import { listMyProgressForSubject } from "@/lib/topic-progress.functions";

export const Route = createFileRoute("/student/subjects/$id")({
  head: () => ({ meta: [{ title: "Subject — NCC SmartPrep" }] }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getSubjectWithTopics);
  const progressFn = useServerFn(listMyProgressForSubject);
  const { data, isLoading } = useQuery({
    queryKey: ["subject-detail", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const { data: progressData } = useQuery({
    queryKey: ["subject-progress", id],
    queryFn: () => progressFn({ data: { subject_id: id } }),
    refetchOnWindowFocus: true,
  });
  const progressByTopic = new Map(
    (progressData?.progress ?? []).map((p) => [p.topic_id, p]),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (!data) return null;
  const { subject, topics } = data;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
          <Link to="/student/subjects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{subject.subject_code}</span>
          <Badge variant="secondary">{subject.level}</Badge>
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{subject.subject_name}</h1>
        {subject.description && (
          <p className="max-w-3xl text-muted-foreground">{subject.description}</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Topics</h2>
        {topics.length === 0 ? (
          <Card className="border-border/60 shadow-soft">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p>No topics available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {topics.map((t, i) => {
              const prog = progressByTopic.get(t.id);
              const isComplete = (prog?.progress_percentage ?? 0) >= 100;
              return (
              <Card
                key={t.id}
                className="rounded-2xl border-border/60 shadow-soft transition hover:shadow-elegant hover:border-primary/40"
              >
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "relative inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-primary/10 px-3 font-mono text-sm font-semibold text-primary border-2",
                        isComplete ? "border-green-500" : "border-transparent",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                      {isComplete && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <div className="space-y-1">
                      <CardTitle className="font-display text-base leading-snug">
                        {t.file_name.replace(/\.[^.]+$/, "")}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Presentation className="h-3.5 w-3.5" />
                        <span>{t.file_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/student/notes/$topicId" params={{ topicId: t.id }}>
                        <BookOpen className="mr-2 h-4 w-4" /> Notes
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/student/quiz/$topicId" params={{ topicId: t.id }}>
                        <HelpCircle className="mr-2 h-4 w-4" /> Quiz
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/student/flashcards/$topicId" params={{ topicId: t.id }}>
                        <Brain className="mr-2 h-4 w-4" /> Flashcard
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
