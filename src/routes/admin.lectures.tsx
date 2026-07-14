import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";

export const Route = createFileRoute("/admin/lectures")({ component: () => (
  <PagePlaceholder title="Lecture Files" description="Upload and organize lecture materials that power AI notes." />
) });
