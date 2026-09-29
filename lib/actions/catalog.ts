"use server";

import { revalidatePath } from "next/cache";
import { recomputeGrade } from "@/lib/grades";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function canTeach(courseId: string) {
  const session = await requireSession(["ADMIN", "INSTRUCTOR"]);
  if (!session) return null;
  if (session.role === "ADMIN") return session;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== session.sub) return null;
  return session;
}

export async function createCourse(input: {
  programId: string;
  code: string;
  title: string;
  description: string;
  instructorId: string;
  enrollExisting: boolean;
}) {
  const session = await requireSession(["ADMIN", "INSTRUCTOR"]);
  if (!session) return { ok: false as const, message: "You do not have permission to create a course." };

  const code = input.code.trim().toUpperCase();
  const title = input.title.trim();
  const description = input.description.trim();
  if (code.length < 3 || title.length < 3 || description.length < 12) {
    return { ok: false as const, message: "Add a course code, title, and a short description." };
  }

  const taken = await prisma.course.findUnique({ where: { code } });
  if (taken) return { ok: false as const, message: "That course code is already in use." };

  const course = await prisma.course.create({
    data: {
      code,
      title,
      description,
      programId: input.programId,
      instructorId: input.instructorId || null,
    },
  });

  if (input.enrollExisting) {
    const students = await prisma.student.findMany({ where: { programId: input.programId, status: "ACTIVE" } });
    if (students.length) {
      await prisma.enrollment.createMany({
        data: students.map((student) => ({ studentId: student.id, courseId: course.id, progress: 0 })),
      });
    }
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true as const, message: `${code} is now on the catalogue.` };
}

export async function updateCourse(input: {
  id: string;
  title: string;
  description: string;
  instructorId: string;
}) {
  const session = await canTeach(input.id);
  if (!session) return { ok: false as const, message: "You can only edit courses you teach." };

  await prisma.course.update({
    where: { id: input.id },
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      instructorId: input.instructorId || null,
    },
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/dashboard/courses/${input.id}`);
  return { ok: true as const, message: "Course details saved." };
}

export async function addModule(input: {
  courseId: string;
  title: string;
  type: "VIDEO" | "READING";
  content: string;
  videoUrl: string;
  resourceUrl: string;
}) {
  const session = await canTeach(input.courseId);
  if (!session) return { ok: false as const, message: "You can only add modules to your courses." };
  if (input.title.trim().length < 3 || input.content.trim().length < 12) {
    return { ok: false as const, message: "Give the module a title and some teaching notes." };
  }

  const last = await prisma.module.findFirst({
    where: { courseId: input.courseId },
    orderBy: { order: "desc" },
  });

  await prisma.module.create({
    data: {
      courseId: input.courseId,
      title: input.title.trim(),
      type: input.type,
      content: input.content.trim(),
      videoUrl: input.videoUrl.trim() || null,
      resourceUrl: input.resourceUrl.trim() || null,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/dashboard/courses/${input.courseId}`);
  return { ok: true as const, message: "Module added." };
}

export async function deleteModule(moduleId: string) {
  const lesson = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!lesson) return { ok: false as const, message: "Module not found." };
  const session = await canTeach(lesson.courseId);
  if (!session) return { ok: false as const, message: "You cannot remove this module." };
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath("/admin/courses");
  revalidatePath(`/dashboard/courses/${lesson.courseId}`);
  return { ok: true as const, message: "Module removed." };
}

export async function createAssessment(input: {
  courseId: string;
  title: string;
  type: "QUIZ" | "ASSIGNMENT";
  dueDate: string;
  instructions: string;
  questions: { prompt: string; options: string[]; correctIndex: number; points: number }[];
}) {
  const session = await canTeach(input.courseId);
  if (!session) return { ok: false as const, message: "You can only assess courses you teach." };
  if (input.title.trim().length < 3) return { ok: false as const, message: "Name the assessment." };

  const questions = input.questions
    .map((question, index) => {
      const packed = question.options
        .map((option) => option.trim())
        .map((option, optionIndex) => ({ option, optionIndex }))
        .filter((item) => item.option.length > 0);
      const correctIndex = packed.findIndex((item) => item.optionIndex === question.correctIndex);
      return {
        prompt: question.prompt.trim(),
        options: packed.map((item) => item.option),
        correctIndex,
        points: Number(question.points) || 1,
        order: index + 1,
      };
    })
    .filter((question) => question.prompt.length > 0);

  if (input.type === "QUIZ" && questions.length === 0) {
    return { ok: false as const, message: "A quiz needs at least one question." };
  }
  if (questions.some((question) => question.options.length < 2 || question.correctIndex < 0)) {
    return { ok: false as const, message: "Each quiz question needs options and a correct answer." };
  }

  await prisma.assessment.create({
    data: {
      courseId: input.courseId,
      title: input.title.trim(),
      type: input.type,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      instructions: input.instructions.trim() || null,
      questions: {
        create: questions.map((question) => ({
          prompt: question.prompt,
          options: JSON.stringify(question.options),
          correctIndex: question.correctIndex,
          points: question.points,
          order: question.order,
        })),
      },
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/dashboard/assessments");
  revalidatePath(`/dashboard/courses/${input.courseId}`);
  return { ok: true as const, message: "Assessment published." };
}

export async function gradeSubmission(input: { submissionId: string; score: number; feedback: string }) {
  const submission = await prisma.submission.findUnique({
    where: { id: input.submissionId },
    include: { assessment: true },
  });
  if (!submission) return { ok: false as const, message: "Submission not found." };
  const session = await canTeach(submission.assessment.courseId);
  if (!session) return { ok: false as const, message: "You cannot grade this submission." };

  const score = Math.max(0, Math.min(100, Math.round(input.score)));
  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      score,
      maxScore: 100,
      feedback: input.feedback.trim() || "Reviewed by your instructor.",
    },
  });
  await recomputeGrade(submission.userId, submission.assessment.courseId);
  revalidatePath("/admin/courses");
  revalidatePath("/dashboard/assessments");
  revalidatePath("/dashboard");
  return { ok: true as const, message: "Grade and feedback saved." };
}
