import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/site/apply-form";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { ProgrammeHero } from "@/components/site/programme-card";
import { departmentalModules, programmeImage } from "@/lib/academy";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const program = await prisma.program.findUnique({ where: { slug: params.slug } });
  return { title: program ? `Apply · ${program.name}` : "Apply" };
}

export default async function ApplyProgrammePage({ params }: { params: { slug: string } }) {
  const program = await prisma.program.findUnique({
    where: { slug: params.slug },
    include: { courses: { orderBy: { code: "asc" } } },
  });
  if (!program) notFound();

  const moduleCopy = departmentalModules.find((item) => item.title === program.name);

  return (
    <>
      <SiteHeader />
      <main>
        <ProgrammeHero title={program.name} overview={moduleCopy?.overview ?? program.description} image={programmeImage(program.name)} />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm leading-6 text-charcoal/75">
            This form is for {program.name} only. Training runs for one year: seven months in the classroom with daily practicals, then five months of industrial attachment.
          </p>
          <Link href="/apply" className="mt-3 inline-flex text-sm font-semibold text-teal-deep">
            Choose a different programme
          </Link>
          <div className="mt-8">
            <ApplyForm
              program={{
                id: program.id,
                name: program.name,
                slug: program.slug,
                summary: program.summary,
                courses: program.courses.map((course) => ({ id: course.id, title: course.title, code: course.code })),
              }}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
