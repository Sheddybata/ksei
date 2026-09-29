import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { getSession } from "@/lib/session";

const links = [
  { href: "/academy", label: "Academy" },
  { href: "/resources", label: "Resources" },
  { href: "/apply", label: "Apply" },
];

export async function SiteHeader() {
  const session = await getSession();
  const portal = session?.role === "STUDENT" ? "/dashboard" : session ? "/admin" : "/login";

  return (
    <header className="no-print sticky top-0 z-40 border-b border-navy/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="KSEI home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-navy md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-teal-deep">
              {link.label}
            </Link>
          ))}
          <Link href={portal} className="rounded-full bg-navy px-4 py-2 text-ivory hover:bg-navy-mid">
            {session ? "Open portal" : "Sign in"}
          </Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-navy/15 px-3 py-2 text-sm font-semibold text-navy">
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-navy/10 bg-paper p-3 shadow-card">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2 text-sm font-semibold text-navy hover:bg-ivory">
                {link.label}
              </Link>
            ))}
            <Link href={portal} className="mt-1 block rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-ivory">
              {session ? "Open portal" : "Sign in"}
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
