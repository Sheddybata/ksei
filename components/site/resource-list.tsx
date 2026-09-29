import Link from "next/link";
import { academyResources, resourceHref } from "@/lib/academy";

export function ResourceList({ audience }: { audience: "student" | "staff" | "all" }) {
  const items = academyResources.filter((item) => audience === "all" || item.audience === audience || (audience === "staff" && item.audience === "student"));
  return (
    <ul className="divide-y divide-navy/10 rounded-3xl border border-navy/10 bg-paper">
      {items.map((item) => (
        <li key={item.file} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="font-semibold text-navy">{item.title}</p>
            <p className="text-xs uppercase tracking-[0.14em] text-charcoal/50">{item.audience === "staff" ? "Staff" : "Trainee"}</p>
          </div>
          <Link href={resourceHref(item.file)} className="text-sm font-semibold text-teal-deep">
            Download
          </Link>
        </li>
      ))}
    </ul>
  );
}
