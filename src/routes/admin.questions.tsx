import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Eye, Trash2, UploadCloud } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/questions")({ component: Questions });

type QuestionRow = {
  name: string;
  subject: string;
  year: string;
  questions: number;
  topics: string[];
};

const rows: QuestionRow[] = [
  {
    name: "Computer Systems - 2023.pdf",
    subject: "Computer Systems",
    year: "2023",
    questions: 25,
    topics: ["CPU", "Memory", "I/O"],
  },
  {
    name: "Databases - 2022.pdf",
    subject: "Databases",
    year: "2022",
    questions: 20,
    topics: ["SQL", "Normalization"],
  },
  {
    name: "Software Dev - 2024.pdf",
    subject: "Software Development",
    year: "2024",
    questions: 30,
    topics: ["OOP", "Testing", "SDLC"],
  },
];

const subjects = [
  "Computer Systems",
  "Software Development",
  "Databases",
  "Networking Fundamentals",
  "Web Design",
];

const years = ["2020", "2021", "2022", "2023", "2024", "2025"];

function Questions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Old Questions
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload and manage previous exam papers.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-soft">
              <Plus className="h-4 w-4" />
              Upload Question Paper
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Question Paper</DialogTitle>
              <DialogDescription>
                Add a previous exam paper for practice and analysis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Subject</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Exam Year</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s1">Semester 1</SelectItem>
                      <SelectItem value="s2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-file">Upload File</Label>
                <label
                  htmlFor="q-file"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground hover:bg-muted/50"
                >
                  <UploadCloud className="h-6 w-6" />
                  <span>Click to browse or drag & drop</span>
                  <span className="text-xs">PDF, DOCX</span>
                  <input id="q-file" type="file" className="hidden" accept=".pdf,.docx" />
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-px w-full bg-border/70" />

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select>
              <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">File Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Subject</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Year</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Questions</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Topics Detected</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      No question papers uploaded.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.subject}</TableCell>
                      <TableCell>{r.year}</TableCell>
                      <TableCell>{r.questions}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {r.topics.map((t) => (
                            <Badge key={t} variant="secondary" className="rounded-md">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" aria-label="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive"
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
            Showing {rows.length} of {rows.length} papers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
