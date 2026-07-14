import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/students")({ component: Students });

const rows = [
  { name: "Sarah Khan", email: "sarah@ncc.edu", plan: "Active", progress: "82%" },
  { name: "James Patel", email: "james@ncc.edu", plan: "Active", progress: "64%" },
  { name: "Aisha Bello", email: "aisha@ncc.edu", plan: "Pending", progress: "12%" },
  { name: "David Lee", email: "david@ncc.edu", plan: "Active", progress: "47%" },
];

function Students() {
  return (
    <div className="space-y-6">
      <PagePlaceholder title="Student Management" description="View, edit and manage NCC Computing students enrolled in SmartPrep." />
      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.email}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell>
                    <Badge variant={r.plan === "Active" ? "default" : "secondary"}>{r.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{r.progress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
