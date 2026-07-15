import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/gtd-logo.png.asset.json";

export function BrandLogo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center group", className)}>
      <img
        src={logoAsset.url}
        alt="Grab That Distinction"
        className="h-9 w-auto rounded-md bg-white/95 p-1 shadow-sm transition-transform group-hover:scale-[1.02] dark:bg-white/95"
      />
    </Link>
  );
}
