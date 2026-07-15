import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/quiz/")({
  component: () => (
    <PagePlaceholder title="Quiz" description="Open a topic and click Quiz to generate an AI quiz." />
  ),
});
