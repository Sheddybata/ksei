import { prisma } from "@/lib/prisma";

export async function recomputeGrade(userId: string, courseId: string) {
  const submissions = await prisma.submission.findMany({
    where: { userId, score: { not: null }, assessment: { courseId } },
  });
  if (!submissions.length) return;

  const percents = submissions.map((submission) => {
    const max = submission.maxScore || 1;
    return ((submission.score ?? 0) / max) * 100;
  });
  const score = Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);
  const feedback = [...submissions].reverse().find((submission) => submission.feedback)?.feedback ?? null;

  await prisma.grade.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, score, feedback },
    update: { score, feedback },
  });
}
