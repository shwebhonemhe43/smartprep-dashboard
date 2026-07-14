import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/subjects")({ component: Subjects });

type SubjectRow = {
  code: string;
  name: string;
  level: string;
  topics: number;
  resources: number;
};

const rows: SubjectRow[] = [
  { code: "CS4-101", name: "Computer Systems", level: "Level 4", topics: 12, resources: 8 },
  { code: "CS4-102", name: "Software Development", level: "Level 4", topics: 15, resources: 10 },
  { code: "CS4-103", name: "Databases", level: "Level 4", topics: 10, resources: 6 },
  { code: "CS4-104", name: "Networking Fundamentals", level: "Level 4", topics: 9, resources: 5 },
  { code: "CS4-105", name: "Web Design", level: "Level 4", topics: 11, resources: 7 },
];

function Subjects() {
  const [open, setOpen] = useState(false);

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-soft">
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
              <DialogDescription>
                Create a new NCC Level 4 subject.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-code">Subject Code</Label>
                <Input id="s-code" placeholder="e.g. CS4-106" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-name">Subject Name</Label>
                <Input id="s-name" placeholder="e.g. Operating Systems" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-level">Level</Label>
                <Select>
                  <SelectTrigger id="s-level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="l3">Level 3</SelectItem>
                    <SelectItem value="l4">Level 4</SelectItem>
                    <SelectItem value="l5">Level 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-desc">Description</Label>
                <Textarea id="s-desc" placeholder="Short description of the subject..." rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-px w-full bg-border/70" />

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardContent className="space-y-6 p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subject by code or name..."
              className="h-12 rounded-xl border-border/70 bg-background pl-11 text-sm"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">Subject Code</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Subject Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Level</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Topics</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Resources</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      No subjects available.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-sm">{r.code}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.level}</TableCell>
                      <TableCell>{r.topics}</TableCell>
                      <TableCell>{r.resources}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" aria-label="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
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
            Showing {rows.length} of {rows.length} subjects
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
