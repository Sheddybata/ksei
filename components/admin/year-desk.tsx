"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { addStudentProgramme } from "@/lib/actions/admissions";
import { decideCertificate, saveAlumni, savePlacement, saveWeeklyReview } from "@/lib/actions/formation";
import { alumniOutcomes, scoreFields } from "@/lib/formation";

function run(action: () => Promise<{ ok: boolean; message: string }>, refresh: () => void, pendingStart: (callback: () => void) => void) {
  pendingStart(() => {
    void (async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      refresh();
    })();
  });
}

export function AddProgrammeForm({
  studentId,
  options,
}: {
  studentId: string;
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!options.length) {
    return <p className="text-sm text-charcoal/70">Every programme is already on this record.</p>;
  }

  return (
    <form
      className="flex flex-col gap-3 md:flex-row md:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const courseId = String(new FormData(event.currentTarget).get("courseId") || "");
        run(() => addStudentProgramme(studentId, courseId), () => router.refresh(), startTransition);
      }}
    >
      <Field className="flex-1">
        <Label htmlFor="courseId">Programme</Label>
        <Select id="courseId" name="courseId" defaultValue={options[0]?.id}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Button disabled={pending} type="submit">
        Add programme
      </Button>
    </form>
  );
}

export function WeeklyReviewForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        run(() => saveWeeklyReview(data), () => router.refresh(), startTransition);
      }}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <Field>
        <Label htmlFor="weekNumber">Week number</Label>
        <Input id="weekNumber" name="weekNumber" type="number" min={1} max={52} required defaultValue={1} />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        {scoreFields.map(([key, label]) => (
          <Field key={key}>
            <Label htmlFor={key}>{label} (0–5)</Label>
            <Input id={key} name={key} type="number" min={0} max={5} required defaultValue={0} />
          </Field>
        ))}
      </div>
      <Field>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" placeholder="What should this trainee correct this week?" />
      </Field>
      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save weekly review"}
      </Button>
    </form>
  );
}

export function PlacementForm({
  studentId,
  academyMonth,
  organisation,
  supervisorName,
  mentorNote,
}: {
  studentId: string;
  academyMonth: number;
  organisation: string;
  supervisorName: string;
  mentorNote: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        run(() => savePlacement(data), () => router.refresh(), startTransition);
      }}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="academyMonth">Academy month</Label>
          <Input id="academyMonth" name="academyMonth" type="number" min={1} max={12} required defaultValue={academyMonth} />
        </Field>
        <Field>
          <Label htmlFor="organisation">Workplace</Label>
          <Input id="organisation" name="organisation" defaultValue={organisation} placeholder="Host organisation, from month 8" />
        </Field>
        <Field>
          <Label htmlFor="supervisorName">Host supervisor</Label>
          <Input id="supervisorName" name="supervisorName" defaultValue={supervisorName} />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="mentorNote">Mentor note</Label>
          <Textarea id="mentorNote" name="mentorNote" defaultValue={mentorNote} />
        </Field>
      </div>
      <Button disabled={pending} type="submit" variant="gold">
        {pending ? "Saving…" : "Save month and placement"}
      </Button>
    </form>
  );
}

export function CertificateActions({ studentId, status }: { studentId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      <Button disabled={pending} type="button" onClick={() => run(() => decideCertificate(studentId, "CLEARED"), () => router.refresh(), startTransition)}>
        Clear for certificate
      </Button>
      <Button disabled={pending} type="button" variant="outline" onClick={() => run(() => decideCertificate(studentId, "WITHHELD"), () => router.refresh(), startTransition)}>
        Withhold
      </Button>
      {status === "WITHHELD" ? (
        <Button disabled={pending} type="button" variant="ghost" onClick={() => run(() => decideCertificate(studentId, "NOT_READY"), () => router.refresh(), startTransition)}>
          Lift the hold
        </Button>
      ) : null}
    </div>
  );
}

export function AlumniForm({ studentId, outcome, note }: { studentId: string; outcome: string; note: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        run(() => saveAlumni(data), () => router.refresh(), startTransition);
      }}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <Field>
        <Label htmlFor="alumniOutcome">After graduation</Label>
        <Select id="alumniOutcome" name="alumniOutcome" defaultValue={outcome || "Not yet known"}>
          {alumniOutcomes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="alumniNote">Follow-up note</Label>
        <Textarea id="alumniNote" name="alumniNote" defaultValue={note} placeholder="Employment, enterprise, study, ministry, service, or mentoring." />
      </Field>
      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save alumni follow-up"}
      </Button>
    </form>
  );
}
