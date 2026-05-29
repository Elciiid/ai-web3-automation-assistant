import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] outline-none backdrop-blur-xl transition placeholder:text-white/34 hover:border-white/16 hover:bg-white/[0.06] focus:border-fuchsia-200/50 focus:bg-white/[0.072] focus:ring-4 focus:ring-fuchsia-300/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-none rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] outline-none backdrop-blur-xl transition placeholder:text-white/34 hover:border-white/16 hover:bg-white/[0.06] focus:border-fuchsia-200/50 focus:bg-white/[0.072] focus:ring-4 focus:ring-fuchsia-300/10 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
