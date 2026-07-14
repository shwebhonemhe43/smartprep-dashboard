import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";

export const Route = createFileRoute("/admin/questions")({ component: () => (
  <PagePlaceholder title="Old Questions" description="Manage past papers used for AI priority analysis and practice quizzes." />
) });
