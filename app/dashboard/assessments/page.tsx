import type { Metadata } from "next";
import Link from "next/link";
import { buildPath, pathProgress } from "@/lib/path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Tests" };

export default async function AssessmentsPage() {
  const session = await getSession();
  if (!session) return null;
  const student = await prisma.student.findUnique({ where: { userId: session.sub } });
  if (!student) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      course: {
        include: {
          modules: { orderBy: { order: "asc" } },
          assessments: { include: { submissions: { where: { userId: session.sub } } } },
        },
      },
    },
    orderBy: { enrolledAt: "asc" },
  });
  const moduleIds = enrollments.flatMap((enrollment) => enrollment.course.modules.map((module) => module.id));
  const progressRows = moduleIds.length
    ? await prisma.moduleProgress.findMany({ where: { userId: session.sub, moduleId: { in: moduleIds }, completed: true } })
    : [];
  const done = new Set(progressRows.map((item) => item.moduleId));
  const courses = [...enrollments].sort((a, b) => {
    const aPrimary = a.course.programId === student.programId ? 0 : 1;
    const bPrimary = b.course.programId === student.programId ? 0 : 1;
    return aPrimary - bPrimary;
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Tests</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">Module history</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Each module ends with a test. The next module opens only after that test is passed at 70 percent or above. A missed test can be taken again.
        </p>
      </header>
      {courses.map((enrollment) => {
        const steps = buildPath(
          enrollment.course.modules,
          enrollment.course.assessments.map((assessment) => ({
            id: assessment.id,
            gateOrder: assessment.gateOrder,
            submission: assessment.submissions[0]
              ? { score: assessment.submissions[0].score, maxScore: assessment.submissions[0].maxScore }
              : null,
          })),
          done,
        );
        const added = enrollment.course.programId !== student.programId;
        return (
          <section key={enrollment.id} className="rounded-3xl border border-navy/10 bg-paper p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">{added ? "Added programme" : "Your course"}</p>
                <h2 className="mt-1 font-display text-2xl leading-tight text-navy sm:text-3xl">{enrollment.course.title}</h2>
              </div>
              <p className="text-sm text-charcoal/60">{pathProgress(steps)}%</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ivory-deep">
              <div className="h-full rounded-full bg-teal" style={{ width: `${pathProgress(steps)}%` }} />
            </div>
            <ol className="mt-5 divide-y divide-navy/10">
              {steps.map((step) => {
                const label = step.stepDone
                  ? `Passed${step.gate?.percent != null ? ` · ${step.gate.percent}%` : ""}`
                  : step.gate?.percent != null && !step.gate.passed
                    ? `Not yet · ${step.gate.percent}%`
                    : step.gate?.open
                      ? "Test open"
                      : step.unlocked
                        ? "Module open"
                        : "Locked";
                return (
                  <li key={step.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">Module {step.order}</p>
                      <p className="font-semibold text-navy">{step.title}</p>
                      <p className="text-charcoal/60">{step.lockReason ?? label}</p>
                    </div>
                    {step.unlocked ? (
                      <Link href={`/dashboard/courses/${enrollment.courseId}?module=${step.id}${step.gate?.open && !step.gate.passed ? "#checkpoint" : ""}`} className="font-semibold text-teal-deep">
                        {step.stepDone ? "Review" : step.gate?.open ? "Take test" : "Open"}
                      </Link>
                    ) : (
                      <span className="text-charcoal/40">Locked</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
