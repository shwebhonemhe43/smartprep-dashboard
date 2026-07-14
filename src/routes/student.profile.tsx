import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/profile")({ component: () => (
  <PagePlaceholder title="Profile" description="Manage your personal info, preferences and exam schedule." />
) });
