import type { Metadata } from "next";
import { JournalForm } from "@/components/lms/record-desk";
import { journalKinds } from "@/lib/formation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "My record" };

const labels = Object.fromEntries(journalKinds);

export default async function RecordPage() {
  const session = await getSession();
  if (!session) return null;
  const student = await prisma.student.findUnique({
    where: { userId: session.sub },
    include: { record: true, journal: { orderBy: { happenedOn: "desc" } } },
  });
  if (!student) return null;
  const month = student.record?.academyMonth ?? 1;
  const attachmentOpen = month >= 8;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Portfolio and logbook</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">My record</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/75">
          Graduation looks at evidence, not only lessons read. Keep the logbook, practical work and community service here.
          {attachmentOpen
            ? ` You are in month ${month}. File a workplace report for ${student.record?.organisation || "your placement"}.`
            : ` Workplace reports open in month 8. You are in month ${month}.`}
        </p>
      </header>
      {attachmentOpen ? (
        <p className="rounded-3xl bg-navy px-5 py-4 text-sm leading-6 text-ivory">
          Host supervisor: {student.record?.supervisorName || "Not yet named"}. Mentor note: {student.record?.mentorNote || "None yet."}
        </p>
      ) : null}
      <section className="rounded-3xl border border-navy/10 bg-paper p-4 sm:p-6">
        <JournalForm attachmentOpen={attachmentOpen} />
      </section>
      <section className="space-y-3">
        {student.journal.length === 0 ? <p className="text-sm text-charcoal/70">No entries yet.</p> : null}
        {student.journal.map((entry) => (
          <article key={entry.id} className="rounded-3xl border border-navy/10 bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-deep">
              {labels[entry.kind] ?? entry.kind} · {entry.happenedOn}
            </p>
            <h2 className="mt-1 font-display text-2xl text-navy">{entry.title}</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/80">{entry.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
