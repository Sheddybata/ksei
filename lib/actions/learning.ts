"use server";

import { revalidatePath } from "next/cache";
import { recomputeGrade } from "@/lib/grades";
import { PASS_MARK, buildPath, passedGate, pathProgress } from "@/lib/path";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function enrolledStudent(courseId: string) {
  const session = await requireSession(["STUDENT"]);
  if (!session) return null;
  const student = await prisma.student.findUnique({ where: { userId: session.sub } });
  if (!student) return null;
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId } },
  });
  if (!enrollment) return null;
  return { session, student, enrollment };
}

async function syncEnrollmentProgress(userId: string, studentId: string, courseId: string) {
  const [modules, assessments, completed] = await Promise.all([
    prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      select: { id: true, order: true, title: true },
    }),
    prisma.assessment.findMany({
      where: { courseId, gateOrder: { not: null } },
      include: { submissions: { where: { userId } } },
    }),
    prisma.moduleProgress.findMany({
      where: { userId, completed: true, module: { courseId } },
      select: { moduleId: true },
    }),
  ]);

  const steps = buildPath(
    modules,
    assessments.map((assessment) => ({
      id: assessment.id,
      gateOrder: assessment.gateOrder,
      submission: assessment.submissions[0]
        ? { score: assessment.submissions[0].score, maxScore: assessment.submissions[0].maxScore }
        : null,
    })),
    new Set(completed.map((item) => item.moduleId)),
  );
  const progress = pathProgress(steps);
  await prisma.enrollment.update({
    where: { studentId_courseId: { studentId, courseId } },
    data: { progress },
  });
  return progress;
}

export async function markModuleComplete(moduleId: string) {
  const learningModule = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!learningModule) return { ok: false as const, message: "Module not found." };

  const context = await enrolledStudent(learningModule.courseId);
  if (!context) return { ok: false as const, message: "You are not enrolled in this course." };

  if (learningModule.order > 1) {
    const previous = await prisma.module.findFirst({
      where: { courseId: learningModule.courseId, order: learningModule.order - 1 },
    });
    if (!previous) return { ok: false as const, message: "The previous module is missing." };
    const previousDone = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: context.session.sub, moduleId: previous.id } },
    });
    if (!previousDone?.completed) {
      return { ok: false as const, message: `Finish module ${previous.order} before this one.` };
    }
    const gate = await prisma.assessment.findFirst({
      where: { courseId: learningModule.courseId, gateOrder: previous.order },
      include: { submissions: { where: { userId: context.session.sub } } },
    });
    if (gate && !passedGate(gate.submissions[0] ?? null)) {
      return { ok: false as const, message: `Pass the module ${previous.order} test before you continue.` };
    }
  }

  await prisma.moduleProgress.upsert({
    where: { userId_moduleId: { userId: context.session.sub, moduleId } },
    create: { userId: context.session.sub, moduleId, completed: true },
    update: { completed: true },
  });

  const progress = await syncEnrollmentProgress(context.session.sub, context.student.id, learningModule.courseId);
  revalidatePath(`/dashboard/courses/${learningModule.courseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assessments");
  return { ok: true as const, progress, message: "Module marked complete. The test for this module is now open." };
}

export async function submitQuiz(assessmentId: string, answers: number[]) {
  const session = await requireSession(["STUDENT"]);
  if (!session) return { ok: false as const, message: "Sign in as a student to submit." };

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!assessment || assessment.type !== "QUIZ") {
    return { ok: false as const, message: "This quiz is not available." };
  }

  const context = await enrolledStudent(assessment.courseId);
  if (!context) return { ok: false as const, message: "You are not enrolled in this course." };

  if (assessment.gateOrder != null) {
    const learningModule = await prisma.module.findFirst({
      where: { courseId: assessment.courseId, order: assessment.gateOrder },
    });
    const done = learningModule
      ? await prisma.moduleProgress.findUnique({
          where: { userId_moduleId: { userId: session.sub, moduleId: learningModule.id } },
        })
      : null;
    if (!done?.completed) {
      return { ok: false as const, message: "Finish this module before you take the test." };
    }
  }

  if (answers.length !== assessment.questions.length || answers.some((answer) => !Number.isInteger(answer) || answer < 0)) {
    return { ok: false as const, message: "Answer every question before submitting." };
  }

  const existing = await prisma.submission.findUnique({
    where: { assessmentId_userId: { assessmentId, userId: session.sub } },
  });
  if (existing && passedGate(existing)) {
    return { ok: false as const, message: "You already passed this test." };
  }

  let score = 0;
  let maxScore = 0;
  assessment.questions.forEach((question, index) => {
    const options = JSON.parse(question.options) as string[];
    maxScore += question.points;
    if (answers[index] >= 0 && answers[index] < options.length && answers[index] === question.correctIndex) {
      score += question.points;
    }
  });
  const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const nextModule =
    assessment.gateOrder == null
      ? null
      : await prisma.module.findFirst({
          where: { courseId: assessment.courseId, order: assessment.gateOrder + 1 },
        });
  const passed = percent >= PASS_MARK;
  const feedback = assessment.gateOrder == null
    ? percent >= 80
      ? "Strong command of this material. Carry the same clarity into your practice."
      : percent >= 50
        ? "A solid attempt. Revisit the module notes for the questions you missed."
        : "Review the lesson and speak with your instructor before you move on."
    : passed
      ? nextModule
        ? `You passed. ${nextModule.title} is now open.`
        : "You passed the last test in this course."
      : `You need ${PASS_MARK} percent to unlock the next module. Review this module and try the test again.`;

  if (existing) {
    await prisma.submission.update({
      where: { id: existing.id },
      data: {
        answers: JSON.stringify(answers),
        score,
        maxScore,
        feedback,
        submittedAt: new Date(),
      },
    });
  } else {
    await prisma.submission.create({
      data: {
        assessmentId,
        userId: session.sub,
        answers: JSON.stringify(answers),
        score,
        maxScore,
        feedback,
      },
    });
  }
  await recomputeGrade(session.sub, assessment.courseId);
  await syncEnrollmentProgress(session.sub, context.student.id, assessment.courseId);

  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/courses/${assessment.courseId}`);
  return { ok: true as const, score, maxScore, percent, feedback, passed: percent >= PASS_MARK };
}

export async function submitAssignment(assessmentId: string, essay: string) {
  const session = await requireSession(["STUDENT"]);
  if (!session) return { ok: false as const, message: "Sign in as a student to submit." };
  const text = essay.trim();
  if (text.length < 30) return { ok: false as const, message: "Write a fuller response before submitting." };

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment || assessment.type !== "ASSIGNMENT") {
    return { ok: false as const, message: "This assignment is not open." };
  }
  const context = await enrolledStudent(assessment.courseId);
  if (!context) return { ok: false as const, message: "You are not enrolled in this course." };

  const existing = await prisma.submission.findUnique({
    where: { assessmentId_userId: { assessmentId, userId: session.sub } },
  });
  if (existing) return { ok: false as const, message: "You have already submitted this assignment." };

  await prisma.submission.create({
    data: {
      assessmentId,
      userId: session.sub,
      answers: text,
      feedback: "Submitted. Your instructor will review this work.",
    },
  });

  revalidatePath("/dashboard/assessments");
  revalidatePath(`/dashboard/courses/${assessment.courseId}`);
  revalidatePath("/admin/courses");
  return { ok: true as const, message: "Assignment submitted for review." };
}

export async function markNotificationsRead() {
  const session = await requireSession(["STUDENT", "INSTRUCTOR", "ADMIN"]);
  if (!session) return;
  await prisma.notification.updateMany({
    where: { userId: session.sub, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard");
}
