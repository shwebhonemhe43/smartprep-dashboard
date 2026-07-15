import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/gtd-brain-logo.png.asset.json";

const sizeClasses = {
  sm: "h-9",
  md: "h-11",
  lg: "h-16",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export function BrandLogo({
  className,
  to = "/",
  size = "md",
  variant = "default",
  showText = true,
}: {
  className?: string;
  to?: string;
  size?: keyof typeof sizeClasses;
  variant?: "default" | "on-dark";
  showText?: boolean;
}) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2 group", className)}>
      <img
        src={logoAsset.url}
        alt="Grab That Distinction"
        className={cn(
          "w-auto object-contain transition-transform group-hover:scale-[1.02]",
          sizeClasses[size]
        )}
      />
      {showText && (
        <span
          className={cn(
            "font-display font-bold tracking-tight whitespace-nowrap text-foreground",
            textSizeClasses[size],
            variant === "on-dark" && "dark:text-white"
          )}
        >
          Grab That Distinction
        </span>
      )}
    </Link>
  );
}
