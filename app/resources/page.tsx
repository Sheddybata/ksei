import type { Metadata } from "next";
import { ResourceList } from "@/components/site/resource-list";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export const metadata: Metadata = { title: "Handbooks and calendars" };

export default function ResourcesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Documents</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Handbooks and calendars</h1>
        <p className="mt-3 text-sm leading-6 text-charcoal/75">
          These are the trainee documents supplied for the academy. Trainer manuals, the assessment system, and the admission-letter report are in the staff library.
        </p>
        <div className="mt-8">
          <ResourceList audience="student" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
