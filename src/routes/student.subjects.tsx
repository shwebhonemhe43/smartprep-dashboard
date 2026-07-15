import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMySubjects } from "@/lib/student-subjects.functions";

export const Route = createFileRoute("/student/subjects")({
  head: () => ({ meta: [{ title: "Subjects — NCC SmartPrep" }] }),
  component: StudentSubjects,
});

function StudentSubjects() {
  const listFn = useServerFn(listMySubjects);
  const { data, isLoading } = useQuery({
    queryKey: ["my-subjects"],
    queryFn: () => listFn(),
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
          {subjects.map((s) => (
            <Card key={s.id} className="rounded-2xl border-border/60 shadow-soft transition hover:shadow-elegant">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
