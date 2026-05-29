import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151517] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black shadow-[0_10px_24px_rgba(0,0,0,0.16)] hover:bg-fuchsia-50 active:scale-[0.99]",
        secondary:
          "border border-white/10 bg-white/[0.045] text-white backdrop-blur-xl hover:border-white/14 hover:bg-white/[0.065] active:scale-[0.99]",
        ghost: "text-white/72 hover:bg-white/[0.055] hover:text-white active:scale-[0.99]",
        danger: "border border-red-400/24 bg-red-500/8 text-red-200 hover:bg-red-500/12",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { buttonVariants };
