import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { academyMotto, academyVision, assessmentWeights, departmentalModules, months, programmeImage, programmeSlug } from "@/lib/academy";
import { ProgrammeCard } from "@/components/site/programme-card";

export const metadata: Metadata = { title: "EBOMI Kingdom Leadership Academy" };

export default function AcademyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Master Curriculum Framework</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl text-navy">EBOMI Kingdom Leadership Academy</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-charcoal/80">{academyVision}</p>
        <p className="mt-3 text-sm font-semibold tracking-[0.14em] text-navy">{academyMotto}</p>
        <p className="mt-3 text-sm font-semibold text-navy">
          King Solomon Empowerment Initiative is a subsidiary affiliate of the Dr. Isa El-Buba Foundation.
        </p>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-charcoal/75">
          The programme runs for one year. Phase one is seven months of classroom training with daily practicals. Phase two is five months of industrial attachment. The four outcomes named in the framework are Kingdom character, professional competence, leadership capacity and entrepreneurial ability.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-3xl text-navy">Twenty programmes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[...departmentalModules].sort((a, b) => a.title.localeCompare(b.title)).map((program, index) => (
              <ProgrammeCard
                key={program.title}
                title={program.title}
                overview={program.overview}
                image={programmeImage(program.title)}
                applyHref={`/apply/${programmeSlug(program.title)}`}
                documentHref={encodeURI(program.file)}
                kicker={`Programme ${index + 1} of 20`}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl text-navy">One-year calendar</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            {months.map((item) => (
              <li key={item.month} className="rounded-2xl bg-ivory-deep px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-deep">
                  Month {item.month} · {item.phase}
                </p>
                <p className="mt-1 font-semibold text-navy">{item.title}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl text-navy">Graduation assessment</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/75">
            These weights are from the Complete Assessment System. Character and integrity carry the same weight as practical and technical skills. A trainee needs at least 50 percent overall, at least 50 percent in character and integrity, and at least 50 percent in practical and technical skills, together with community service, industrial attachment, and the required portfolio, logbook and reports.
          </p>
          <dl className="mt-6 max-w-xl space-y-2">
            {assessmentWeights.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-navy/10 py-2 text-sm">
                <dt>{label}</dt>
                <dd className="font-semibold text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
