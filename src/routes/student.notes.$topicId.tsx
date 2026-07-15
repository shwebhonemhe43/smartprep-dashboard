import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrGenerateTopicNotes } from "@/lib/topic-notes.functions";

export const Route = createFileRoute("/student/notes/$topicId")({
  head: () => ({ meta: [{ title: "Notes — NCC SmartPrep" }] }),
  component: NotesPage,
});

function NotesPage() {
  const { topicId } = Route.useParams();
  const fn = useServerFn(getOrGenerateTopicNotes);
  const { data, isLoading, error } = useQuery({
    queryKey: ["topic-notes", topicId],
    queryFn: () => fn({ data: { topic_id: topicId } }),
    staleTime: Infinity,
    retry: false,
  });

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
            <p className="font-medium">Generating your personalized notes…</p>
            <p className="text-xs">This may take a few seconds. Notes will be saved so you never wait again.</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/40 shadow-soft">
          <CardContent className="p-8 text-center text-sm text-destructive">
            {(error as Error).message}
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> AI Notes
              </Badge>
              {data.subject && (
                <span className="font-mono text-xs text-muted-foreground">
                  {(data.subject as any).subject_code}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{data.topic_name}</h1>
            <p className="text-xs text-muted-foreground">
              Last generated: {new Date(data.updated_at ?? data.created_at).toLocaleString()}
            </p>
          </div>

          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-6 sm:p-8">
              <article className="max-w-none space-y-3 text-[15px] leading-relaxed text-foreground [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-4 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm">
                <ReactMarkdown>{data.notes_content}</ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
