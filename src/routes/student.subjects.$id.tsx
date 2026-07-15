import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2, Presentation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubjectWithTopics, signLectureUrl } from "@/lib/student-subjects.functions";

export const Route = createFileRoute("/student/subjects/$id")({
  head: () => ({ meta: [{ title: "Subject — NCC SmartPrep" }] }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getSubjectWithTopics);
  const signFn = useServerFn(signLectureUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["subject-detail", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const openTopic = async (path: string) => {
    try {
      const { url } = await signFn({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
    }
  };

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTopic(t.file_url)}
                className="text-left"
              >
                <Card className="h-full rounded-2xl border-border/60 shadow-soft transition hover:shadow-elegant hover:border-primary/40">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 font-mono text-xs font-semibold text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Presentation className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="font-display text-base leading-snug">
                      {t.file_name.replace(/\.[^.]+$/, "")}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
