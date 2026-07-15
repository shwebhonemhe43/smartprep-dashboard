import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/gtd-logo.png.asset.json";

const sizeClasses = {
  sm: "h-9",
  md: "h-11",
  lg: "h-16",
};

export function BrandLogo({
  className,
  to = "/",
  size = "md",
  variant = "default",
}: {
  className?: string;
  to?: string;
  size?: keyof typeof sizeClasses;
  variant?: "default" | "on-dark";
}) {
  return (
    <Link to={to} className={cn("inline-flex items-center group", className)}>
      <img
        src={logoAsset.url}
        alt="Grab That Distinction"
        className={cn(
          "w-auto rounded-lg transition-transform group-hover:scale-[1.02]",
          variant === "default" && "dark:bg-white/95 dark:p-1 dark:shadow-sm",
          variant === "on-dark" && "bg-white/95 p-1 shadow-sm",
          sizeClasses[size]
        )}
      />
    </Link>
  );
}
