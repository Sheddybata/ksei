import type { Metadata } from "next";
import { BusinessPlanForm } from "@/components/lms/formation-desk";
import { academyMonth, outcomes, weekRhythm } from "@/lib/formation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Formation" };

export default async function FormationPage() {
  const session = await getSession();
  if (!session) return null;
  const student = await prisma.student.findUnique({
    where: { userId: session.sub },
    include: { program: true, record: true },
  });
  if (!student) return null;
  const month = academyMonth(student.record?.academyMonth ?? 1);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Shared by every trainee</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">Formation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/75">
          {student.program.name} remains your trade. This page is the formation every trainee walks: the month’s theme, character, and a plan for honest work.
        </p>
      </header>

      <section className="rounded-3xl bg-navy p-4 text-ivory sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Month {month.month} · {month.phase}
        </p>
        <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{month.title}</h2>
      </section>

      <section>
        <h2 className="font-display text-3xl text-navy">Five outcomes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {outcomes.map(([title, copy]) => (
            <article key={title} className="rounded-3xl border border-navy/10 bg-paper p-5">
              <h3 className="font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-charcoal/75">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-navy/10 bg-paper p-6">
        <h2 className="font-display text-3xl text-navy">The day’s rhythm</h2>
        <ol className="mt-4 space-y-2">
          {weekRhythm.map(([time, activity]) => (
            <li key={time} className="grid gap-0.5 text-sm sm:grid-cols-[9.5rem_1fr] sm:gap-4">
              <span className="font-semibold text-teal-deep">{time}</span>
              <span>{activity}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-navy/10 bg-paper p-6">
        <h2 className="font-display text-3xl text-navy">Enterprise</h2>
        <p className="mt-2 mb-4 max-w-2xl text-sm leading-6 text-charcoal/75">
          By graduation the academy expects a simple plan: the work or enterprise you will pursue, and how you will handle money with integrity.
        </p>
        <BusinessPlanForm initial={student.record?.businessPlan ?? ""} />
      </section>
    </div>
  );
}
