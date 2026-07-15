import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="shadow-soft">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
          className="grid h-10 w-10 place-items-center rounded-md md:hidden"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
