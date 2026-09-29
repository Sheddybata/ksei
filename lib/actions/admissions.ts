"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { nextStudentNumber, portraitFromUpload, temporaryPassword } from "@/lib/student-id";
import { saveUpload } from "@/lib/uploads";

const applicationSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a phone number we can reach."),
  state: z.string().trim().min(2, "Select your state of residence."),
  dateOfBirth: z.string().min(4, "Enter your date of birth."),
  educationLevel: z.string().min(2, "Select your education level."),
  programId: z.string().min(4, "Choose a programme."),
  courseId: z.string().optional(),
  statement: z.string().trim().min(40, "Tell us a little more — at least a short paragraph."),
  commitment: z.literal("yes", { errorMap: () => ({ message: "Accept the trainee commitment before you submit." }) }),
});

function reference() {
  const year = new Date().getFullYear();
  const stamp = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${stamp}`;
}

export async function submitApplication(formData: FormData) {
  const parsed = applicationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    state: formData.get("state"),
    dateOfBirth: formData.get("dateOfBirth"),
    educationLevel: formData.get("educationLevel"),
    programId: formData.get("programId"),
    courseId: String(formData.get("courseId") || "") || undefined,
    statement: formData.get("statement"),
    commitment: formData.get("commitment"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const data = parsed.data;
  const dob = new Date(data.dateOfBirth);
  if (Number.isNaN(dob.getTime()) || dob > new Date() || dob.getFullYear() < 1940) {
    return { ok: false as const, message: "Enter a valid date of birth." };
  }

  const program = await prisma.program.findUnique({
    where: { id: data.programId },
    include: { courses: true },
  });
  if (!program) return { ok: false as const, message: "That programme is no longer open." };

  if (data.courseId && !program.courses.some((course) => course.id === data.courseId)) {
    return { ok: false as const, message: "Choose a course that belongs to the selected programme." };
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.application.findFirst({
    where: { email, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) {
    return {
      ok: false as const,
      message: `An application for this email is already on file (${existing.reference}).`,
    };
  }

  let photoIdUrl: string | null = null;
  let documentUrl: string | null = null;
  try {
    photoIdUrl = await saveUpload(formData.get("photoId"), "id");
    documentUrl = await saveUpload(formData.get("document"), "doc");
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Upload failed." };
  }

  const created = await prisma.application.create({
    data: {
      reference: reference(),
      fullName: data.fullName,
      email,
      phone: data.phone,
      state: data.state,
      dateOfBirth: data.dateOfBirth,
      educationLevel: data.educationLevel,
      statement: data.statement,
      commitment: true,
      photoIdUrl,
      documentUrl,
      programId: program.id,
      courseId: data.courseId || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/");

  return {
    ok: true as const,
    reference: created.reference,
    message: "Your application is with the admissions office.",
  };
}

export async function approveApplication(applicationId: string) {
  const session = await requireSession(["ADMIN"]);
  if (!session) return { ok: false as const, message: "Only an administrator can approve admissions." };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { program: { include: { courses: true } } },
  });
  if (!application) return { ok: false as const, message: "Application not found." };
  if (application.status === "APPROVED") {
    return { ok: false as const, message: "This application has already been approved." };
  }

  const email = application.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { ok: false as const, message: "A portal account with this email already exists." };
  }

  const password = temporaryPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const photoUrl = portraitFromUpload(application.photoIdUrl);

  const created = await prisma.$transaction(async (tx) => {
    const studentNumber = await nextStudentNumber(tx);
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        name: application.fullName,
        profile: {
          create: {
            phone: application.phone,
            state: application.state,
            photoUrl,
          },
        },
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        studentNumber,
        programId: application.programId,
        photoUrl,
        applicationId: application.id,
        status: "ACTIVE",
      },
    });

    const chosen = application.courseId
      ? application.program.courses.filter((course) => course.id === application.courseId)
      : application.program.courses.slice(0, 1);
    if (chosen.length) {
      await tx.enrollment.createMany({
        data: chosen.map((course) => ({
          studentId: student.id,
          courseId: course.id,
          progress: 0,
        })),
      });
    }

    await tx.traineeRecord.create({ data: { studentId: student.id } });

    await tx.application.update({
      where: { id: application.id },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewerNote: null },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        email,
        title: "Admission approved",
        body: `Welcome to King Solomon Empowerment Initiative. Your student ID is ${studentNumber}. Sign in at the student portal with ${email}. Your temporary password was issued to the admissions office with this notice.`,
      },
    });

    return { studentNumber, email };
  });

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/students");
  revalidatePath("/");

  return {
    ok: true as const,
    studentNumber: created.studentNumber,
    email: created.email,
    password,
    message: "Approved. A student ID and learning portal account have been created.",
  };
}

export async function rejectApplication(applicationId: string, note: string) {
  const session = await requireSession(["ADMIN"]);
  if (!session) return { ok: false as const, message: "Only an administrator can update admissions." };

  const reason = note.trim();
  if (reason.length < 8) return { ok: false as const, message: "Add a short note explaining the decision." };

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) return { ok: false as const, message: "Application not found." };
  if (application.status === "APPROVED") {
    return { ok: false as const, message: "An approved admission cannot be rejected from this desk." };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED", reviewerNote: reason, reviewedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  return { ok: true as const, message: "Application marked as not admitted." };
}

export async function addStudentProgramme(studentId: string, courseId: string) {
  const session = await requireSession(["ADMIN"]);
  if (!session) return { ok: false as const, message: "Only an administrator can add a programme." };

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, program: true },
  });
  if (!student) return { ok: false as const, message: "Student not found." };

  const course = await prisma.course.findUnique({ where: { id: courseId }, include: { program: true } });
  if (!course) return { ok: false as const, message: "That programme is not on the catalogue." };

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
  });
  if (existing) return { ok: false as const, message: "This student is already taking that programme." };

  await prisma.enrollment.create({
    data: { studentId: student.id, courseId: course.id, progress: 0 },
  });
  await prisma.notification.create({
    data: {
      userId: student.userId,
      title: "Programme added",
      body: `${course.title} now runs beside ${student.program.name}. Each course unlocks on its own.`,
    },
  });

  revalidatePath(`/admin/records/${student.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assessments");
  return { ok: true as const, message: `${course.title} was added. It runs beside ${student.program.name}.` };
}

export async function resetStudentPassword(studentId: string) {
  const session = await requireSession(["ADMIN"]);
  if (!session) return { ok: false as const, message: "Only an administrator can reset a portal password." };

  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
  if (!student) return { ok: false as const, message: "Student not found." };

  const password = temporaryPassword();
  await prisma.user.update({
    where: { id: student.userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  await prisma.notification.create({
    data: {
      userId: student.userId,
      title: "Portal password reset",
      body: "The admissions office has reset your portal password. Collect the temporary password from them and keep it private.",
    },
  });

  revalidatePath("/dashboard");
  return { ok: true as const, email: student.user.email, password, message: "A new temporary password is ready." };
}
