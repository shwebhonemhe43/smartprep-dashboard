import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
export const Route = createFileRoute("/student/resources")({ component: () => (
  <PagePlaceholder title="Resources" description="Access lecture files, past papers and reference material." />
) });
