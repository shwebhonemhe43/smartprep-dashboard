import { createFileRoute } from "@tanstack/react-router";
import { BookMarked, CheckCircle2, ListChecks, CalendarClock } from "lucide-react";
import { StatCard } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookMarked} label="Total Subjects" value={6} hint="This semester" accent="primary" />
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
          <CardHeader>
            <CardTitle className="font-display text-lg">This week's plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { name: "Database Design", pct: 65 },
              { name: "Networking", pct: 40 },
              { name: "Programming", pct: 82 },
            ].map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.pct}%</span>
                </div>
                <Progress value={s.pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
