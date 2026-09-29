"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { submitApplication } from "@/lib/actions/admissions";
import { EDUCATION_LEVELS, NIGERIAN_STATES } from "@/lib/states";

export type ProgramOption = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  courses: { id: string; title: string; code: string }[];
};

export function ApplyForm({ program }: { program: ProgramOption }) {
  const [reference, setReference] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const courseId = program.courses[0]?.id ?? "";

  if (reference) {
    return (
      <div className="rounded-3xl border border-gold bg-paper p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Application received</p>
        <h2 className="mt-2 font-display text-4xl text-navy">Your reference is {reference}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-charcoal/80">
          The admissions office will review your application for {program.name}. If you are admitted, you will receive a KSEI student ID and a portal account.
          Keep this reference for any follow-up with info@ksei.org.ng.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => {
          void (async () => {
            const result = await submitApplication(data);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            setReference(result.reference);
            toast.success(result.message);
          })();
        });
      }}
    >
      <input type="hidden" name="programId" value={program.id} />
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </Field>
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required autoComplete="tel" placeholder="+234..." />
        </Field>
        <Field>
          <Label htmlFor="state">State of residence</Label>
          <Select id="state" name="state" required defaultValue="">
            <option value="" disabled>
              Select a state
            </option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        </Field>
        <Field>
          <Label htmlFor="educationLevel">Education</Label>
          <Select id="educationLevel" name="educationLevel" required defaultValue={EDUCATION_LEVELS[0]}>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </Select>
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="statement">Why do you want to study at KSEI?</Label>
          <Textarea id="statement" name="statement" required placeholder="A short paragraph is enough." />
        </Field>
        <Field>
          <Label htmlFor="photoId">Photo ID</Label>
          <Input id="photoId" name="photoId" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
        </Field>
        <Field>
          <Label htmlFor="document">Supporting document</Label>
          <Input id="document" name="document" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
        </Field>
        <Field className="md:col-span-2">
          <label className="flex items-start gap-3 text-sm leading-6 text-charcoal/80">
            <input className="mt-1" type="checkbox" name="commitment" value="yes" required />
            <span>
              I accept the trainee commitment for {program.name}. I will take part in morning devotion, classroom work, daily practicals, community service and, in the last five months, industrial attachment. I understand that a certificate depends on character and practical skill, not on attendance alone.
            </span>
          </label>
        </Field>
      </div>
      <Button disabled={pending} type="submit" variant="gold" size="lg">
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
