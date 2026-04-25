import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-accent-light active:scale-95 shadow-md shadow-accent/20",
        destructive:
          "bg-electric-red text-white hover:bg-red-500 shadow-md shadow-red-500/20",
        outline:
          "border border-surface-border bg-surface/80 text-foreground hover:border-accent/60 hover:text-foreground hover:bg-surface2",
        secondary:
          "bg-surface2 text-foreground hover:bg-surface border border-surface-border",
        ghost:
          "hover:bg-surface2 hover:text-accent-light text-foreground/85",
        link: "text-accent underline-offset-4 hover:underline",
        glow:
          "bg-accent text-white hover:bg-accent-light shadow-lg shadow-accent/25 active:scale-95",
        gradient:
          "bg-gradient-to-r from-accent via-violet-500 to-electric-red text-white font-bold hover:brightness-110 shadow-lg active:scale-95",
        accent:
          "bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 hover:border-accent/60 active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
