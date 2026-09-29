import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/site/apply-form";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { ProgrammeHero } from "@/components/site/programme-card";
import { departmentalModules, programmeImage, programmeSlug } from "@/lib/academy";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function findProgram(slug: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await prisma.program.findUnique({
      where: { slug },
      include: { courses: { orderBy: { code: "asc" } } },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const program = await findProgram(params.slug);
  const listed = departmentalModules.find((item) => programmeSlug(item.title) === params.slug);
  const name = program?.name ?? listed?.title;
  return { title: name ? `Apply · ${name}` : "Apply" };
}

export default async function ApplyProgrammePage({ params }: { params: { slug: string } }) {
  const program = await findProgram(params.slug);
  const listed = departmentalModules.find((item) => programmeSlug(item.title) === params.slug);
  if (!program && !listed) notFound();

  const moduleCopy = departmentalModules.find((item) => item.title === (program?.name ?? listed?.title));
  const title = program?.name ?? listed!.title;

  return (
    <>
      <SiteHeader />
      <main>
        <ProgrammeHero title={title} overview={moduleCopy?.overview ?? program?.description ?? ""} image={programmeImage(title)} />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm leading-6 text-charcoal/75">
            This form is for {title} only. Training runs for one year: seven months in the classroom with daily practicals, then five months of industrial attachment.
          </p>
          <Link href="/apply" className="mt-3 inline-flex text-sm font-semibold text-teal-deep">
            Choose a different programme
          </Link>
          <div className="mt-8">
            {program ? (
              <ApplyForm
                program={{
                  id: program.id,
                  name: program.name,
                  slug: program.slug,
                  summary: program.summary,
                  courses: program.courses.map((course) => ({ id: course.id, title: course.title, code: course.code })),
                }}
              />
            ) : (
              <div className="rounded-3xl border border-navy/10 bg-paper p-8">
                <p className="text-sm leading-6 text-charcoal/80">
                  Online applications for {title} are not being recorded yet. Write to info@ksei.org.ng and name this programme.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
