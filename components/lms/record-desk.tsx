"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { addJournalEntry } from "@/lib/actions/formation";
import { journalKinds } from "@/lib/formation";

export function JournalForm({ attachmentOpen }: { attachmentOpen: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const kinds = journalKinds.filter(([kind]) => kind !== "ATTACHMENT" || attachmentOpen);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        startTransition(() => {
          void (async () => {
            const result = await addJournalEntry(data);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            toast.success(result.message);
            form.reset();
            router.refresh();
          })();
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor="kind">Kind of entry</Label>
          <Select id="kind" name="kind" defaultValue={kinds[0][0]}>
            {kinds.map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="happenedOn">Date</Label>
          <Input id="happenedOn" name="happenedOn" type="date" required />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="What happened" />
        </Field>
        <Field className="md:col-span-2">
          <Label htmlFor="body">What you did, learnt, or served</Label>
          <Textarea id="body" name="body" required />
        </Field>
      </div>
      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Add to my record"}
      </Button>
    </form>
  );
}
