import type { Metadata } from "next";
import { AdmissionsDesk } from "@/components/admin/admissions-desk";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admissions" };

export default async function ApplicationsPage() {
  const [applications, programs] = await Promise.all([
    prisma.application.findMany({
      include: { program: true, course: true },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Admissions</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Applicant desk</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Approving a file creates the student ID in the form KSEI-year-0001, opens a learning account, enrols the student, and leaves a portal notification.
        </p>
      </header>
      <AdmissionsDesk
        programs={programs.map((program) => ({ id: program.id, name: program.name }))}
        applications={applications.map((application) => ({
          id: application.id,
          reference: application.reference,
          fullName: application.fullName,
          email: application.email,
          phone: application.phone,
          state: application.state,
          dateOfBirth: application.dateOfBirth,
          educationLevel: application.educationLevel,
          statement: application.statement,
          photoIdUrl: application.photoIdUrl,
          documentUrl: application.documentUrl,
          status: application.status as "PENDING" | "APPROVED" | "REJECTED",
          reviewerNote: application.reviewerNote,
          submittedAt: application.submittedAt.toISOString(),
          programName: application.program.name,
          programId: application.programId,
          courseTitle: application.course?.title ?? null,
        }))}
      />
    </div>
  );
}
