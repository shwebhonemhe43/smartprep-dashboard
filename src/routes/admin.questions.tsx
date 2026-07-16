import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, Eye, Trash2, UploadCloud, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listSubjects } from "@/lib/subjects.functions";
import {
  listOldQuestions,
  createOldQuestion,
  deleteOldQuestion,
  signOldQuestionUrl,
} from "@/lib/old-questions.functions";

export const Route = createFileRoute("/admin/questions")({ component: OldQuestions });

const ALLOWED = ["pdf", "ppt", "pptx", "doc", "docx"] as const;
const ACCEPT = ".pdf,.ppt,.pptx,.doc,.docx";

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function OldQuestions() {
  const qc = useQueryClient();
  const listFn = useServerFn(listOldQuestions);
  const listSubjectsFn = useServerFn(listSubjects);
  const createFn = useServerFn(createOldQuestion);
  const deleteFn = useServerFn(deleteOldQuestion);
  const signFn = useServerFn(signOldQuestionUrl);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["old_questions"],
    queryFn: () => listFn(),
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => listSubjectsFn(),
  });

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [examYear, setExamYear] = useState<string>(String(new Date().getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (subjectFilter !== "all" && r.subject_id !== subjectFilter) return false;
      if (!q) return true;
      const subj = (r as any).subjects;
      return (
        r.file_name.toLowerCase().includes(q) ||
        r.file_type.toLowerCase().includes(q) ||
        String(r.exam_year).includes(q) ||
        (subj?.subject_name ?? "").toLowerCase().includes(q) ||
        (subj?.subject_code ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, subjectFilter]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("File deleted");
      qc.invalidateQueries({ queryKey: ["old_questions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setSelectedSubject("");
    setExamYear(String(new Date().getFullYear()));
    setFile(null);
  }

  async function handleUpload() {
    if (!selectedSubject) return toast.error("Please select a subject.");
    const year = Number(examYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2999) {
      return toast.error("Please enter a valid exam year.");
    }
    if (!file) return toast.error("Please choose a file.");
    const ext = extOf(file.name);
    if (!ALLOWED.includes(ext as any)) {
      return toast.error("Only PDF, PPT, PPTX, DOC, DOCX are allowed.");
    }
    setUploading(true);
    try {
      const path = `${selectedSubject}/${year}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("old-question-files")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      await createFn({
        data: {
          subject_id: selectedSubject,
          file_name: file.name,
          file_type: ext.toUpperCase(),
          file_url: path,
          exam_year: year,
        },
      });

      toast.success("File uploaded");
      qc.invalidateQueries({ queryKey: ["old_questions"] });
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleView(path: string) {
    try {
      const { url } = await signFn({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err.message ?? "Could not open file");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Old Questions
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload and manage past exam papers.
          </p>
        </div>
        <Button size="lg" className="shadow-soft" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload Old Question
        </Button>
      </div>

      <div className="h-px w-full bg-border/70" />

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.subject_code} — {s.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search old questions..."
                className="h-12 rounded-xl border-border/70 bg-background pl-11 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">File Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Subject</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Exam Year</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">File Type</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Upload Date</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      No old questions uploaded.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const subj = (r as any).subjects;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.file_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {subj ? `${subj.subject_code} — ${subj.subject_name}` : "—"}
                        </TableCell>
                        <TableCell>{r.exam_year}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-md">
                            {r.file_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="View"
                              onClick={() => handleView(r.file_url)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete"
                              className="text-destructive hover:text-destructive"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (confirm(`Delete ${r.file_name}?`)) {
                                  deleteMutation.mutate(r.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {rows.length} files
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Old Question</DialogTitle>
            <DialogDescription>
              Supported files: PDF, PPT, PPTX, DOC, DOCX.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No subjects yet. Add one first.
                    </div>
                  ) : (
                    subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.subject_code} — {s.subject_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-year">Exam Year</Label>
              <Input
                id="q-year"
                type="number"
                min={1900}
                max={2999}
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-file">Upload File</Label>
              <label
                htmlFor="q-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground hover:bg-muted/50"
              >
                <UploadCloud className="h-6 w-6" />
                <span>{file ? file.name : "Click to browse or drag & drop"}</span>
                <span className="text-xs">PDF, PPT, PPTX, DOC, DOCX</span>
                <input
                  id="q-file"
                  type="file"
                  className="hidden"
                  accept={ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !selectedSubject || !examYear}
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
