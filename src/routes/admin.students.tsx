import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  addPreRegisteredStudent,
  deletePreRegisteredStudent,
  listPreRegisteredStudents,
} from "@/lib/students.functions";

export const Route = createFileRoute("/admin/students")({ component: Students });

const EMAIL_DOMAIN = "@student.strategyfirst.edu.mm";
const STUDENT_ID_RE = /^\d{4}D\d{4}$/;

function Students() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPreRegisteredStudents);
  const addFn = useServerFn(addPreRegisteredStudent);
  const delFn = useServerFn(deletePreRegisteredStudent);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["pre_registered_students"],
    queryFn: () => listFn(),
  });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    full_name: "",
    phone_number: "",
    program: "NCC",
  });

  const generatedEmail = form.student_id
    ? form.student_id.toLowerCase() + EMAIL_DOMAIN
    : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.student_id.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.program ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const addMutation = useMutation({
    mutationFn: async () => addFn({ data: form }),
    onSuccess: () => {
      toast.success("Student added");
      qc.invalidateQueries({ queryKey: ["pre_registered_students"] });
      setOpen(false);
      setForm({ student_id: "", full_name: "", phone_number: "", program: "NCC" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Student deleted");
      qc.invalidateQueries({ queryKey: ["pre_registered_students"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit =
    STUDENT_ID_RE.test(form.student_id) &&
    form.full_name.trim().length > 0 &&
    form.phone_number.trim().length > 0 &&
    form.program === "NCC";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Student Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add, search, and manage student records.
          </p>
        </div>
        <Button size="lg" className="shadow-soft" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="h-px w-full bg-border/70" />

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardContent className="space-y-6 p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email, or program..."
              className="h-12 rounded-xl border-border/70 bg-background pl-11 text-sm"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">Student ID</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Full Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Email</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Program</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Status</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Register Status</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Approval</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.student_id}</TableCell>
                      <TableCell className="font-medium">{r.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email}</TableCell>
                      <TableCell>{r.program}</TableCell>
                      <TableCell>
                        {r.status === "registered" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
                            Registered
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.register_status === "admin-register" ? (
                          <Badge className="bg-sky-500/15 text-sky-700 hover:bg-sky-500/20 dark:text-sky-400">
                            Admin-Register
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pre-Register</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.approval_status === "approved" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
                            Approved
                          </Badge>
                        ) : r.approval_status === "pending" ? (
                          <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="secondary">—</Badge>
                        )}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm(`Delete ${r.full_name}?`)) {
                              deleteMutation.mutate(r.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {rows.length} students
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Pre-register a new student. Email is auto-generated from Student ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID</Label>
              <Input
                id="student_id"
                placeholder="2025D0001"
                value={form.student_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, student_id: e.target.value.toUpperCase() }))
                }
              />
              {form.student_id && !STUDENT_ID_RE.test(form.student_id) && (
                <p className="text-xs text-destructive">
                  Format must be YYYYDXXXX (e.g. 2025D0001).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Input id="program" value={form.program} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (auto-generated)</Label>
              <Input
                id="email"
                value={generatedEmail}
                readOnly
                className="bg-muted/40 font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
