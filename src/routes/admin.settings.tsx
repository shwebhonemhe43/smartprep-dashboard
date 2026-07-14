import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";

export const Route = createFileRoute("/admin/settings")({ component: () => (
  <PagePlaceholder title="Settings" description="Configure admin preferences and platform defaults." />
) });
