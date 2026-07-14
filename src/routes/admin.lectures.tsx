import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Eye, Trash2, UploadCloud } from "lucide-react";
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

export const Route = createFileRoute("/admin/lectures")({ component: Lectures });

type LectureRow = {
  name: string;
  subject: string;
  type: string;
  topics: number;
  date: string;
};

const rows: LectureRow[] = [
  { name: "Intro to Computer Systems.pdf", subject: "Computer Systems", type: "PDF", topics: 4, date: "2025-06-12" },
  { name: "OOP Fundamentals.pptx", subject: "Software Development", type: "PPTX", topics: 5, date: "2025-06-14" },
  { name: "Normalization.docx", subject: "Databases", type: "DOCX", topics: 3, date: "2025-06-18" },
  { name: "TCP-IP Overview.ppt", subject: "Networking Fundamentals", type: "PPT", topics: 6, date: "2025-06-20" },
];

const subjects = [
  "Computer Systems",
  "Software Development",
  "Databases",
  "Networking Fundamentals",
  "Web Design",
];

function Lectures() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Lecture Files
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload and manage lecture materials.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-soft">
              <Plus className="h-4 w-4" />
              Upload Lecture File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Lecture File</DialogTitle>
              <DialogDescription>
                Supported files: PDF, PPT, PPTX, DOCX.
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
              <div className="space-y-2">
                <Label htmlFor="l-title">File Title</Label>
                <Input id="l-title" placeholder="e.g. Week 1 - Introduction" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-file">Upload File</Label>
                <label
                  htmlFor="l-file"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground hover:bg-muted/50"
                >
                  <UploadCloud className="h-6 w-6" />
                  <span>Click to browse or drag & drop</span>
                  <span className="text-xs">PDF, PPT, PPTX, DOCX</span>
                  <input id="l-file" type="file" className="hidden" accept=".pdf,.ppt,.pptx,.docx" />
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
          <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
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
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search lecture files..."
                className="h-12 rounded-xl border-border/70 bg-background pl-11 text-sm"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">File Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Subject</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">File Type</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Topics</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Uploaded Date</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      No lecture files uploaded.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.subject}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-md">
                          {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.topics}</TableCell>
                      <TableCell className="text-muted-foreground">{r.date}</TableCell>
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
            Showing {rows.length} of {rows.length} files
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
