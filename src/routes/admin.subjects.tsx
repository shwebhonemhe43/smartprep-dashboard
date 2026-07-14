import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";

export const Route = createFileRoute("/admin/subjects")({ component: () => (
  <PagePlaceholder title="Subject Management" description="Create, edit and organize NCC Level 4 Computing subjects." />
) });
