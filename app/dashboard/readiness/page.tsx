import type { Metadata } from "next";
import { traineeGates } from "@/lib/readiness";
import { scoreFields, summariseReviews } from "@/lib/formation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Graduation readiness" };

export default async function ReadinessPage() {
  const session = await getSession();
  if (!session) return null;
  const student = await prisma.student.findUnique({
    where: { userId: session.sub },
    include: { record: true, reviews: true },
  });
  if (!student) return null;
  const gates = await traineeGates(student.id);
  const summary = summariseReviews(student.reviews);
  const ready = gates.every((gate) => gate.met);
  const status = student.record?.certificateStatus ?? "NOT_READY";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Complete Assessment System</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">Graduation readiness</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/75">
          A certificate needs 50 percent overall, 50 percent in character, and 50 percent in practical skill, together with service, a portfolio, a plan, and the workplace months. Reading progress on a course is not the graduation mark.
        </p>
      </header>
      <section className="rounded-3xl bg-navy p-6 text-ivory">
        <p className="text-xs uppercase tracking-[0.16em] text-gold">{ready ? "Gates complete" : "Still in training"}</p>
        <p className="mt-2 font-display text-3xl sm:text-4xl">{summary ? `${summary.overall}% overall` : "No weekly review yet"}</p>
        <p className="mt-2 text-sm text-ivory/75">
          Certificate decision: {status === "CLEARED" ? "Cleared" : status === "WITHHELD" ? "Withheld" : "Not yet issued"}
        </p>
      </section>
      {summary ? (
        <dl className="grid gap-3 md:grid-cols-2">
          {scoreFields.map(([key, label, weight]) => (
            <div key={key} className="flex items-center justify-between rounded-2xl border border-navy/10 bg-paper px-4 py-3 text-sm">
              <dt>
                {label} <span className="text-charcoal/50">({weight}%)</span>
              </dt>
              <dd className="font-semibold text-navy">{summary.percent[key]}%</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <ul className="space-y-2">
        {gates.map((gate) => (
          <li key={gate.label} className="flex items-center justify-between rounded-2xl border border-navy/10 bg-paper px-4 py-3 text-sm">
            <span>{gate.label}</span>
            <span className={gate.met ? "font-semibold text-teal-deep" : "font-semibold text-navy"}>{gate.met ? "Met" : "Not yet"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
