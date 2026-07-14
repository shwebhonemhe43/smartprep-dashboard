import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/subjects")({ component: () => (
  <PagePlaceholder title="Subjects" description="Browse your enrolled subjects and jump into topics." />
) });
