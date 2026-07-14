import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/records")({ component: StudentRecords });

type StudentRecord = {
  id: string;
  name: string;
  subjectsProgress: string;
  subjectsCompleted: number;
  subjectsTotal: number;
  quizAverage: number;
  learningProgress: number;
  lastActivity: string;
};

const records: StudentRecord[] = [
  {
    id: "NCC001",
    name: "Aung Aung",
    subjectsProgress: "3 / 5 Subjects",
    subjectsCompleted: 3,
    subjectsTotal: 5,
    quizAverage: 78,
    learningProgress: 65,
    lastActivity: "Today",
  },
  {
    id: "NCC002",
    name: "Su Su",
    subjectsProgress: "5 / 5 Subjects",
    subjectsCompleted: 5,
    subjectsTotal: 5,
    quizAverage: 92,
    learningProgress: 90,
    lastActivity: "Yesterday",
  },
];

function StudentRecords() {
  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const [open, setOpen] = useState(false);

  const handleView = (record: StudentRecord) => {
    setSelected(record);
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Student Records
        </h1>
        <p className="mt-2 text-muted-foreground">
          View student learning progress and academic activity.
        </p>
      </div>

      <div className="h-px w-full bg-border/70" />

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardContent className="space-y-6 p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search student by name or student ID..."
              className="h-12 rounded-xl border-border/70 bg-background pl-11 text-sm"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="py-3 font-semibold text-foreground">Student ID</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Student Name</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Subjects Progress</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Quiz Average</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Learning Progress</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Last Activity</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="py-16 text-center text-muted-foreground"
                    >
                      No student records available.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">{record.id}</TableCell>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{record.subjectsProgress}</TableCell>
                      <TableCell>{record.quizAverage}%</TableCell>
                      <TableCell>
                        <div className="flex w-32 items-center gap-2">
                          <Progress value={record.learningProgress} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{record.learningProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.lastActivity}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleView(record)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {records.length} of {records.length} students
          </p>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Student Details</SheetTitle>
            <SheetDescription>Learning progress overview for the selected student.</SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="mt-8 space-y-8">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Student Name</p>
                <p className="font-display text-2xl font-bold">{selected.name}</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-mono text-lg font-semibold">{selected.id}</p>
                </div>

                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-lg font-semibold">{selected.learningProgress}%</p>
                  <Progress value={selected.learningProgress} className="h-2" />
                </div>

                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Completed Subjects</p>
                  <p className="text-lg font-semibold">{selected.subjectsProgress}</p>
                </div>

                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Recent Quiz Score</p>
                  <p className="text-lg font-semibold">{selected.quizAverage}%</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
