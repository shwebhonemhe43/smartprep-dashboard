import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, CheckCircle2, ListChecks, CalendarClock, Clock, Loader2, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { getStudentDashboard } from "@/lib/student-dashboard.functions";
import { togglePlanItem } from "@/lib/study-plans.functions";

export const Route = createFileRoute("/student/")({
  component: StudentDashboard,
});

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StudentDashboard() {
  const fn = useServerFn(getStudentDashboard);
  const toggleFn = useServerFn(togglePlanItem);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });

  const toggle = useMutation({
    mutationFn: async (v: { id: string; completed: boolean }) =>
      toggleFn({ data: { item_id: v.id, completed: v.completed } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-dashboard"] });
      qc.invalidateQueries({ queryKey: ["latest-study-plan"] });
      qc.invalidateQueries({ queryKey: ["my-study-plans"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const totals = data?.totals;
  const upcoming = totals?.upcoming_exam;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookMarked}
          label="Total Subjects"
          value={isLoading ? "—" : totals?.subjects_enrolled ?? 0}
          hint="Enrolled"
          accent="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Topics Studied"
          value={isLoading ? "—" : totals?.topics_completed ?? 0}
          hint={isLoading ? "" : `of ${totals?.topics_total ?? 0}`}
          accent="chart-2"
        />
        <StatCard
          icon={ListChecks}
          label="Quiz Progress"
          value={
            isLoading
              ? "—"
              : totals?.quiz_avg_pct != null
                ? `${totals.quiz_avg_pct}%`
                : "—"
          }
          hint={
            totals?.quiz_attempt_count
              ? `Avg. accuracy · ${totals.quiz_attempt_count} test${totals.quiz_attempt_count === 1 ? "" : "s"}`
              : "No quiz attempts yet"
          }
          accent="chart-3"
        />
        <StatCard
          icon={CalendarClock}
          label="Upcoming Exam"
          value={
            isLoading
              ? "—"
              : upcoming
                ? `${upcoming.days_remaining}d`
                : "—"
          }
          hint={upcoming ? upcoming.subject_name : "No scheduled exam"}
          accent="accent"
        />
      </div>

      {/* Today's Study Plan */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Today's Study Plan</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/student/study-plan">View plan</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : !data?.today || data.today.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled for today.{" "}
              <Link to="/student/study-plan" className="text-primary underline">
                Open your study plan
              </Link>
              .
            </p>
          ) : (
            data.today.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-border/60 p-4 transition",
                  s.completed && "bg-muted/40",
                )}
              >
                <Checkbox
                  checked={s.completed}
                  onCheckedChange={(v) => toggle.mutate({ id: s.id, completed: !!v })}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={cn(
                      "font-display font-semibold",
                      s.completed && "text-muted-foreground line-through",
                    )}
                  >
                    {s.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {s.start_time && s.end_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {s.start_time} — {s.end_time}
                      </span>
                    )}
                    <span>{s.duration_minutes} min</span>
                    {s.completed ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <CircleDashed className="h-3.5 w-3.5" /> Not done
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !data?.activity || data.activity.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No activity yet — start a topic or generate a quiz.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.activity.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0 truncate">{a.what}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      {a.score && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          {a.score}
                        </span>
                      )}
                      {timeAgo(a.when)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">This week's plan</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/student/study-plan">View</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !data?.week_plan || data.week_plan.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No sessions scheduled this week.{" "}
                <Link to="/student/study-plan" className="text-primary underline">
                  Create a plan
                </Link>
                .
              </p>
            ) : (
              data.week_plan.map((s) => {
                const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="truncate font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
