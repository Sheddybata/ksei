"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Label, Textarea } from "@/components/ui/input";
import { saveBusinessPlan } from "@/lib/actions/formation";

export function BusinessPlanForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          void (async () => {
            const result = await saveBusinessPlan(plan);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            toast.success(result.message);
            router.refresh();
          })();
        });
      }}
    >
      <Field>
        <Label htmlFor="businessPlan">Business or career plan</Label>
        <Textarea
          id="businessPlan"
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          placeholder="What work or small enterprise are you preparing for, and how will you handle money honestly?"
        />
      </Field>
      <Button disabled={pending} type="submit" variant="gold">
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}
