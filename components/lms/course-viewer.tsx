"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Checkpoint, type CheckpointQuiz } from "@/components/lms/checkpoint";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { markModuleComplete, submitAssignment } from "@/lib/actions/learning";
import { cn } from "@/lib/utils";

export type LessonModule = {
  id: string;
  order: number;
  title: string;
  type: "VIDEO" | "READING";
  content: string;
  videoUrl: string | null;
  resourceUrl: string | null;
  completed: boolean;
  unlocked: boolean;
  lockReason: string | null;
  stepDone: boolean;
};

export type LessonAssignment = {
  id: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  submitted: boolean;
  feedback: string | null;
};

export type LessonCheckpoint = CheckpointQuiz & { moduleId: string };

const labels = new Set(["Teaching focus", "Scripture", "Practice", "Character", "Key focus", "Workshop checks"]);

function LessonBlock({ text }: { text: string }) {
  const week = text.match(/^Week (\d+)\. (.+)$/);
  if (week && !text.includes("\n")) {
    return (
      <h3 className="font-display text-2xl text-navy">
        Week {week[1]}. {week[2]}
      </h3>
    );
  }
  const [label, ...rest] = text.split("\n");
  if (labels.has(label) && rest.length) {
    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">{label}</p>
        <p className="mt-2 whitespace-pre-line leading-7">{rest.join("\n")}</p>
      </div>
    );
  }
  return <p className="whitespace-pre-line leading-7">{text}</p>;
}

export function CourseViewer({
  modules,
  assignments,
  checkpoints,
  progress,
  initialModuleId,
}: {
  modules: LessonModule[];
  assignments: LessonAssignment[];
  checkpoints: LessonCheckpoint[];
  progress: number;
  initialModuleId?: string;
}) {
  const router = useRouter();
  const fallback = modules.find((module) => module.unlocked && !module.stepDone)?.id ?? modules.find((module) => module.unlocked)?.id ?? modules[0]?.id ?? "";
  const [activeId, setActiveId] = useState(modules.some((module) => module.id === initialModuleId) ? initialModuleId ?? fallback : fallback);
  const [essay, setEssay] = useState("");
  const [pending, startTransition] = useTransition();
  const active = modules.find((module) => module.id === activeId) ?? modules[0];

  if (!active) {
    return <p className="text-sm text-charcoal/70">This course does not have modules yet.</p>;
  }

  const quiz = checkpoints.find((item) => item.moduleId === active.id) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ivory-deep">
          <div className="h-full rounded-full bg-teal" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-charcoal/55">{progress}% of this course</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
        <div className="nav-scroll sticky top-[7.25rem] z-30 -mx-4 flex gap-2 overflow-x-auto bg-ivory/95 px-4 py-2 backdrop-blur lg:hidden">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              disabled={!module.unlocked}
              onClick={() => setActiveId(module.id)}
              aria-label={`Module ${module.order}. ${module.title}${module.unlocked ? "" : ". Locked"}`}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                module.id === active.id ? "bg-navy text-ivory" : "bg-paper text-navy",
                !module.unlocked && "cursor-not-allowed opacity-50",
              )}
            >
              {module.stepDone ? <Check className="h-4 w-4" /> : module.unlocked ? module.order : <Lock className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
        <aside className="hidden space-y-2 lg:block">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              disabled={!module.unlocked}
              onClick={() => setActiveId(module.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left text-sm",
                module.id === active.id ? "bg-navy text-ivory" : "bg-paper text-navy",
                !module.unlocked && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
                {module.unlocked ? module.order : <Lock className="h-3.5 w-3.5" />}
              </span>
              <span>
                <span className="block font-semibold">{module.title}</span>
                <span className="mt-1 block text-xs opacity-70">
                  {module.stepDone ? "Complete" : module.lockReason ?? (module.completed ? "Test open" : "Open")}
                </span>
              </span>
            </button>
          ))}
        </aside>
        <article className="min-w-0 rounded-3xl border border-navy/10 bg-paper p-4 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">Module {active.order}</p>
          <h2 className="mt-2 font-display text-3xl text-navy sm:text-4xl">{active.title}</h2>
          {!active.unlocked ? (
            <div className="mt-6 rounded-2xl bg-ivory p-5">
              <p className="font-semibold text-navy">This module is locked</p>
              <p className="mt-2 text-sm leading-6 text-charcoal/70">{active.lockReason}</p>
            </div>
          ) : (
            <>
              {active.type === "VIDEO" ? (
                <div className="mt-5 overflow-hidden rounded-2xl bg-navy">
                  {active.videoUrl ? (
                    active.videoUrl.includes("youtube") || active.videoUrl.includes("vimeo") ? (
                      <iframe title={active.title} src={active.videoUrl} className="aspect-video w-full" allowFullScreen />
                    ) : (
                      <video className="aspect-video w-full" controls src={active.videoUrl} />
                    )
                  ) : (
                    <div className="flex aspect-video items-end bg-gradient-to-br from-navy to-teal p-6 text-ivory">
                      <p className="max-w-md text-sm leading-6">This seminar is facilitated in residence. The briefing below is the lesson record.</p>
                    </div>
                  )}
                </div>
              ) : null}
              <div className="mt-6 space-y-5 text-sm text-charcoal">
                {active.content.split("\n\n").map((paragraph) => (
                  <LessonBlock key={paragraph.slice(0, 48)} text={paragraph} />
                ))}
              </div>
              {active.resourceUrl ? (
                <a className="mt-4 inline-flex text-sm font-semibold text-teal-deep underline" href={active.resourceUrl}>
                  Download the departmental module
                </a>
              ) : null}
              <div className="mt-6">
                <Button
                  disabled={pending || active.completed}
                  onClick={() =>
                    startTransition(() => {
                      void (async () => {
                        const result = await markModuleComplete(active.id);
                        if (!result.ok) {
                          toast.error(result.message);
                          return;
                        }
                        toast.success(result.message);
                        router.refresh();
                      })();
                    })
                  }
                >
                  {active.completed ? "Module complete" : "Mark module complete"}
                </Button>
              </div>
              {quiz ? <Checkpoint quiz={quiz} /> : null}
            </>
          )}
          {assignments.length && active.unlocked ? (
            <section className="mt-8 border-t border-navy/10 pt-6">
              <h3 className="font-display text-2xl text-navy">Written work</h3>
              <div className="mt-4 space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl bg-ivory p-4">
                    <p className="font-semibold text-navy">{assignment.title}</p>
                    {assignment.instructions ? <p className="mt-1 text-sm text-charcoal/70">{assignment.instructions}</p> : null}
                    {assignment.submitted ? (
                      <p className="mt-3 text-sm text-teal-deep">{assignment.feedback ?? "Submitted."}</p>
                    ) : (
                      <form
                        className="mt-3 space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          startTransition(() => {
                            void (async () => {
                              const result = await submitAssignment(assignment.id, essay);
                              if (!result.ok) {
                                toast.error(result.message);
                                return;
                              }
                              toast.success(result.message);
                              setEssay("");
                              router.refresh();
                            })();
                          });
                        }}
                      >
                        <Textarea value={essay} onChange={(event) => setEssay(event.target.value)} placeholder="Write your response" />
                        <Button disabled={pending} type="submit" variant="teal">
                          Submit assignment
                        </Button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </div>
  );
}
