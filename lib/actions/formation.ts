"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { alumniOutcomes, scoreFields, type ScoreKey } from "@/lib/formation";
import { traineeGates } from "@/lib/readiness";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

async function ownStudent() {
  const session = await requireSession(["STUDENT"]);
  if (!session) return null;
  return prisma.student.findUnique({ where: { userId: session.sub }, include: { record: true } });
}

export async function saveBusinessPlan(plan: string) {
  const student = await ownStudent();
  if (!student) return { ok: false as const, message: "Sign in as a trainee to save this plan." };
  const text = plan.trim();
  if (text.length < 40) return { ok: false as const, message: "Write at least a short paragraph about the work or enterprise you are preparing for." };
  await prisma.traineeRecord.upsert({
    where: { studentId: student.id },
    update: { businessPlan: text },
    create: { studentId: student.id, businessPlan: text },
  });
  revalidatePath("/dashboard/formation");
  revalidatePath("/dashboard/readiness");
  return { ok: true as const, message: "Your business or career plan is saved." };
}

const entrySchema = z.object({
  kind: z.enum(["LOGBOOK", "PRACTICAL", "SERVICE", "ATTACHMENT"]),
  title: z.string().trim().min(3, "Give this entry a short title."),
  body: z.string().trim().min(20, "Write a few sentences so the record is useful."),
  happenedOn: z.string().min(8, "Choose the date."),
});

export async function addJournalEntry(formData: FormData) {
  const student = await ownStudent();
  if (!student) return { ok: false as const, message: "Sign in as a trainee to add a record." };
  const parsed = entrySchema.safeParse({
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body"),
    happenedOn: formData.get("happenedOn"),
  });
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the entry and try again." };
  if (parsed.data.kind === "ATTACHMENT" && (student.record?.academyMonth ?? 1) < 8) {
    return { ok: false as const, message: "Workplace reports open in month 8, when industrial attachment begins." };
  }
  await prisma.journalEntry.create({ data: { studentId: student.id, ...parsed.data } });
  revalidatePath("/dashboard/record");
  revalidatePath("/dashboard/readiness");
  return { ok: true as const, message: "The entry is in your record." };
}

const reviewSchema = z.object({
  studentId: z.string().min(4),
  weekNumber: z.coerce.number().int().min(1).max(52),
  note: z.string().trim().max(500).optional(),
});

export async function saveWeeklyReview(formData: FormData) {
  const session = await requireSession(["ADMIN", "INSTRUCTOR"]);
  if (!session) return { ok: false as const, message: "Only staff can score a trainee week." };
  const scores = {} as Record<ScoreKey, number>;
  for (const [key] of scoreFields) {
    const value = Number(formData.get(key));
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      return { ok: false as const, message: "Score each area from 0 to 5." };
    }
    scores[key] = value;
  }
  const parsed = reviewSchema.safeParse({
    studentId: formData.get("studentId"),
    weekNumber: formData.get("weekNumber"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the week and try again." };
  await prisma.weeklyReview.upsert({
    where: { studentId_weekNumber: { studentId: parsed.data.studentId, weekNumber: parsed.data.weekNumber } },
    update: { ...scores, note: parsed.data.note ?? "" },
    create: { studentId: parsed.data.studentId, weekNumber: parsed.data.weekNumber, ...scores, note: parsed.data.note ?? "" },
  });
  revalidatePath("/admin/records");
  revalidatePath(`/admin/records/${parsed.data.studentId}`);
  revalidatePath("/dashboard/readiness");
  return { ok: true as const, message: "The weekly review is saved." };
}

export async function savePlacement(formData: FormData) {
  const session = await requireSession(["ADMIN", "INSTRUCTOR"]);
  if (!session) return { ok: false as const, message: "Only staff can set a placement." };
  const studentId = String(formData.get("studentId") || "");
  const academyMonth = Number(formData.get("academyMonth"));
  const organisation = String(formData.get("organisation") || "").trim();
  const supervisorName = String(formData.get("supervisorName") || "").trim();
  const mentorNote = String(formData.get("mentorNote") || "").trim();
  if (!studentId || !Number.isInteger(academyMonth) || academyMonth < 1 || academyMonth > 12) {
    return { ok: false as const, message: "Choose a month from 1 to 12." };
  }
  await prisma.traineeRecord.upsert({
    where: { studentId },
    update: { academyMonth, organisation, supervisorName, mentorNote },
    create: { studentId, academyMonth, organisation, supervisorName, mentorNote },
  });
  revalidatePath(`/admin/records/${studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/formation");
  revalidatePath("/dashboard/record");
  return { ok: true as const, message: "The month and placement are saved." };
}

export async function decideCertificate(studentId: string, decision: "CLEARED" | "WITHHELD" | "NOT_READY") {
  const session = await requireSession(["ADMIN"]);
  if (!session) return { ok: false as const, message: "Only an administrator can decide certification." };
  if (decision === "CLEARED") {
    const ready = await traineeGates(studentId);
    if (!ready.every((gate) => gate.met)) {
      return { ok: false as const, message: "This trainee has not met every graduation gate. The certificate stays withheld until they do." };
    }
  }
  await prisma.traineeRecord.upsert({
    where: { studentId },
    update: { certificateStatus: decision },
    create: { studentId, certificateStatus: decision },
  });
  revalidatePath(`/admin/records/${studentId}`);
  revalidatePath("/dashboard/readiness");
  return { ok: true as const, message: decision === "CLEARED" ? "Cleared for certification." : "The certificate decision is saved." };
}

export async function saveAlumni(formData: FormData) {
  const session = await requireSession(["ADMIN"]);
  if (!session) return { ok: false as const, message: "Only an administrator can update alumni follow-up." };
  const studentId = String(formData.get("studentId") || "");
  const alumniOutcome = String(formData.get("alumniOutcome") || "");
  const alumniNote = String(formData.get("alumniNote") || "").trim();
  if (!alumniOutcomes.includes(alumniOutcome as (typeof alumniOutcomes)[number])) {
    return { ok: false as const, message: "Choose an alumni outcome." };
  }
  await prisma.traineeRecord.upsert({
    where: { studentId },
    update: { alumniOutcome, alumniNote },
    create: { studentId, alumniOutcome, alumniNote },
  });
  revalidatePath(`/admin/records/${studentId}`);
  revalidatePath("/admin/records");
  return { ok: true as const, message: "Alumni follow-up is saved." };
}
