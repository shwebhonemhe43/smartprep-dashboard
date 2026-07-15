import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, Clock, Loader2, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createStudyPlan,
  getLatestStudyPlan,
  listEnrolledSubjectsForPlan,
  togglePlanItem,
  type StudyPlanItem,
} from "@/lib/study-plans.functions";

export const Route = createFileRoute("/student/study-plan")({
  head: () => ({ meta: [{ title: "Study Plan — NCC SmartPrep" }] }),
  component: StudyPlanPage,
});

const WEEKDAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;
const SLOTS = ["morning", "afternoon", "evening"] as const;

function StudyPlanPage() {
  const qc = useQueryClient();
  const latestFn = useServerFn(getLatestStudyPlan);
  const toggleFn = useServerFn(togglePlanItem);
  const { data, isLoading } = useQuery({
    queryKey: ["latest-study-plan"],
    queryFn: () => latestFn(),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { item_id: string; completed: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["latest-study-plan"] }),
  });

  const [open, setOpen] = useState(false);

  const items = data?.items ?? [];
  const plan = data?.plan;
  const subject = data?.subject ?? null;
  const completed = items.filter((i) => i.completed).length;
  const progressPct = items.length ? Math.round((completed / items.length) * 100) : 0;

  const groupedByDate = useMemo(() => {
    const map = new Map<string, StudyPlanItem[]>();
    for (const it of items) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const remainingDays = plan
    ? Math.max(
        0,
        Math.ceil(
          (new Date(plan.exam_date).getTime() - new Date(new Date().toDateString()).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Study Plan</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated schedule for one of your enrolled subjects.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" /> Create New Study Plan
            </Button>
          </DialogTrigger>
          <CreatePlanDialog
            onCreated={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["latest-study-plan"] });
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !plan ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 text-primary/60" />
            <p className="font-medium text-foreground">No study plan yet</p>
            <p className="text-sm">Click "Create New Study Plan" to generate your first personalized schedule.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/60 shadow-soft">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Latest Study Plan
                </CardTitle>
                {subject ? (
                  <p className="text-sm">
                    <span className="font-medium">Subject:</span>{" "}
                    {subject.subject_name} ({subject.subject_code})
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(plan.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={plan.plan_type === "topic" ? "secondary" : "default"} className="w-fit capitalize">
                {plan.plan_type} based
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Stat icon={BookOpen} label="Subject" value={subject?.subject_code ?? "—"} />
              <Stat icon={CalendarDays} label="Exam date" value={new Date(plan.exam_date).toLocaleDateString()} />
              <Stat icon={Clock} label="Remaining days" value={`${remainingDays}`} />
              <Stat icon={Target} label="Sessions" value={`${items.length}`} />
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPct}%</span>
                </div>
                <Progress value={progressPct} />
                <p className="mt-1 text-xs text-muted-foreground">{completed} of {items.length} done</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Schedule</h2>
            {groupedByDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions scheduled.</p>
            ) : (
              groupedByDate.map(([date, dayItems]) => (
                <Card key={date} className="border-border/60 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-base">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayItems.map((it) => (
                      <ScheduleItem
                        key={it.id}
                        it={it}
                        onToggle={(v) => toggleMut.mutate({ item_id: it.id, completed: v })}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <Icon className="h-5 w-5 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ScheduleItem({
  it,
  onToggle,
}: {
  it: StudyPlanItem;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/60 p-3 transition",
        it.completed && "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20",
      )}
    >
      <Checkbox checked={it.completed} onCheckedChange={(v) => onToggle(Boolean(v))} className="mt-1" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {it.start_time && it.end_time && (
            <span className="font-mono">{it.start_time} – {it.end_time}</span>
          )}
          <span>· {it.duration_minutes} min</span>
        </div>
        <p className={cn("mt-0.5 font-medium", it.completed && "text-muted-foreground line-through")}>
          {it.title}
        </p>
        {it.description && <p className="mt-1 text-sm text-muted-foreground">{it.description}</p>}
      </div>
    </div>
  );
}

function CreatePlanDialog({ onCreated }: { onCreated: () => void }) {
  const createFn = useServerFn(createStudyPlan);
  const subjectsFn = useServerFn(listEnrolledSubjectsForPlan);
  const { data: subjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ["enrolled-subjects-plan"],
    queryFn: () => subjectsFn(),
  });

  const [subjectId, setSubjectId] = useState<string>("");
  const [examDate, setExamDate] = useState("");
  const [planType, setPlanType] = useState<"topic" | "priority">("topic");
  const [proficiency, setProficiency] = useState<"strong" | "medium" | "weak">("medium");
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [priorities, setPriorities] = useState<string[]>([""]);

  const mut = useMutation({
    mutationFn: (payload: {
      subject_id: string;
      exam_date: string;
      plan_type: "topic" | "priority";
      proficiency: "strong" | "medium" | "weak";
      available_hours: Record<string, string[]>;
      priorities?: string[];
    }) => createFn({ data: payload }),
    onSuccess: () => {
      toast.success("Study plan generated!");
      onCreated();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to generate plan"),
  });

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) => {
      const cur = prev[day] ?? [];
      const next = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot];
      return { ...prev, [day]: next };
    });
  };

  const handleSubmit = () => {
    if (!subjectId) return toast.error("Please select a subject");
    if (!examDate) return toast.error("Please pick an exam date");
    const hasAny = Object.values(availability).some((v) => v.length > 0);
    if (!hasAny) return toast.error("Select at least one available time slot");
    if (planType === "priority") {
      const cleaned = priorities.map((p) => p.trim()).filter(Boolean);
      if (cleaned.length === 0) return toast.error("Add at least one priority");
      mut.mutate({ subject_id: subjectId, exam_date: examDate, plan_type: planType, proficiency, available_hours: availability, priorities: cleaned });
    } else {
      mut.mutate({ subject_id: subjectId, exam_date: examDate, plan_type: planType, proficiency, available_hours: availability });
    }
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">Create Study Plan</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-2">
        <div className="space-y-2">
          <Label htmlFor="exam-date">Exam date</Label>
          <Input
            id="exam-date"
            type="date"
            value={examDate}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue
                placeholder={loadingSubjects ? "Loading..." : subjects && subjects.length === 0 ? "No enrolled subjects" : "Select a subject"}
              />
            </SelectTrigger>
            <SelectContent>
              {(subjects ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.subject_name} ({s.subject_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {subjects && subjects.length === 0 && (
            <p className="text-xs text-muted-foreground">Enroll in a subject first to create a study plan.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Plan type</Label>
          <RadioGroup
            value={planType}
            onValueChange={(v) => setPlanType(v as "topic" | "priority")}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              className={cn(
                "cursor-pointer rounded-lg border border-border/60 p-3 transition",
                planType === "topic" && "border-primary bg-primary/5",
              )}
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="topic" className="mt-1" />
                <div>
                  <p className="font-medium">Topic based</p>
                  <p className="text-xs text-muted-foreground">
                    Schedule topics from the selected subject.
                  </p>
                </div>
              </div>
            </label>
            <label
              className={cn(
                "cursor-pointer rounded-lg border border-border/60 p-3 transition",
                planType === "priority" && "border-primary bg-primary/5",
              )}
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="priority" className="mt-1" />
                <div>
                  <p className="font-medium">Priority based</p>
                  <p className="text-xs text-muted-foreground">
                    Provide priority goals within the selected subject.
                  </p>
                </div>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Subject proficiency</Label>
          <Select value={proficiency} onValueChange={(v) => setProficiency(v as "strong" | "medium" | "weak")}>
            <SelectTrigger>
              <SelectValue placeholder="Select proficiency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">Strong — mostly advanced practice & revision</SelectItem>
              <SelectItem value="medium">Medium — balanced coverage</SelectItem>
              <SelectItem value="weak">Weak — more foundational sessions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Available study time</Label>
          <p className="text-xs text-muted-foreground">
            Morning 09:00–12:00 · Afternoon 14:00–17:00 · Evening 19:00–22:00
          </p>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Day</th>
                  {SLOTS.map((s) => (
                    <th key={s} className="p-2 text-center capitalize">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((d) => (
                  <tr key={d.key} className="border-t border-border/60">
                    <td className="p-2 font-medium">{d.label}</td>
                    {SLOTS.map((s) => (
                      <td key={s} className="p-2 text-center">
                        <Checkbox
                          checked={(availability[d.key] ?? []).includes(s)}
                          onCheckedChange={() => toggleSlot(d.key, s)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {planType === "priority" && (
          <div className="space-y-2">
            <Label>Priorities</Label>
            <div className="space-y-2">
              {priorities.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Priority ${i + 1}`}
                    value={p}
                    onChange={(e) => {
                      const next = [...priorities];
                      next[i] = e.target.value;
                      setPriorities(next);
                    }}
                  />
                  {priorities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPriorities(priorities.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPriorities([...priorities, ""])}
              >
                <Plus className="mr-2 h-4 w-4" /> Add priority
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleSubmit} disabled={mut.isPending} className="gap-2">
          {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate plan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
