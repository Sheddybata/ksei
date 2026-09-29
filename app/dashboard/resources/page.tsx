import type { Metadata } from "next";
import { ResourceList } from "@/components/site/resource-list";

export const metadata: Metadata = { title: "Handbooks" };

export default function StudentResourcesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Reading</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl text-navy">Handbooks and calendars</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Read the Student Handbook, keep the academic calendar, and use the attachment, community service, portfolio and certification documents for your year.
        </p>
      </header>
      <ResourceList audience="student" />
    </div>
  );
}
