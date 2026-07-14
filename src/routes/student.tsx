import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookMarked,
  CalendarDays,
  Layers,
  ListChecks,
  User,
  FolderOpen,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";

const items: NavItem[] = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Subjects", url: "/student/subjects", icon: BookMarked },
  { title: "Study Plan", url: "/student/study-plan", icon: CalendarDays },
  { title: "Flashcards", url: "/student/flashcards", icon: Layers },
  { title: "Quiz", url: "/student/quiz", icon: ListChecks },
  { title: "Profile", url: "/student/profile", icon: User },
  { title: "Resources", url: "/student/resources", icon: FolderOpen },
];

export const Route = createFileRoute("/student")({
  ssr: false,
  head: () => ({ meta: [{ title: "Student — NCC SmartPrep" }] }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <DashboardShell items={items} groupLabel="Student" title="My Study Hub" subtitle="Your personalized learning space">
      <Outlet />
    </DashboardShell>
  );
}
