import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const LEVEL_OPTIONS = ["NCC Level 3", "NCC Level 4", "NCC Level 5", "HNC", "HND"] as const;
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/subjects.functions";

export const Route = createFileRoute("/admin/subjects")({ component: Subjects });

type SubjectForm = {
  subject_code: string;
  subject_name: string;
  level: string;
  description: string;
};

const emptyForm: SubjectForm = {
  subject_code: "",
  subject_name: "",
  level: "NCC Level 4",
  description: "",
};

function Subjects() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSubjects);
  const createFn = useServerFn(createSubject);
  const updateFn = useServerFn(updateSubject);
  const deleteFn = useServerFn(deleteSubject);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => listFn(),
  });

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.subject_code.toLowerCase().includes(q) ||
        r.subject_name.toLowerCase().includes(q) ||
        r.level.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        subject_code: form.subject_code.trim(),
        subject_name: form.subject_name.trim(),
        level: form.level.trim() || "NCC Level 4",
        description: form.description.trim() || null,
      };
      if (editingId) {
        return updateFn({ data: { id: editingId, ...payload } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      toast.success(editingId ? "Subject updated" : "Subject added");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Subject deleted");
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit =
    form.subject_code.trim().length > 0 &&
    form.subject_name.trim().length > 0 &&
    form.level.trim().length > 0;

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(r: (typeof rows)[number]) {
    setEditingId(r.id);
    setForm({
      subject_code: r.subject_code,
      subject_name: r.subject_name,
      level: r.level,
      description: r.description ?? "",
    });
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Subject Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage NCC Level 4 subjects.
          </p>
        </div>
        <Button size="lg" className="shadow-soft" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Subject
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
              placeholder="Search subject by code, name, or level..."
              className="h-12 rounded-xl border-border/70 bg-background pl-11 text-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">Subject Code</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Subject Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Level</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Description</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                      No subjects available.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.subject_code}</TableCell>
                      <TableCell className="font-medium">{r.subject_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.level}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {r.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(`Delete ${r.subject_code}?`)) {
                                deleteMutation.mutate(r.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {rows.length} subjects
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Subject" : "Add Subject"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update subject details." : "Create a new NCC Level 4 subject."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-code">Subject Code</Label>
              <Input
                id="s-code"
                placeholder="e.g. CS4-106"
                value={form.subject_code}
                onChange={(e) => setForm((f) => ({ ...f, subject_code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-name">Subject Name</Label>
              <Input
                id="s-name"
                placeholder="e.g. Operating Systems"
                value={form.subject_name}
                onChange={(e) => setForm((f) => ({ ...f, subject_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-level">Level</Label>
              <Select
                value={form.level || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
              >
                <SelectTrigger id="s-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea
                id="s-desc"
                placeholder="Short description of the subject..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
