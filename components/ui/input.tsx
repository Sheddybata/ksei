import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-base text-charcoal shadow-sm placeholder:text-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-sm",
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
        "flex min-h-32 w-full rounded-xl border border-navy/15 bg-white px-3 py-3 text-base leading-6 text-charcoal shadow-sm placeholder:text-charcoal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-navy/15 bg-white px-3 text-base text-charcoal shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-semibold text-navy", className)} {...props} />;
}

export function Field({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}
