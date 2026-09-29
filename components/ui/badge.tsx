import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-navy/10 text-navy",
  gold: "bg-[#F3E7C3] text-gold-deep",
  teal: "bg-teal-soft text-teal-deep",
  danger: "bg-red-50 text-red-800",
  neutral: "bg-ivory-deep text-charcoal/80",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function statusTone(status: string) {
  if (status === "APPROVED" || status === "ACTIVE") return "teal" as const;
  if (status === "PENDING") return "gold" as const;
  if (status === "REJECTED" || status === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}
