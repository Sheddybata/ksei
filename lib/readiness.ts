import { graduationGates } from "@/lib/formation";
import { summariseReviews } from "@/lib/formation";
import { prisma } from "@/lib/prisma";

export async function traineeGates(studentId: string) {
  const [reviews, entries, record] = await Promise.all([
    prisma.weeklyReview.findMany({ where: { studentId } }),
    prisma.journalEntry.findMany({ where: { studentId } }),
    prisma.traineeRecord.findUnique({ where: { studentId } }),
  ]);
  return graduationGates({
    summary: summariseReviews(reviews),
    logbook: entries.filter((entry) => entry.kind === "LOGBOOK").length,
    practicalEvidence: entries.filter((entry) => entry.kind === "PRACTICAL").length,
    service: entries.filter((entry) => entry.kind === "SERVICE").length,
    attachmentReports: entries.filter((entry) => entry.kind === "ATTACHMENT").length,
    organisation: record?.organisation ?? "",
    businessPlan: record?.businessPlan ?? "",
    withheld: record?.certificateStatus === "WITHHELD",
  });
}