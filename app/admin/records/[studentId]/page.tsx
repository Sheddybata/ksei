import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddProgrammeForm, AlumniForm, CertificateActions, PlacementForm, WeeklyReviewForm } from "@/components/admin/year-desk";
import { traineeGates } from "@/lib/readiness";
import { journalKinds, scoreFields, summariseReviews } from "@/lib/formation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Trainee record" };

const labels = Object.fromEntries(journalKinds);

export default async function TraineeRecordPage({ params }: { params: { studentId: string } }) {
  const session = await getSession();
  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    include: {
      user: true,
      program: true,
      record: true,
      reviews: { orderBy: { weekNumber: "asc" } },
      journal: { orderBy: { happenedOn: "desc" } },
      enrollments: { include: { course: true }, orderBy: { enrolledAt: "asc" } },
    },
  });
  if (!student) notFound();
  const admin = session?.role === "ADMIN";
  const catalogue = admin
    ? await prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } })
    : [];
  const taken = new Set(student.enrollments.map((enrollment) => enrollment.courseId));
  const gates = await traineeGates(student.id);
  const summary = summariseReviews(student.reviews);

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin/records" className="text-sm font-semibold text-teal-deep">
          All trainees
        </Link>
        <h1 className="mt-2 font-display text-5xl text-navy">{student.user.name}</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          {student.studentNumber} · {student.program.name} · {summary ? `${summary.overall}% overall` : "No weekly score yet"}
        </p>
      </header>

      <section className="rounded-3xl border border-navy/10 bg-paper p-6">
        <h2 className="font-display text-3xl text-navy">Programmes</h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          A trainee is admitted to one course. Add another only when they must run two at the same time. Each course keeps its own modules and tests.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {student.enrollments.map((enrollment) => (
            <li key={enrollment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-ivory px-4 py-3">
              <span className="font-semibold text-navy">{enrollment.course.title}</span>
              <span className="text-charcoal/60">{enrollment.course.programId === student.programId ? "Admitted course" : "Added"} · {enrollment.progress}%</span>
            </li>
          ))}
        </ul>
        {admin ? (
          <div className="mt-4">
            <AddProgrammeForm
              studentId={student.id}
              options={catalogue.filter((course) => !taken.has(course.id)).map((course) => ({ id: course.id, label: course.title }))}
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-navy/10 bg-paper p-6">
        <h2 className="font-display text-3xl text-navy">Month and workplace</h2>
        <div className="mt-4">
          <PlacementForm
            studentId={student.id}
            academyMonth={student.record?.academyMonth ?? 1}
            organisation={student.record?.organisation ?? ""}
            supervisorName={student.record?.supervisorName ?? ""}
            mentorNote={student.record?.mentorNote ?? ""}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-navy/10 bg-paper p-6">
        <h2 className="font-display text-3xl text-navy">Weekly review</h2>
        <p className="mt-2 mb-4 text-sm leading-6 text-charcoal/70">
          Score 5 for excellent, 4 very good, 3 satisfactory, 2 needs improvement, 1 poor, and 0 if it was not observed. These are the Complete Assessment System areas.
        </p>
        <WeeklyReviewForm studentId={student.id} />
        {student.reviews.length ? (
          <ul className="mt-6 space-y-2 text-sm">
            {student.reviews.map((review) => (
              <li key={review.id} className="rounded-2xl bg-ivory px-4 py-3">
                Week {review.weekNumber}: {scoreFields.map(([key, label]) => `${label} ${review[key]}`).join(" · ")}
                {review.note ? ` — ${review.note}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-3xl border border-navy/10 bg-paper p-6">
        <h2 className="font-display text-3xl text-navy">Graduation gates</h2>
        <ul className="mt-4 space-y-2">
          {gates.map((gate) => (
            <li key={gate.label} className="flex justify-between gap-4 text-sm">
              <span>{gate.label}</span>
              <span className="font-semibold text-navy">{gate.met ? "Met" : "Not yet"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-charcoal/70">Plan on file: {student.record?.businessPlan || "None yet."}</p>
        {admin ? (
          <div className="mt-4">
            <CertificateActions studentId={student.id} status={student.record?.certificateStatus ?? "NOT_READY"} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-charcoal/70">An administrator issues or withholds the certificate.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-3xl text-navy">Evidence</h2>
        {student.journal.length === 0 ? <p className="text-sm text-charcoal/70">No logbook, service, practical or workplace entries yet.</p> : null}
        {student.journal.map((entry) => (
          <article key={entry.id} className="rounded-3xl border border-navy/10 bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-deep">
              {labels[entry.kind] ?? entry.kind} · {entry.happenedOn}
            </p>
            <h3 className="font-semibold text-navy">{entry.title}</h3>
            <p className="mt-1 text-sm leading-6 text-charcoal/80">{entry.body}</p>
          </article>
        ))}
      </section>

      {admin ? (
        <section className="rounded-3xl border border-navy/10 bg-paper p-6">
          <h2 className="font-display text-3xl text-navy">After graduation</h2>
          <div className="mt-4">
            <AlumniForm studentId={student.id} outcome={student.record?.alumniOutcome ?? ""} note={student.record?.alumniNote ?? ""} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
