import type { Metadata } from "next";
import { StudentIdCard } from "@/components/id-card/student-card";
import { PrintButton } from "@/components/print-button";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Digital ID" };

export default async function IdCardPage() {
  const session = await getSession();
  if (!session) return null;
  const student = await prisma.student.findUnique({
    where: { userId: session.sub },
    include: { user: true, program: true },
  });
  if (!student) return null;

  const card = {
    id: student.id,
    name: student.user.name,
    studentNumber: student.studentNumber,
    program: student.program.name,
    photoUrl: student.photoUrl,
    issueDate: student.issueDate.toISOString(),
    status: student.status,
  };

  return (
    <div className="space-y-6">
      <header className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Identity</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">Digital student card</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-charcoal/70">
            Show this card when you are asked for your KSEI identity. The code on the front opens a public verification page. The back says where a found card should be returned.
          </p>
        </div>
        <PrintButton />
      </header>
      <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="id-frame">
          <StudentIdCard student={card} side="front" />
        </div>
        <div className="id-frame">
          <StudentIdCard student={card} side="back" />
        </div>
      </div>
    </div>
  );
}
