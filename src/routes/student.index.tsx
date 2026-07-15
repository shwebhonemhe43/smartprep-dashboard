import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookMarked, CheckCircle2, ListChecks, CalendarClock } from "lucide-react";
import { StatCard } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { listMyEnrollments } from "@/lib/enrollments.functions";
import { getLatestStudyPlan } from "@/lib/study-plans.functions";

export const Route = createFileRoute("/student/")({
  component: StudentDashboard,
});

const activity = [
  { what: "Completed quiz: Data Structures — Trees", when: "1h ago", score: "9/10" },
  { what: "Reviewed 24 flashcards on Networking", when: "3h ago" },
  { what: "Study plan updated for Database Design", when: "Yesterday" },
  { what: "Read notes: Object-Oriented Programming", when: "2 days ago" },
];

function StudentDashboard() {
  const enrollmentsFn = useServerFn(listMyEnrollments);
  const planFn = useServerFn(getLatestStudyPlan);
  const { data: enrollments } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsFn(),
  });
  const { data: planData } = useQuery({
    queryKey: ["latest-study-plan"],
    queryFn: () => planFn(),
  });
  const totalEnrolled = enrollments?.length ?? 0;

  // Group this week's plan items by title/subject, compute progress
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  const weekItems = (planData?.items ?? []).filter((it) => {
    const d = new Date(it.date);
    return d >= new Date(now.toDateString()) && d <= weekEnd;
  });
  const byTitle = new Map<string, { name: string; total: number; done: number }>();
  for (const it of weekItems) {
    const key = it.title;
    const cur = byTitle.get(key) ?? { name: it.title, total: 0, done: 0 };
    cur.total += 1;
    if (it.completed) cur.done += 1;
    byTitle.set(key, cur);
  }
  const weekPlan = Array.from(byTitle.values()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookMarked} label="Total Subjects" value={totalEnrolled} hint="Enrolled" accent="primary" />
        <StatCard icon={CheckCircle2} label="Topics Studied" value={38} hint="of 72" accent="chart-2" />
        <StatCard icon={ListChecks} label="Quiz Progress" value="72%" hint="Avg. accuracy" accent="chart-3" />
        <StatCard icon={CalendarClock} label="Upcoming Exam" value="18d" hint="Database Design" accent="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 truncate">{a.what}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    {a.score && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{a.score}</span>}
                    {a.when}
                  </span>
                </li>
              ))}
            </ul>
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
            {weekPlan.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No active study plan this week.{" "}
                <Link to="/student/study-plan" className="text-primary underline">Create one</Link>.
              </p>
            ) : (
              weekPlan.map((s) => {
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
