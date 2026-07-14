import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  FileText,
  Layers,
  ListChecks,
  TrendingUp,
  ArrowRight,
  Sparkles,
  UserPlus,
  CalendarDays,
  Compass,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero-illustration.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: CalendarDays, title: "Personalized Study Plans", desc: "Generate study schedules based on exam dates, available hours, and learning strengths." },
  { icon: Brain, title: "AI Priority Analysis", desc: "Identify important topics using uploaded learning resources and past papers." },
  { icon: FileText, title: "Smart Notes", desc: "Generate concise, personalized revision notes tailored to every student." },
  { icon: Layers, title: "Flashcards", desc: "Review key concepts with AI-generated flashcards that adapt to you." },
  { icon: ListChecks, title: "Practice Quizzes", desc: "Test your understanding with topic-based quizzes and short questions." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Monitor your learning progress and stay on track for your exams." },
];

const steps = [
  { icon: UserPlus, title: "Create your profile", desc: "Sign up and tell us about your course and modules." },
  { icon: CalendarDays, title: "Set exam date & preferences", desc: "Add your exam schedule and study hours per week." },
  { icon: Compass, title: "Receive your study plan", desc: "Get a personalized plan built around your goals." },
  { icon: Trophy, title: "Learn, practice, track", desc: "Study, take quizzes, and track progress to exam day." },
];

const stats = [
  { label: "Personalized Learning", value: "1:1" },
  { label: "AI Study Planning", value: "24/7" },
  { label: "Progress Tracking", value: "Live" },
  { label: "Built for NCC L4 Computing", value: "100%" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section id="home" className="bg-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
          <div className="animate-fade-in space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered study companion
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Study Smarter. <br />
              <span className="text-gradient">Not Harder.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              AI-powered personalized study plans designed specifically for NCC Computing students.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/register">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Learn More</a>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Curriculum aligned</div>
              <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Adaptive learning</div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-primary/20 via-primary-glow/10 to-transparent blur-3xl" />
            <div className="relative rounded-[2rem] border border-border/60 bg-card/60 p-6 shadow-elegant backdrop-blur">
              <img
                src={heroImg}
                alt="Illustration of AI-powered studying"
                width={520}
                height={520}
                className="h-auto w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything you need to ace your exams</h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built features that turn study time into progress.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="group border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
              >
                <CardContent className="p-6">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/20 text-primary transition-transform group-hover:scale-110">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Four simple steps from signup to exam success.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <Card className="h-full border-border/60 transition-all hover:shadow-soft">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                        <s.icon className="h-5 w-5" />
                      </span>
                      <span className="font-display text-3xl font-bold text-primary/20">
                        0{i + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Why choose NCC SmartPrep?</h2>
            <p className="mt-4 text-muted-foreground">
              Built for the way NCC Computing students actually study.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="border-border/60 text-center transition-all hover:-translate-y-1 hover:shadow-soft">
                <CardContent className="p-8">
                  <div className="font-display text-4xl font-extrabold text-gradient">{s.value}</div>
                  <div className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-10 text-center text-primary-foreground shadow-elegant sm:p-14">
            <h3 className="font-display text-3xl font-bold sm:text-4xl">Ready to study smarter?</h3>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Join NCC SmartPrep and get your first personalized study plan today.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
