import type { Metadata } from "next";
import Link from "next/link";
import { traineeGates } from "@/lib/readiness";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Year record" };

export default async function RecordsPage() {
  const students = await prisma.student.findMany({
    include: { user: true, program: true, record: true },
    orderBy: { studentNumber: "asc" },
  });
  const rows = await Promise.all(
    students.map(async (student) => {
      const gates = await traineeGates(student.id);
      const met = gates.filter((gate) => gate.met).length;
      return { student, met, total: gates.length };
    }),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Monitoring</p>
        <h1 className="mt-2 font-display text-5xl text-navy">The year on record</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Weekly scores, workplace placement, the certificate gate, and what a graduate is doing after the year.
        </p>
      </header>
      <div className="space-y-3">
        {rows.map(({ student, met, total }) => (
          <Link key={student.id} href={`/admin/records/${student.id}`} className="block rounded-3xl border border-navy/10 bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">{student.studentNumber}</p>
                <h2 className="font-display text-2xl text-navy">{student.user.name}</h2>
                <p className="text-sm text-charcoal/70">
                  {student.program.name} · Month {student.record?.academyMonth ?? 1}
                </p>
              </div>
              <p className="text-sm font-semibold text-navy">
                {met} of {total} gates · {student.record?.alumniOutcome || "No alumni note"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
