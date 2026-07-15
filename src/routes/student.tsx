import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  BookMarked,
  CalendarDays,
  Layers,
  ListChecks,
  User,
  
  Clock,
  Loader2,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { getMyApprovalStatus } from "@/lib/approvals.functions";
import { Card, CardContent } from "@/components/ui/card";

const items: NavItem[] = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Subjects", url: "/student/subjects", icon: BookMarked },
  { title: "Study Plan", url: "/student/study-plan", icon: CalendarDays },
  { title: "Flashcards", url: "/student/flashcards", icon: Layers },
  { title: "Quiz", url: "/student/quiz", icon: ListChecks },
  { title: "Profile", url: "/student/profile", icon: User },
  
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

const ALWAYS_ALLOWED = ["/student", "/student/", "/student/profile"];

function StudentLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const statusFn = useServerFn(getMyApprovalStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["my-approval-status"],
    queryFn: () => statusFn(),
    staleTime: 30_000,
  });

  const isApproved = data?.approval_status === "approved";
  const isDashboardOrProfile = ALWAYS_ALLOWED.includes(path);
  const blocked = !isLoading && !isApproved && !isDashboardOrProfile;

  return (
    <DashboardShell
      items={items}
      groupLabel="Student"
      title="My Study Hub"
      subtitle="Your personalized learning space"
    >
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : blocked ? (
        <PendingApprovalCard />
      ) : (
        <>
          {!isApproved && <PendingBanner />}
          <Outlet />
        </>
      )}
    </DashboardShell>
  );
}

function PendingBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Awaiting administrator approval</p>
        <p className="text-amber-700/90 dark:text-amber-300/80">
          You can view your dashboard, but learning features unlock once an admin approves your
          account.
        </p>
      </div>
    </div>
  );
}

function PendingApprovalCard() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-md border-border/60 shadow-soft">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="rounded-full bg-amber-500/15 p-4 text-amber-600 dark:text-amber-400">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-semibold">Waiting for approval</h2>
          <p className="text-sm text-muted-foreground">
            You need administrator approval to access this section. Please check back after your
            account has been approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
