import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSavedFlashcards } from "@/lib/saved-flashcards.functions";

export const Route = createFileRoute("/student/flashcards/")({
  head: () => ({ meta: [{ title: "Saved Flashcards — NCC SmartPrep" }] }),
  component: SavedFlashcardsList,
});

function SavedFlashcardsList() {
  const fn = useServerFn(listSavedFlashcards);
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-flashcards-list"],
    queryFn: () => fn(),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Your Library
        </Badge>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Saved Flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Open a topic and click Save Flashcards to add a deck here. Saved sets never regenerate.
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
            No saved flashcards yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Link
              key={s.id}
              to="/student/flashcards/saved/$id"
              params={{ id: s.id }}
              className="group"
            >
              <Card className="h-full border-border/60 shadow-soft transition hover:border-primary/50 hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs uppercase tracking-wider text-primary">{s.subject_name}</p>
                  <h3 className="font-display text-lg font-semibold leading-tight">{s.topic_name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> {s.count} Flashcards
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
