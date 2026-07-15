import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrandLogo } from "@/components/brand-logo";
import { User, Mail, Lock, Loader2, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { registerStudent } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";

const PROGRAM_LEVELS = {
  NCC: ["NCC Level 3", "NCC Level 4", "NCC Level 5"],
  HNC: ["Level 4"],
  HND: ["Level 5"],
} as const;
type Program = keyof typeof PROGRAM_LEVELS;

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — NCC SmartPrep" },
      { name: "description", content: "Create your NCC SmartPrep account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const registerFn = useServerFn(registerStudent);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    confirm: string;
    program: Program;
    level: string;
  }>({ name: "", email: "", password: "", confirm: "", program: "NCC", level: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    name: touched.name && form.name.trim().length < 2 ? "Enter your full name" : "",
    email: touched.email && !/^\S+@\S+\.\S+$/.test(form.email) ? "Enter a valid Outlook email" : "",
    password: touched.password && form.password.length < 6 ? "Min 6 characters" : "",
    confirm: touched.confirm && form.confirm !== form.password ? "Passwords don't match" : "",
    level: touched.level && !form.level ? "Select a level" : "",
  };

  const set = (k: "name" | "email" | "password" | "confirm") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const mutation = useMutation({
    mutationFn: async () => {
      await registerFn({
        data: {
          email: form.email.trim().toLowerCase(),
          full_name: form.name,
          password: form.password,
          program: form.program,
          level: form.level,
        },
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Account created. Waiting for admin approval.");
      navigate({ to: "/student" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canSubmit =
    form.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(form.email) &&
    form.password.length >= 6 &&
    form.confirm === form.password &&
    (PROGRAM_LEVELS[form.program] as readonly string[]).includes(form.level);

  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <Card className="border-border/60 shadow-elegant">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-display text-2xl">Create your account</CardTitle>
            <CardDescription>Register with your Outlook email to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setTouched({ name: true, email: true, password: true, confirm: true, level: true });
                if (canSubmit && !mutation.isPending) mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Outlook Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9" placeholder="2025d0001@student.strategyfirst.edu.mm" value={form.email} onChange={set("email")} onBlur={blur("email")} />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" className="pl-9" placeholder="Jane Doe" value={form.name} onChange={set("name")} onBlur={blur("name")} />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-9" placeholder="••••••••" value={form.password} onChange={set("password")} onBlur={blur("password")} />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm" type="password" className="pl-9" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} onBlur={blur("confirm")} />
                </div>
                {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
              </div>
              <Button type="submit" className="w-full shadow-soft" size="lg" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Register
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
