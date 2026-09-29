import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseViewer } from "@/components/lms/course-viewer";
import { buildPath, pathProgress, percentOf, passedGate } from "@/lib/path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Course" };

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { module?: string };
}) {
  const session = await getSession();
  if (!session) return null;

  const student = await prisma.student.findUnique({ where: { userId: session.sub } });
  if (!student) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: params.courseId } },
    include: {
      course: {
        include: {
          modules: { orderBy: { order: "asc" } },
          assessments: {
            include: {
              questions: { orderBy: { order: "asc" } },
              submissions: { where: { userId: session.sub } },
            },
          },
          instructor: true,
        },
      },
    },
  });
  if (!enrollment) notFound();

  const progressRows = await prisma.moduleProgress.findMany({
    where: { userId: session.sub, moduleId: { in: enrollment.course.modules.map((module) => module.id) } },
  });
  const done = new Set(progressRows.filter((item) => item.completed).map((item) => item.moduleId));
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
  const byId = new Map(steps.map((step) => [step.id, step]));
  const quizzes = enrollment.course.assessments.filter((assessment) => assessment.type === "QUIZ" && assessment.gateOrder != null);
  const added = enrollment.course.programId !== student.programId;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-teal-deep">
          Back to my course
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">{added ? "Added programme" : "Your course"}</p>
        <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl text-navy">{enrollment.course.title}</h1>
        <p className="mt-2 text-sm text-charcoal/60">
          {enrollment.course.instructor ? `Instructor: ${enrollment.course.instructor.name}` : "Instructor to be confirmed"}
          {" · "}
          Finish each module, then pass its test, before the next one opens.
        </p>
      </div>
      <CourseViewer
        key={searchParams.module ?? "current"}
        progress={pathProgress(steps)}
        initialModuleId={searchParams.module}
        modules={enrollment.course.modules.map((module) => {
          const step = byId.get(module.id);
          const unlocked = step?.unlocked ?? false;
          return {
            id: module.id,
            order: module.order,
            title: module.title,
            type: module.type as "VIDEO" | "READING",
            content: unlocked ? module.content : "",
            videoUrl: unlocked ? module.videoUrl : null,
            resourceUrl: unlocked ? module.resourceUrl : null,
            completed: step?.completed ?? false,
            unlocked,
            lockReason: step?.lockReason ?? null,
            stepDone: step?.stepDone ?? false,
          };
        })}
        checkpoints={quizzes.flatMap((assessment) => {
          const module = enrollment.course.modules.find((item) => item.order === assessment.gateOrder);
          const step = module ? byId.get(module.id) : undefined;
          if (!module || !step?.unlocked) return [];
          const submission = assessment.submissions[0];
          const percent = percentOf(submission ?? null) ?? 0;
          return [
            {
              moduleId: module.id,
              id: assessment.id,
              title: assessment.title,
              instructions: assessment.instructions,
              questions: step.completed
                ? assessment.questions.map((question) => ({
                    id: question.id,
                    prompt: question.prompt,
                    options: JSON.parse(question.options) as string[],
                  }))
                : [],
              open: step.completed,
              submission: submission
                ? {
                    score: submission.score ?? 0,
                    maxScore: submission.maxScore ?? 0,
                    percent,
                    feedback: submission.feedback,
                    passed: passedGate(submission),
                  }
                : null,
            },
          ];
        })}
        assignments={enrollment.course.assessments
          .filter((assessment) => assessment.type === "ASSIGNMENT")
          .map((assessment) => ({
            id: assessment.id,
            title: assessment.title,
            instructions: assessment.instructions,
            dueDate: assessment.dueDate?.toISOString() ?? null,
            submitted: assessment.submissions.length > 0,
            feedback: assessment.submissions[0]?.feedback ?? null,
          }))}
      />
    </div>
  );
}
