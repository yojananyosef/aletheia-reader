import * as React from "react"
import { cn } from "@/lib/utils"

export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "subtle"
  | "accent";

export type ButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "icon"
  | "icon-sm"
  | "icon-lg"
  | "pill";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-reader-accent text-reader-accent-fg shadow-sm hover:opacity-95",
  outline: "border border-[var(--reader-border)] bg-transparent hover:bg-neutral-500/10",
  secondary: "bg-neutral-500/10 text-[var(--reader-text)] hover:bg-neutral-500/15 border border-transparent",
  ghost: "hover:bg-neutral-500/10 text-[var(--reader-text)]",
  subtle: "bg-[var(--reader-hover)] text-[var(--reader-text)] border border-[var(--reader-border)] hover:opacity-90",
  accent: "bg-reader-accent text-reader-accent-fg font-bold shadow-md hover:brightness-105",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "min-h-[40px] px-3.5 py-2 aaa-target",
  sm: "min-h-[36px] px-2.5 py-1 text-xs aaa-target",
  lg: "min-h-[48px] px-6 py-2.5 text-base font-semibold",
  icon: "h-10 w-10 min-w-[40px] p-0 rounded-xl aaa-target",
  "icon-sm": "h-9 w-9 min-w-[36px] p-0 rounded-lg aaa-target",
  "icon-lg": "h-11 w-11 min-w-[44px] p-0 rounded-xl",
  pill: "min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold aaa-target",
};

export function buttonVariants({
  variant = "outline",
  size = "default",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.98]",
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "outline", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
