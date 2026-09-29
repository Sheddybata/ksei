import type { Metadata } from "next";
import Link from "next/link";
import { markNotificationsRead } from "@/lib/actions/learning";
import { LearningPath } from "@/components/lms/learning-path";
import { buildPath, pathProgress } from "@/lib/path";
import { formatDate, greeting } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "My course" };

export default async function StudentHomePage() {
  const session = await getSession();
  if (!session) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.sub },
    include: {
      program: true,
      enrollments: {
        include: {
          course: {
            include: {
              modules: { orderBy: { order: "asc" } },
              assessments: { include: { submissions: { where: { userId: session.sub } } } },
            },
          },
        },
        orderBy: { enrolledAt: "asc" },
      },
      user: { include: { notifications: { orderBy: { createdAt: "desc" }, take: 4 } } },
    },
  });
  if (!student) return null;

  const moduleIds = student.enrollments.flatMap((enrollment) => enrollment.course.modules.map((module) => module.id));
  const progressRows = moduleIds.length
    ? await prisma.moduleProgress.findMany({ where: { userId: session.sub, moduleId: { in: moduleIds }, completed: true } })
    : [];
  const done = new Set(progressRows.map((item) => item.moduleId));
  const unread = student.user.notifications.some((notification) => !notification.read);

  const courses = [...student.enrollments].sort((a, b) => {
    const aPrimary = a.course.programId === student.programId ? 0 : 1;
    const bPrimary = b.course.programId === student.programId ? 0 : 1;
    return aPrimary - bPrimary || a.enrolledAt.getTime() - b.enrolledAt.getTime();
  });

  const deadlines = courses
    .flatMap((enrollment) =>
      enrollment.course.assessments
        .filter((assessment) => assessment.dueDate && assessment.submissions.length === 0)
        .map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          dueDate: assessment.dueDate as Date,
        })),
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">{student.studentNumber}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">{greeting(student.user.name)}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          {student.program.name} is your course. Work through the modules in order. Each test stays locked until that module is finished, and the next module stays locked until the test is passed.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/dashboard/formation" className="text-teal-deep">
            Formation
          </Link>
          <Link href="/dashboard/record" className="text-teal-deep">
            Record
          </Link>
          <Link href="/dashboard/readiness" className="text-teal-deep">
            Readiness
          </Link>
          <Link href="/dashboard/id-card" className="text-teal-deep">
            Digital ID
          </Link>
        </div>
      </header>

      {courses.length > 1 ? (
        <p className="text-sm text-charcoal/70">
          A second programme has been added. It runs at the same time, with its own modules and tests.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          {courses.length === 0 ? (
            <p className="rounded-3xl border border-navy/10 bg-paper p-5 text-sm text-charcoal/70">No course is on your record yet.</p>
          ) : null}
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
            return (
              <LearningPath
                key={enrollment.id}
                courseId={enrollment.courseId}
                title={enrollment.course.title}
                summary={enrollment.course.description}
                progress={pathProgress(steps)}
                steps={steps}
                added={enrollment.course.programId !== student.programId}
              />
            );
          })}
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-navy/10 bg-paper p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-navy">Notices</h2>
              {unread ? (
                <form action={markNotificationsRead}>
                  <button className="text-sm font-semibold text-teal-deep" type="submit">
                    Mark read
                  </button>
                </form>
              ) : null}
            </div>
            <ul className="mt-3 space-y-3">
              {student.user.notifications.length === 0 ? <li className="text-sm text-charcoal/60">No notices yet.</li> : null}
              {student.user.notifications.map((notification) => (
                <li key={notification.id} className="text-sm">
                  <p className="font-semibold text-navy">{notification.title}</p>
                  <p className="text-charcoal/70">{notification.body}</p>
                </li>
              ))}
            </ul>
            {deadlines.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-navy">Upcoming</h3>
                <ul className="mt-2 space-y-2 text-sm text-charcoal/80">
                  {deadlines.slice(0, 4).map((deadline) => (
                    <li key={deadline.id}>
                      {formatDate(deadline.dueDate)} · {deadline.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Link href="/dashboard/assessments" className="mt-4 inline-flex text-sm font-semibold text-teal-deep">
              Test history
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
