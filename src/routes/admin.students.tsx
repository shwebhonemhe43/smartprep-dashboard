import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/admin/students")({ component: Students });

type StudentRow = {
  id: string;
  name: string;
  email: string;
};

const rows: StudentRow[] = [];

function Students() {
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
        <Button size="lg" className="shadow-soft">
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
                  <TableHead className="py-3 text-right font-semibold text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-16 text-center text-muted-foreground"
                    >
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
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
            Showing {rows.length} of {rows.length} students
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
