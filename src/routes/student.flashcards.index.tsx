import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/flashcards/")({
  component: () => (
    <PagePlaceholder title="Flashcards" description="Open a topic and click Flashcard to generate an AI deck." />
  ),
});
