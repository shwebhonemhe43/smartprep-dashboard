import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookMarked,
  FileText,
  FileQuestion,
  Settings,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const items: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Student Management", url: "/admin/students", icon: Users },
  { title: "Subject Management", url: "/admin/subjects", icon: BookMarked },
  { title: "Lecture Files", url: "/admin/lectures", icon: FileText },
  { title: "Old Questions", url: "/admin/questions", icon: FileQuestion },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — NCC SmartPrep" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <DashboardShell items={items} groupLabel="Admin" title="Admin Console" subtitle="Manage students, subjects and resources">
      <Outlet />
    </DashboardShell>
  );
}
