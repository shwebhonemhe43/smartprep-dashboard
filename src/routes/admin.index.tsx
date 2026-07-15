import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  UserPlus,
  Upload,
  Check,
  Loader2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveStudent, listPendingApprovals, listStudentProfiles } from "@/lib/approvals.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const stats: Stat[] = [
  { label: "Total Students", value: "1,248", hint: "+12.4%", icon: Users },
  { label: "Learning Resources", value: "342", hint: "+5 this week", icon: BookOpen },
  { label: "Active This Week", value: "876", hint: "+8.1%", icon: TrendingUp },
  { label: "Study Plans Generated", value: "2,914", hint: "+18.2%", icon: BarChart3 },
];

type QuickAction = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const quickActions: QuickAction[] = [
  {
    title: "Import Students",
    description: "Bulk upload student records via CSV",
    icon: UserPlus,
  },
  {
    title: "Upload Resources",
    description: "Add new learning materials for students",
    icon: Upload,
  },
  {
    title: "View Analytics",
    description: "Track engagement and performance",
    icon: BarChart3,
  },
];

type Activity = {
  title: string;
  when: string;
  tag: "Students" | "Resources";
};

const activity: Activity[] = [
  { title: "Imported 42 student records", when: "2 hours ago", tag: "Students" },
  { title: "Uploaded 'Data Structures — Week 4.pdf'", when: "5 hours ago", tag: "Resources" },
  { title: "Approved 8 new registrations", when: "Yesterday", tag: "Students" },
  { title: "Published new practice quiz set", when: "2 days ago", tag: "Resources" },
  { title: "Updated Networking syllabus outline", when: "3 days ago", tag: "Resources" },
];

function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1.5 border-b border-border/60 pb-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back — here's what's happening at NCC SmartPrep today.
        </p>
      </div>

      <PendingApprovals />

      <StudentList />



      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="rounded-2xl border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 font-display text-4xl font-extrabold tracking-tight">
                {s.value}
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {s.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/60 shadow-soft lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl font-bold">
              Quick Actions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Common tasks to keep the platform running smoothly
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((a) => (
                <button
                  key={a.title}
                  type="button"
                  className="group flex items-start gap-4 rounded-xl border border-border/60 bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{a.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {a.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-xl font-bold">
              Recent Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest actions across the platform
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.when}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      a.tag === "Students"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {a.tag}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PendingApprovals() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPendingApprovals);
  const approveFn = useServerFn(approveStudent);

  const { data = [], isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: () => listFn(),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => approveFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Student approved");
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card className="rounded-2xl border-border/60 shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Pending Approvals
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Students awaiting your approval to access the platform
            </p>
          </div>
          {data.length > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {data.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No students waiting for approval.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{s.student_id}</span> · {s.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(s.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
