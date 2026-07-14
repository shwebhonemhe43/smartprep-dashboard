import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookMarked,
  FileText,
  FileQuestion,
  Settings,
} from "lucide-react";
import { DashboardShell, type NavGroup } from "@/components/dashboard-shell";

const groups: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Student Management",
    items: [
      { title: "Student Management", url: "/admin/students", icon: Users },
      { title: "Student Records", url: "/admin/records", icon: ClipboardList },
    ],
  },
  {
    label: "Resource Management",
    items: [
      { title: "Subject Management", url: "/admin/subjects", icon: BookMarked },
      { title: "Lecture Files", url: "/admin/lectures", icon: FileText },
      { title: "Old Questions", url: "/admin/questions", icon: FileQuestion },
    ],
  },
  {
    label: "",
    items: [{ title: "Settings", url: "/admin/settings", icon: Settings }],
  },
];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — NCC SmartPrep" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <DashboardShell
      groups={groups}
      title="Admin Console"
      subtitle="Manage students, subjects and resources"
    >
      <Outlet />
    </DashboardShell>
  );
}
