import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/quiz")({ component: () => (
  <PagePlaceholder title="Quiz" description="Take topic-based quizzes and track your accuracy over time." />
) });
