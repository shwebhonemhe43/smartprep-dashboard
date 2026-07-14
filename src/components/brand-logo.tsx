import { GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 group", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        NCC <span className="text-gradient">SmartPrep</span>
      </span>
    </Link>
  );
}
