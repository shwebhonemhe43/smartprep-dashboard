import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";

export const Route = createFileRoute("/admin/records")({
  component: () => (
    <PagePlaceholder
      title="Student Records"
      description="View and manage academic records for all enrolled students."
    />
  ),
});
