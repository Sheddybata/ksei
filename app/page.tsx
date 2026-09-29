import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { academyMotto, academyVision, departmentalModules, programmeImage, programmeSlug } from "@/lib/academy";
import { outcomes, weekRhythm } from "@/lib/formation";
import { ProgrammeCard } from "@/components/site/programme-card";

const steps = [
  { title: "Commit", copy: "Apply to one programme and accept the year: devotion, practical work, community service and workplace attachment." },
  { title: "Learn", copy: "Seven months of classroom training, a trade, character formation and daily practical work." },
  { title: "Lead", copy: "Five months in a workplace, with a weekly report and a supervisor who knows the trainee’s conduct." },
  { title: "Empower", copy: "A certificate only when character and practical skill both hold, then follow-up after graduation." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">King Solomon Empowerment Initiative</p>
            <p className="mt-2 text-sm font-semibold text-navy">A subsidiary affiliate of the Dr. Isa El-Buba Foundation.</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-navy md:text-6xl">
              Empowering Lives. Developing Leaders. Transforming Communities.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-charcoal/80">
              EBOMI Kingdom Leadership Academy is a one-year programme for unemployed graduates, secondary school leavers, orphans and vulnerable young people. It forms Kingdom character, a real trade, leadership and enterprise. {academyMotto}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold tracking-[0.18em] text-navy">
              <span className="rounded-full border border-navy/15 px-3 py-2">LEARN</span>
              <span className="rounded-full border border-navy/15 px-3 py-2">LEAD</span>
              <span className="rounded-full border border-gold bg-gold/20 px-3 py-2">EMPOWER</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply" className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-navy-deep">
                Begin your application
              </Link>
              <Link href="/academy" className="rounded-full border border-navy/20 px-5 py-3 text-sm font-semibold text-navy">
                Read the academy
              </Link>
            </div>
          </div>
          <aside className="rounded-[2rem] bg-navy p-8 text-ivory shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">The work in view</p>
            <dl className="mt-6 space-y-5">
              {[
                ["120", "Enrolled students"],
                ["20", "Active courses"],
              ].map(([value, label]) => (
                <div key={label} className="border-b border-white/10 pb-4">
                  <dt className="text-sm text-ivory/70">{label}</dt>
                  <dd className="font-display text-5xl">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm leading-6 text-ivory/75">ksei.org.ng · info@ksei.org.ng</p>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-deep">Leadership</p>
          <h2 className="mt-2 font-display text-4xl text-navy">The people who carry this work</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "Chairman & Founder", name: "Prophet Dr. Isa El-Buba Sadiq", image: "/prophetisa.jpg", fit: "object-cover object-top" },
              { title: "Executive Director", name: "Mrs. Deborah El-Buba Atubi", image: "/deborah.png", fit: "object-contain object-center" },
              { title: "Administrator/General Manager", name: "Dr. Juliet Ebine", image: "/drjuliet.png", fit: "object-cover object-top" },
            ].map((leader) => (
              <article key={leader.name} className="overflow-hidden rounded-3xl border border-navy/10 bg-paper">
                <div className="flex h-80 items-center justify-center bg-ivory">
                  <img src={leader.image} alt={leader.name} className={`h-full w-full ${leader.fit}`} />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">{leader.title}</p>
                  <h3 className="mt-2 font-display text-3xl leading-tight text-navy">{leader.name}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="programs" className="bg-paper py-16">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-deep">20 programmes</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl text-navy">Each programme stands on its own.</h2>
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-deep">Who the year is raising</p>
          <h2 className="mt-2 max-w-2xl font-display text-4xl text-navy">Raised to serve, trained to build, sent to lead.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {outcomes.map(([title, copy]) => (
              <article key={title} className="rounded-3xl border border-navy/10 bg-paper p-5">
                <h3 className="font-display text-2xl text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/75">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-navy py-16 text-ivory">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">A day in the academy</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl">Devotion, class, practical work, and evening account.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ivory/75">
              Taken from the Full Weekly Timetable. The first seven months follow this rhythm. The last five months move the same discipline into a workplace.
            </p>
            <ol className="mt-8 grid gap-3 md:grid-cols-2">
              {weekRhythm.map(([time, activity]) => (
                <li key={time} className="flex gap-4 rounded-2xl border border-white/10 px-4 py-3">
                  <span className="w-32 shrink-0 text-sm font-semibold text-gold">{time}</span>
                  <span className="text-sm leading-6">{activity}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pathway" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-4xl text-navy">From application to learning, leading and empowering</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-3xl bg-navy p-5 text-ivory">
                <span className="font-display text-3xl text-gold">0{index + 1}</span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory/75">{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-navy/10 bg-[#F3E7C3]">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <p className="max-w-3xl font-display text-3xl leading-snug text-navy md:text-4xl">{academyVision}</p>
            <Link href="/apply" className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-ivory">
              Start an application
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
