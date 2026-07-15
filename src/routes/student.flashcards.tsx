import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/student/flashcards")({
  component: () => <Outlet />,
});
