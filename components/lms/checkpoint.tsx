"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitQuiz } from "@/lib/actions/learning";
import { PASS_MARK } from "@/lib/path";

export type CheckpointQuiz = {
  id: string;
  title: string;
  instructions: string | null;
  questions: { id: string; prompt: string; options: string[] }[];
  submission: { percent: number; score: number; maxScore: number; feedback: string | null; passed: boolean } | null;
  open: boolean;
};

export function Checkpoint({ quiz }: { quiz: CheckpointQuiz }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(() => quiz.questions.map(() => -1));
  const [result, setResult] = useState(quiz.submission);
  const [retake, setRetake] = useState(false);
  const [pending, startTransition] = useTransition();
  const showResult = result?.passed || (result && !retake);

  if (!quiz.open) {
    return (
      <section id="checkpoint" className="mt-8 rounded-2xl border border-dashed border-navy/15 bg-ivory px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">Test</p>
        <h3 className="mt-1 font-display text-2xl text-navy">{quiz.title}</h3>
        <p className="mt-2 text-sm text-charcoal/70">Mark this module complete to open the test. The next module stays locked until you score at least {PASS_MARK}%.</p>
      </section>
    );
  }

  return (
    <section id="checkpoint" className="mt-8 border-t border-navy/10 pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">Test</p>
      <h3 className="mt-1 font-display text-3xl text-navy">{quiz.title}</h3>
      <p className="mt-2 text-sm leading-6 text-charcoal/70">{quiz.instructions ?? `Score at least ${PASS_MARK}% to unlock the next module.`}</p>

      {showResult && result ? (
        <div className="mt-4 rounded-2xl bg-ivory p-4">
          <p className="font-display text-4xl text-navy">{result.percent}%</p>
          <p className="text-sm text-charcoal/70">
            {result.score} of {result.maxScore} points
          </p>
          {result.feedback ? <p className="mt-3 text-sm leading-6 text-charcoal">{result.feedback}</p> : null}
          {!result.passed ? (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {
                setRetake(true);
                setAnswers(quiz.questions.map(() => -1));
              }}
            >
              Try again
            </Button>
          ) : null}
        </div>
      ) : (
        <form
          className="mt-5 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (answers.some((answer) => answer < 0)) {
              toast.error("Answer every question before submitting.");
              return;
            }
            startTransition(() => {
              void (async () => {
                const response = await submitQuiz(quiz.id, answers);
                if (!response.ok) {
                  toast.error(response.message);
                  return;
                }
                setResult({
                  percent: response.percent,
                  feedback: response.feedback,
                  score: response.score,
                  maxScore: response.maxScore,
                  passed: response.passed,
                });
                setRetake(false);
                toast.success(response.passed ? "Test passed." : "Test submitted.");
                router.refresh();
              })();
            });
          }}
        >
          {result && !result.passed ? (
            <p className="rounded-2xl bg-ivory px-4 py-3 text-sm text-charcoal">
              Last score {result.percent}%. You need {PASS_MARK}% to continue.
            </p>
          ) : null}
          {quiz.questions.map((question, index) => (
            <fieldset key={question.id}>
              <legend className="font-semibold text-navy">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-2 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={`${question.id}-${optionIndex}`} className="flex cursor-pointer items-start gap-2 rounded-xl border border-navy/10 px-3 py-3 text-sm">
                    <input
                      className="mt-1 shrink-0"
                      type="radio"
                      name={question.id}
                      checked={answers[index] === optionIndex}
                      onChange={() => setAnswers((current) => current.map((value, valueIndex) => (valueIndex === index ? optionIndex : value)))}
                    />
                    <span className="min-w-0">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <Button disabled={pending} type="submit">
            {pending ? "Marking…" : "Submit test"}
          </Button>
        </form>
      )}
    </section>
  );
}
