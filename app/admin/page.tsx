import type { Metadata } from "next";
import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Executive dashboard" };

export default async function AdminHomePage() {
  const session = await getSession();
  const [applications, students, courses, grades] = await Promise.all([
    prisma.application.findMany({ include: { program: true }, orderBy: { submittedAt: "desc" } }),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.course.count(),
    prisma.grade.findMany(),
  ]);

  const pending = applications.filter((application) => application.status === "PENDING").length;
  const approved = applications.filter((application) => application.status === "APPROVED").length;
  const average = grades.length
    ? Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length)
    : 0;

  const byProgram = new Map<string, number>();
  for (const application of applications) {
    byProgram.set(application.program.name, (byProgram.get(application.program.name) ?? 0) + 1);
  }
  const max = Math.max(...Array.from(byProgram.values()), 1);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Education management</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          {session?.name}, this desk watches admissions, the trainee year, and whether someone is ready to be certified. The year record holds weekly scores, placements and alumni follow-up.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        {[
          [applications.length, "Applicants", "All files received"],
          [pending, "Pending", "Waiting for a decision"],
          [students, "Enrolled", "Active student records"],
          [courses, "Courses", `Average mark ${average}%`],
        ].map(([value, label, hint]) => (
          <article key={String(label)} className="rounded-3xl border border-navy/10 bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/50">{label}</p>
            <p className="mt-3 font-display text-5xl text-navy">{value}</p>
            <p className="mt-1 text-sm text-charcoal/70">{hint}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-navy/10 bg-paper p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-navy">Recent applications</h2>
            {session?.role === "ADMIN" ? (
              <Link href="/admin/applications" className="text-sm font-semibold text-teal-deep">
                Open admissions
              </Link>
            ) : null}
          </div>
          <ul className="mt-4 divide-y divide-navy/10">
            {applications.slice(0, 6).map((application) => (
              <li key={application.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-navy">{application.fullName}</p>
                  <p className="text-xs text-charcoal/60">
                    {application.program.name} · {formatDate(application.submittedAt)}
                  </p>
                </div>
                <Badge tone={statusTone(application.status)}>{application.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-navy p-5 text-ivory">
          <h2 className="font-display text-2xl">Applications by programme</h2>
          <div className="mt-6 space-y-4">
            {Array.from(byProgram.entries()).map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gold" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ivory/70">{approved} admissions approved and issued a student ID.</p>
        </div>
      </section>
    </div>
  );
}
