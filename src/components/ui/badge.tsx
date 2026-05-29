import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
  {
    variants: {
      tone: {
        default: "border-white/10 bg-white/[0.06] text-white/76",
        green: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
        yellow: "border-yellow-300/24 bg-yellow-300/10 text-yellow-100",
        red: "border-red-300/24 bg-red-300/10 text-red-100",
        pink: "border-fuchsia-300/24 bg-fuchsia-300/10 text-fuchsia-100",
        blue: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))} {...props} />;
}
