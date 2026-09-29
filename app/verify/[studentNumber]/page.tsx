import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { Badge, statusTone } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { studentNumber: string } }): Promise<Metadata> {
  return { title: `Verify ${params.studentNumber}` };
}

export default async function VerifyPage({ params }: { params: { studentNumber: string } }) {
  const student = await prisma.student.findUnique({
    where: { studentNumber: params.studentNumber },
    include: { user: true, program: true },
  });
  if (!student) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Credential check</p>
        <h1 className="mt-3 font-display text-5xl text-navy">{student.user.name}</h1>
        <p className="mt-2 font-semibold tracking-wide text-navy">{student.studentNumber}</p>
        <p className="mt-4 text-sm text-charcoal/80">{student.program.name}</p>
        <div className="mt-4">
          <Badge tone={statusTone(student.status)}>{student.status === "ACTIVE" ? "Valid student credential" : student.status}</Badge>
        </div>
        <p className="mt-6 text-sm leading-6 text-charcoal/70">
          This page confirms a King Solomon Empowerment Initiative student identity card. It does not display contact details.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-teal-deep">
          Back to ksei.org.ng
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
