import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "secondary" | "outline" | "subtle";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const badgeVariantStyles: Record<BadgeVariant, string> = {
  default: "bg-reader-accent text-reader-accent-fg shadow-xs",
  secondary: "bg-neutral-500/15 text-[var(--reader-text)]",
  outline: "border border-[var(--reader-border)] text-[var(--reader-text)]",
  subtle: "bg-reader-accent-subtle text-[var(--reader-text)] border border-[var(--reader-border)]",
};

export function badgeVariants({
  variant = "default",
  className = "",
}: {
  variant?: BadgeVariant;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
    badgeVariantStyles[variant],
    className
  );
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
