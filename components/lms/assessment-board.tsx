"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitQuiz } from "@/lib/actions/learning";
import { formatDate } from "@/lib/format";

export type QuizCard = {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string | null;
  instructions: string | null;
  questions: { id: string; prompt: string; options: string[]; points: number }[];
  submission: { score: number; maxScore: number; percent: number; feedback: string | null } | null;
};

export function AssessmentBoard({ quizzes }: { quizzes: QuizCard[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ percent: number; feedback: string; score: number; maxScore: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const active = quizzes.find((quiz) => quiz.id === openId) ?? null;

  function openQuiz(quiz: QuizCard) {
    setOpenId(quiz.id);
    setAnswers(quiz.questions.map(() => -1));
    setResult(quiz.submission ? { ...quiz.submission, feedback: quiz.submission.feedback ?? "" } : null);
  }

  return (
    <div className="grid gap-4">
      {quizzes.length === 0 ? <p className="text-sm text-charcoal/70">No quizzes are open on your courses yet.</p> : null}
      {quizzes.map((quiz) => (
        <article key={quiz.id} className="rounded-3xl border border-navy/10 bg-paper p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{quiz.courseTitle}</p>
              <h2 className="mt-1 font-display text-3xl text-navy">{quiz.title}</h2>
              <p className="mt-1 text-sm text-charcoal/70">{quiz.dueDate ? `Due ${formatDate(quiz.dueDate)}` : "Open"}</p>
            </div>
            {quiz.submission ? <Badge tone="teal">{quiz.submission.percent}%</Badge> : <Badge tone="gold">Not taken</Badge>}
          </div>
          {quiz.submission?.feedback ? <p className="mt-3 text-sm leading-6 text-charcoal">{quiz.submission.feedback}</p> : null}
          <Button className="mt-4" variant={quiz.submission ? "outline" : "default"} onClick={() => openQuiz(quiz)}>
            {quiz.submission ? "View result" : "Take quiz"}
          </Button>
        </article>
      ))}

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent>
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>{active.instructions ?? "Choose the strongest answer for each question."}</DialogDescription>
              </DialogHeader>
              {result ? (
                <div className="rounded-2xl bg-ivory p-4">
                  <p className="font-display text-4xl text-navy">{result.percent}%</p>
                  <p className="text-sm text-charcoal/70">
                    {result.score} of {result.maxScore} points
                  </p>
                  <p className="mt-3 text-sm leading-6">{result.feedback}</p>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (answers.some((answer) => answer < 0)) {
                      toast.error("Answer every question before submitting.");
                      return;
                    }
                    startTransition(() => {
                      void (async () => {
                        const response = await submitQuiz(active.id, answers);
                        if (!response.ok) {
                          toast.error(response.message);
                          return;
                        }
                        setResult({
                          percent: response.percent,
                          feedback: response.feedback,
                          score: response.score,
                          maxScore: response.maxScore,
                        });
                        toast.success("Quiz submitted.");
                        router.refresh();
                      })();
                    });
                  }}
                >
                  {active.questions.map((question, index) => (
                    <fieldset key={question.id}>
                      <legend className="font-semibold text-navy">
                        {index + 1}. {question.prompt}
                      </legend>
                      <div className="mt-2 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={option} className="flex cursor-pointer gap-2 rounded-xl border border-navy/10 px-3 py-2 text-sm">
                            <input
                              type="radio"
                              name={question.id}
                              checked={answers[index] === optionIndex}
                              onChange={() =>
                                setAnswers((current) => current.map((value, valueIndex) => (valueIndex === index ? optionIndex : value)))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <Button disabled={pending} type="submit">
                    {pending ? "Marking…" : "Submit quiz"}
                  </Button>
                </form>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
