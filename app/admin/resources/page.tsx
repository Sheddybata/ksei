import type { Metadata } from "next";
import { ResourceList } from "@/components/site/resource-list";

export const metadata: Metadata = { title: "Document library" };

export default function AdminResourcesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Library</p>
        <h1 className="mt-2 font-display text-5xl text-navy">Academy documents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">
          Trainer manuals, the Master Curriculum Framework, the Complete Assessment System, and the report on participant contact and admission letters.
        </p>
      </header>
      <ResourceList audience="staff" />
    </div>
  );
}
