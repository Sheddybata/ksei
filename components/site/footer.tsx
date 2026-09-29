import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark light />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ivory/80">
            Empowering Lives. Developing Leaders. Transforming Communities.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gold-soft">
            A subsidiary affiliate of the Dr. Isa El-Buba Foundation.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Visit</p>
          <div className="mt-3 space-y-2 text-sm">
            <Link href="/academy" className="block hover:text-gold-soft">
              EBOMI Kingdom Leadership Academy
            </Link>
            <Link href="/resources" className="block hover:text-gold-soft">
              Handbooks and calendars
            </Link>
            <Link href="/apply" className="block hover:text-gold-soft">
              Apply for admission
            </Link>
            <Link href="/login" className="block hover:text-gold-soft">
              Student and staff portal
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Contact</p>
          <p className="mt-3 text-sm leading-6">
            info@ksei.org.ng
            <br />
            ksei.org.ng
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs tracking-[0.18em] text-gold-soft">
        LEARN. LEAD. EMPOWER.
      </div>
    </footer>
  );
}
