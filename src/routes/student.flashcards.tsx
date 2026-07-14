import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/flashcards")({ component: () => (
  <PagePlaceholder title="Flashcards" description="Review key concepts with adaptive AI-generated flashcards." />
) });
