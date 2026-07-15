import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sparkles, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSavedFlashcardSet } from "@/lib/saved-flashcards.functions";

export const Route = createFileRoute("/student/flashcards/saved/$id")({
  head: () => ({ meta: [{ title: "Saved Flashcards — NCC SmartPrep" }] }),
  component: SavedFlashcardsDetail,
});

function SavedFlashcardsDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getSavedFlashcardSet);
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-flashcards", id],
    queryFn: () => fn({ data: { id } }),
    staleTime: Infinity,
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = data?.flashcards ?? [];
  const total = cards.length;
  const current = cards[index];

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(total - 1, 0)));
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/student/flashcards">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Saved Flashcards
        </Link>
      </Button>

      {isLoading ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">{(error as Error).message}</CardContent>
        </Card>
      ) : data && current ? (
        <>
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> {data.subject_name}
            </Badge>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{data.topic_name}</h1>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-mono">{index + 1} / {total}</span>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <RotateCw className="h-3.5 w-3.5" /> Flip
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="group relative block w-full text-left"
            style={{ perspective: "1200px" }}
            aria-label="Flip flashcard"
          >
            <div
              className="relative min-h-[280px] w-full transition-transform duration-500 sm:min-h-[340px]"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <Card
                className="absolute inset-0 flex items-center justify-center rounded-2xl border-border/60 shadow-soft"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Question</span>
                  <p className="font-display text-xl font-semibold sm:text-2xl">{current.front}</p>
                  <span className="mt-4 text-xs text-muted-foreground">Click to reveal answer</span>
                </CardContent>
              </Card>
              <Card
                className="absolute inset-0 flex items-center justify-center rounded-2xl border-primary/40 bg-primary/5 shadow-soft"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <CardContent className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <span className="text-xs uppercase tracking-wider text-primary">Answer</span>
                  <p className="text-base leading-relaxed sm:text-lg">{current.back}</p>
                </CardContent>
              </Card>
            </div>
          </button>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => go(-1)} disabled={index === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button onClick={() => go(1)} disabled={index >= total - 1}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
