import { createFileRoute } from "@tanstack/react-router";
import { Users, BookMarked, FileText, FileQuestion } from "lucide-react";
import { StatCard } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const activity = [
  { who: "Sarah K.", what: "uploaded 3 new lecture files", when: "2h ago" },
  { who: "Admin", what: "added subject 'Database Design'", when: "5h ago" },
  { who: "James P.", what: "registered as a new student", when: "1d ago" },
  { who: "Admin", what: "uploaded 12 past paper questions", when: "2d ago" },
];

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value={248} hint="+12 this week" accent="primary" />
        <StatCard icon={BookMarked} label="Total Subjects" value={18} hint="Across 2 semesters" accent="chart-2" />
        <StatCard icon={FileText} label="Uploaded Lecture Files" value={342} hint="+27 this month" accent="chart-3" />
        <StatCard icon={FileQuestion} label="Uploaded Old Questions" value={126} hint="+8 this week" accent="accent" />
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
                  <span className="min-w-0">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.when}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Quick tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Upload high-quality lecture PDFs to improve AI note generation.</p>
            <p>Keep subject metadata up to date so plans stay accurate.</p>
            <p>Review student progress weekly to catch struggling learners early.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
