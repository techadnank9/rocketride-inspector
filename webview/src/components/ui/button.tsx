import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
}

const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-ocean text-white hover:bg-cyan-600",
  secondary:
    "bg-white/10 text-white hover:bg-white/15",
  ghost:
    "bg-transparent text-slate-200 hover:bg-white/10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
