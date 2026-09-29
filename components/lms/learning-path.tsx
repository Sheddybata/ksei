import Link from "next/link";
import { Check, Lock } from "lucide-react";
import type { PathStep } from "@/lib/path";
import { cn } from "@/lib/utils";

function blurb(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 217).trim()}…`;
}

export function LearningPath({
  courseId,
  title,
  summary,
  progress,
  steps,
  added = false,
}: {
  courseId: string;
  title: string;
  summary: string;
  progress: number;
  steps: PathStep[];
  added?: boolean;
}) {
  const done = steps.filter((step) => step.stepDone).length;
  const current = steps.find((step) => step.unlocked && !step.stepDone) ?? steps.find((step) => step.unlocked);

  return (
    <section className="rounded-3xl border border-navy/10 bg-paper p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{added ? "Added programme" : "Your course"}</p>
          <h2 className="mt-1 font-display text-3xl leading-tight text-navy sm:text-4xl">{title}</h2>
        </div>
        {current ? (
          <Link href={`/dashboard/courses/${courseId}?module=${current.id}`} className="text-sm font-semibold text-teal-deep">
            {current.completed && current.gate && !current.gate.passed ? "Take the test" : current.stepDone ? "Review" : "Continue"}
          </Link>
        ) : null}
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/70">{blurb(summary)}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ivory-deep" aria-hidden>
        <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-charcoal/55">
        {progress}% · {done} of {steps.length} modules
      </p>

      <ol className="mt-6 space-y-2">
        {steps.map((step) => {
          const needsTest = step.completed && step.gate && !step.gate.passed;
          const href = `/dashboard/courses/${courseId}?module=${step.id}${needsTest ? "#checkpoint" : ""}`;
          const status = step.stepDone
            ? "Complete"
            : step.lockReason ?? (needsTest ? "Pass the test to continue" : "Continue");
          const inner = (
            <>
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.stepDone ? "bg-teal text-white" : step.unlocked ? "bg-navy text-ivory" : "bg-ivory-deep text-navy/35",
                )}
              >
                {step.stepDone ? <Check className="h-4 w-4" /> : step.unlocked ? step.order : <Lock className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">Module {step.order}</span>
                  {step.gate?.passed ? (
                    <span className="text-[11px] font-semibold text-teal-deep">{step.gate.percent}%</span>
                  ) : null}
                </span>
                <span className={cn("mt-0.5 block font-semibold", step.unlocked ? "text-navy" : "text-navy/45")}>{step.title}</span>
                <span className="mt-1 block text-sm text-charcoal/60">{status}</span>
                {step.gate && step.unlocked ? (
                  <span className="mt-2 block text-xs font-semibold text-charcoal/55">
                    {step.gate.passed
                      ? "Test passed"
                      : step.gate.open
                        ? "Test open"
                        : "Test stays locked until this module is finished"}
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={step.id}>
              {step.unlocked ? (
                <Link href={href} className="flex gap-3 rounded-2xl border border-navy/10 px-3 py-3 hover:border-teal/50">
                  {inner}
                </Link>
              ) : (
                <div className="flex gap-3 rounded-2xl border border-dashed border-navy/15 px-3 py-3">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
