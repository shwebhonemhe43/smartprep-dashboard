import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, Clock, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listMySubjects } from "@/lib/student-subjects.functions";

export const Route = createFileRoute("/student/subjects/")({
  head: () => ({ meta: [{ title: "Subjects — NCC SmartPrep" }] }),
  component: StudentSubjects,
});

function StudentSubjects() {
  const listFn = useServerFn(listMySubjects);
  const { data, isLoading } = useQuery({
    queryKey: ["my-subjects"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: true,
  });

  const program = data?.program ?? null;
  const subjects = data?.subjects ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">My Subjects</h1>
        <p className="text-muted-foreground">
          {program ? (
            <>
              Showing subjects for your program:{" "}
              <span className="font-medium text-foreground">{program}</span>
            </>
          ) : (
            "Your program is not set. Update your profile to see relevant subjects."
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : subjects.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <BookMarked className="h-8 w-8" />
            <p>No subjects available for {program ?? "your level"} yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s: any) => (
            <Card
              key={s.id}
              className="flex h-full flex-col rounded-2xl border-border/60 shadow-soft transition hover:shadow-elegant hover:border-primary/40"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{s.subject_code}</span>
                  <Badge variant="secondary">{s.level}</Badge>
                </div>
                <CardTitle className="font-display text-lg">{s.subject_name}</CardTitle>
                {s.description && (
                  <CardDescription className="line-clamp-3">{s.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    <span className="font-medium text-foreground">{s.study_hours}</span> study hrs
                  </span>
                  <span className="text-border">•</span>
                  <span>{s.topic_count} topics</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono font-semibold text-foreground">{s.progress}%</span>
                  </div>
                  <Progress value={s.progress} className="h-2" />
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link to="/student/subjects/$id" params={{ id: s.id }}>
                    {s.progress > 0 ? "Continue" : "Enroll"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
