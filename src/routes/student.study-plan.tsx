import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/study-plan")({ component: () => (
  <PagePlaceholder title="Study Plan" description="Your AI-generated weekly study schedule and milestones." />
) });
