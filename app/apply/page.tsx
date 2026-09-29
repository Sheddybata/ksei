import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProgrammeCard } from "@/components/site/programme-card";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { departmentalModules, programmeImage, programmeSlug } from "@/lib/academy";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyPage({ searchParams }: { searchParams: { program?: string } }) {
  if (searchParams.program) redirect(`/apply/${searchParams.program}`);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Admissions</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Choose a programme</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal/75">
          Open the programme you want. Its application page shows that course only.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...departmentalModules].sort((a, b) => a.title.localeCompare(b.title)).map((program) => (
            <ProgrammeCard
              key={program.title}
              title={program.title}
              overview={program.overview}
              image={programmeImage(program.title)}
              applyHref={`/apply/${programmeSlug(program.title)}`}
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
