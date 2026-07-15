import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  createStudyPlan,
  deleteStudyPlan,
  getStudyPlanById,
  listEnrolledSubjectsForPlan,
  listMyStudyPlans,
  togglePlanItem,
  updateStudyPlan,
  type StudyPlan,
  type StudyPlanItem,
  type StudyPlanWithStats,
  type SubjectRef,
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

function daysUntil(dateStr: string) {
  return Math.max(
    0,
    Math.ceil(
      (new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}

function StudyPlanPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyStudyPlans);
  const { data: plans, isLoading } = useQuery({
    queryKey: ["my-study-plans"],
    queryFn: () => listFn(),
  });

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return (
      <StudyPlanDetail
        planId={selectedId}
        onBack={() => setSelectedId(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ["my-study-plans"] })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">My Study Plans</h1>
          <p className="text-sm text-muted-foreground">
            All your AI-generated study plans, latest first.
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
              qc.invalidateQueries({ queryKey: ["my-study-plans"] });
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
      ) : !plans || plans.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 text-primary/60" />
            <p className="font-medium text-foreground">No study plans yet</p>
            <p className="text-sm">
              Click "Create New Study Plan" to generate your first personalized schedule.
            </p>
            <Button className="mt-2 gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create New Study Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((p) => (
            <PlanCard
              key={p.plan.id}
              entry={p}
              onOpen={() => setSelectedId(p.plan.id)}
              onChanged={() => qc.invalidateQueries({ queryKey: ["my-study-plans"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  entry,
  onOpen,
  onChanged,
}: {
  entry: StudyPlanWithStats;
  onOpen: () => void;
  onChanged: () => void;
}) {
  const { plan, subject, total_items, completed_items } = entry;
  const pct = total_items ? Math.round((completed_items / total_items) * 100) : 0;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteFn = useServerFn(deleteStudyPlan);
  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ data: { plan_id: plan.id } }),
    onSuccess: () => {
      toast.success("Study plan deleted");
      setDeleteOpen(false);
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete plan"),
  });

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer border-border/60 shadow-soft transition hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <CardContent className="flex flex-col gap-5 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subject
            </p>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">{subject?.subject_name ?? "Study Plan"}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Created {new Date(plan.created_at).toLocaleDateString()}
            </p>
          </div>
          <ChevronRight className="mt-1 hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={plan.plan_type === "topic" ? "secondary" : "default"}
            className="w-fit capitalize"
          >
            {plan.plan_type} based
          </Badge>
          {plan.subject_proficiency && (
            <Badge variant="outline" className="w-fit capitalize">
              {plan.subject_proficiency} proficiency
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={CalendarDays}
            label="Exam date"
            value={new Date(plan.exam_date).toLocaleDateString()}
          />
          <Stat icon={Clock} label="Remaining days" value={`${daysUntil(plan.exam_date)}`} />
          <Stat icon={Target} label="Sessions" value={`${total_items}`} />
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <Progress value={pct} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {completed_items} of {total_items} sessions completed
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1" onClick={stop} onKeyDown={stop}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <EditPlanDialog
          plan={plan}
          subject={subject}
          onSaved={() => {
            setEditOpen(false);
            onChanged();
          }}
        />
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onClick={stop}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the plan and all its scheduled sessions. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMut.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function StudyPlanDetail({
  planId,
  onBack,
  onChanged,
}: {
  planId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getStudyPlanById);
  const toggleFn = useServerFn(togglePlanItem);
  const { data, isLoading } = useQuery({
    queryKey: ["study-plan", planId],
    queryFn: () => getFn({ data: { plan_id: planId } }),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { item_id: string; completed: boolean }) => toggleFn({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-plan", planId] });
      onChanged();
    },
  });

  const items = data?.items ?? [];
  const plan = data?.plan as StudyPlan | undefined;
  const subject = (data?.subject ?? null) as SubjectRef | null;
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

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to My Study Plans
        </Button>
      </div>

      {isLoading || !plan ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/60 shadow-soft">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {subject ? `${subject.subject_name} (${subject.subject_code})` : "Study Plan"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(plan.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={plan.plan_type === "topic" ? "secondary" : "default"}
                  className="w-fit capitalize"
                >
                  {plan.plan_type} based
                </Badge>
                {plan.subject_proficiency && (
                  <Badge variant="outline" className="w-fit capitalize">
                    {plan.subject_proficiency} proficiency
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Stat icon={BookOpen} label="Subject" value={subject?.subject_code ?? "—"} />
              <Stat
                icon={CalendarDays}
                label="Exam date"
                value={new Date(plan.exam_date).toLocaleDateString()}
              />
              <Stat icon={Clock} label="Remaining days" value={`${daysUntil(plan.exam_date)}`} />
              <Stat icon={Target} label="Sessions" value={`${items.length}`} />
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPct}%</span>
                </div>
                <Progress value={progressPct} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {completed} of {items.length} done
                </p>
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

function ScheduleItem({ it, onToggle }: { it: StudyPlanItem; onToggle: (v: boolean) => void }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/60 p-3 transition",
        it.completed && "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20",
      )}
    >
      <Checkbox
        checked={it.completed}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {new Date(it.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          {it.start_time && it.end_time && (
            <span className="font-mono">
              · {it.start_time} – {it.end_time}
            </span>
          )}
          <span>· {it.duration_minutes} min</span>
        </div>
        <p
          className={cn("mt-0.5 font-medium", it.completed && "text-muted-foreground line-through")}
        >
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
      mut.mutate({
        subject_id: subjectId,
        exam_date: examDate,
        plan_type: planType,
        proficiency,
        available_hours: availability,
        priorities: cleaned,
      });
    } else {
      mut.mutate({
        subject_id: subjectId,
        exam_date: examDate,
        plan_type: planType,
        proficiency,
        available_hours: availability,
      });
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
                placeholder={
                  loadingSubjects
                    ? "Loading..."
                    : subjects && subjects.length === 0
                      ? "No enrolled subjects"
                      : "Select a subject"
                }
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
            <p className="text-xs text-muted-foreground">
              Enroll in a subject first to create a study plan.
            </p>
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
          <p className="text-xs text-muted-foreground">
            Tell us how confident you are in this subject so AI can adjust your study time and
            difficulty.
          </p>
          <Select
            value={proficiency}
            onValueChange={(v) => setProficiency(v as "strong" | "medium" | "weak")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select proficiency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">
                Strong — I understand this subject well (more revision & practice)
              </SelectItem>
              <SelectItem value="medium">
                Medium — I have average understanding (balanced study)
              </SelectItem>
              <SelectItem value="weak">
                Weak — I need more help with this subject (more learning time)
              </SelectItem>
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
                    <th key={s} className="p-2 text-center capitalize">
                      {s}
                    </th>
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

function EditPlanDialog({
  plan,
  subject,
  onSaved,
}: {
  plan: StudyPlan;
  subject: SubjectRef | null;
  onSaved: () => void;
}) {
  const updateFn = useServerFn(updateStudyPlan);
  const [examDate, setExamDate] = useState(plan.exam_date);
  const [proficiency, setProficiency] = useState<"strong" | "medium" | "weak">(
    (plan.subject_proficiency as "strong" | "medium" | "weak") ?? "medium",
  );
  const [availability, setAvailability] = useState<Record<string, string[]>>(
    (plan.available_hours as Record<string, string[]>) ?? {},
  );
  const [priorities, setPriorities] = useState<string[]>(
    plan.priorities && plan.priorities.length > 0 ? plan.priorities : [""],
  );

  const mut = useMutation({
    mutationFn: (payload: {
      plan_id: string;
      exam_date: string;
      proficiency: "strong" | "medium" | "weak";
      available_hours: Record<string, string[]>;
      priorities?: string[];
    }) => updateFn({ data: payload }),
    onSuccess: () => {
      toast.success("Study plan updated");
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update plan"),
  });

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) => {
      const cur = prev[day] ?? [];
      const next = cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot];
      return { ...prev, [day]: next };
    });
  };

  const handleSubmit = () => {
    if (!examDate) return toast.error("Please pick an exam date");
    const hasAny = Object.values(availability).some((v) => v.length > 0);
    if (!hasAny) return toast.error("Select at least one available time slot");
    if (plan.plan_type === "priority") {
      const cleaned = priorities.map((p) => p.trim()).filter(Boolean);
      if (cleaned.length === 0) return toast.error("Add at least one priority");
      mut.mutate({
        plan_id: plan.id,
        exam_date: examDate,
        proficiency,
        available_hours: availability,
        priorities: cleaned,
      });
    } else {
      mut.mutate({
        plan_id: plan.id,
        exam_date: examDate,
        proficiency,
        available_hours: availability,
      });
    }
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">Edit Study Plan</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Subject</p>
          <p className="font-medium">
            {subject ? `${subject.subject_name} (${subject.subject_code})` : "—"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Subject and plan type ({plan.plan_type} based) cannot be changed. Saving will regenerate
            the schedule.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-exam-date">Exam date</Label>
          <Input
            id="edit-exam-date"
            type="date"
            value={examDate}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Subject proficiency</Label>
          <Select
            value={proficiency}
            onValueChange={(v) => setProficiency(v as "strong" | "medium" | "weak")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong">
                Strong — I understand this subject well (more revision & practice)
              </SelectItem>
              <SelectItem value="medium">
                Medium — I have average understanding (balanced study)
              </SelectItem>
              <SelectItem value="weak">
                Weak — I need more help with this subject (more learning time)
              </SelectItem>
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
                    <th key={s} className="p-2 text-center capitalize">
                      {s}
                    </th>
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

        {plan.plan_type === "priority" && (
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
          Save & regenerate
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
