import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookMarked,
  FileText,
  FileQuestion,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, type NavGroup } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";

const groups: NavGroup[] = [
  {
    label: "",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Student Management",
    items: [
      { title: "Student Management", url: "/admin/students", icon: Users },
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
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — NCC SmartPrep" }] }),
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw redirect({ to: "/admin/login" });
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      toast.error("Access denied. Admins only.");
      throw redirect({ to: "/admin/login" });
    }
  },
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
