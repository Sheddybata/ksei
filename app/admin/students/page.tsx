import type { Metadata } from "next";
import { StudentRoster } from "@/components/admin/student-roster";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Students and ID cards" };

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: {
      user: { include: { grades: true } },
      program: true,
      enrollments: true,
    },
    orderBy: { studentNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="no-print">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Registry</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Students and identity cards</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Select one student or a whole cohort. Print the sheet, or export a PDF with the front and back of each card at portrait ID-1 size.
        </p>
      </header>
      <StudentRoster
        students={students.map((student) => {
          const progress = student.enrollments.length
            ? Math.round(student.enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / student.enrollments.length)
            : 0;
          const grade = student.user.grades.length
            ? Math.round(student.user.grades.reduce((sum, item) => sum + item.score, 0) / student.user.grades.length)
            : null;
          return {
            id: student.id,
            name: student.user.name,
            email: student.user.email,
            studentNumber: student.studentNumber,
            program: student.program.name,
            photoUrl: student.photoUrl,
            issueDate: student.issueDate.toISOString(),
            status: student.status,
            progress,
            grade,
          };
        })}
      />
    </div>
  );
}
