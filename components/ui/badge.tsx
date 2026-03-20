import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-gold/30 bg-gold/10 text-gold",
        secondary: "border-surface-border bg-surface2 text-white/70",
        destructive: "border-electric-red/30 bg-electric-red/10 text-electric-red",
        success: "border-electric-green/30 bg-electric-green/10 text-electric-green",
        outline: "border-surface-border text-white/70",
        cyan: "border-electric-cyan/30 bg-electric-cyan/10 text-electric-cyan",
        purple: "border-electric-purple/30 bg-electric-purple/10 text-electric-purple",
        pink: "border-electric-pink/30 bg-electric-pink/10 text-electric-pink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
