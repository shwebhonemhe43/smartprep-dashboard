import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  ListChecks,
  Loader2,
  Mail,
  Phone,
  User as UserIcon,
  GraduationCap,
  ShieldCheck,
  Save,
  LogOut,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/student-profile.functions";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "Profile — NCC SmartPrep" }] }),
  component: ProfilePage,
});

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfilePage() {
  const fn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fn(),
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (data) {
      setFullName(data.full_name);
      setPhone(data.phone_number ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () =>
      updateFn({ data: { full_name: fullName.trim(), phone_number: phone.trim() || null } }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="p-6 text-sm text-destructive">
          {(error as Error)?.message ?? "Could not load profile."}
        </CardContent>
      </Card>
    );
  }

  const dirty = fullName.trim() !== data.full_name || (phone.trim() || null) !== (data.phone_number ?? null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-border/60 shadow-soft">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
            {initials(data.full_name) || <UserIcon className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{data.full_name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="h-3 w-3" /> {data.program}
              </Badge>
              {data.student_id && (
                <span className="font-mono">{data.student_id}</span>
              )}
              <Badge
                variant={data.approval_status === "approved" ? "default" : "outline"}
                className="gap-1"
              >
                <ShieldCheck className="h-3 w-3" /> {data.approval_status}
              </Badge>
              <span>Joined {new Date(data.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookMarked} label="Subjects" value={data.stats.subjects_enrolled} hint="Enrolled" accent="primary" />
        <StatCard
          icon={CheckCircle2}
          label="Topics Studied"
          value={data.stats.topics_completed}
          hint={`of ${data.stats.topics_total}`}
          accent="chart-2"
        />
        <StatCard
          icon={ListChecks}
          label="Quiz Accuracy"
          value={data.stats.quiz_avg_pct != null ? `${data.stats.quiz_avg_pct}%` : "—"}
          hint={
            data.stats.quiz_attempt_count
              ? `${data.stats.quiz_attempt_count} test${data.stats.quiz_attempt_count === 1 ? "" : "s"}`
              : "No attempts"
          }
          accent="chart-3"
        />
        <StatCard
          icon={Bookmark}
          label="Saved Library"
          value={data.stats.saved_flashcards + data.stats.saved_quizzes}
          hint={`${data.stats.saved_flashcards} decks · ${data.stats.saved_quizzes} quizzes`}
          accent="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal info form */}
        <Card className="border-border/60 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Personal information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +95 9…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input value={data.email} readOnly disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UserIcon className="h-3 w-3" /> Student ID
                </Label>
                <Input value={data.student_id ?? "—"} readOnly disabled className="font-mono" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => save.mutate()}
                disabled={!dirty || save.isPending || !fullName.trim()}
              >
                {save.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save changes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enrolled subjects */}
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Enrolled subjects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.enrolled_subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects enrolled yet.</p>
            ) : (
              data.enrolled_subjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.subject_name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{s.subject_code}</p>
                  </div>
                  {s.level && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {s.level}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact summary */}
      <Card className="border-border/60 shadow-soft">
        <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{data.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{data.phone_number || "No phone number on file"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
