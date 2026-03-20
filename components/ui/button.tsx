import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gold text-background hover:bg-gold-light active:scale-95 shadow-lg shadow-gold/20",
        destructive:
          "bg-electric-red text-white hover:bg-red-400 shadow-lg shadow-red-500/20",
        outline:
          "border border-surface-border bg-transparent text-white hover:border-gold hover:text-gold hover:bg-gold/5",
        secondary:
          "bg-surface2 text-white hover:bg-surface-border border border-surface-border",
        ghost:
          "hover:bg-surface2 hover:text-gold text-white/80",
        link: "text-gold underline-offset-4 hover:underline",
        glow:
          "bg-gold text-background hover:bg-gold-light shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] active:scale-95",
        gradient:
          "bg-gradient-to-r from-gold via-orange-400 to-electric-red text-black font-bold hover:brightness-110 shadow-lg active:scale-95",
        gold:
          "bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 hover:border-gold/60 active:scale-95",
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
