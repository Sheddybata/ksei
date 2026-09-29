import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">404</p>
        <h1 className="mt-3 font-display text-5xl text-navy">This page is not on the campus map.</h1>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-semibold text-ivory">
          Return home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
