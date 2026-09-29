import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/site/login-form";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await getSession();
  if (session?.role === "STUDENT") redirect("/dashboard");
  if (session) redirect("/admin");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Portal</p>
          <h1 className="mt-3 font-display text-5xl text-navy">Sign in to learn, teach, or administer.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-charcoal/75">
            Students use the learning portal. Staff use the education management suite. Sample trainee records are for this portal only. They are not the participants named in the admission-letter report. The livelihood departments desk signs in with livelihood@ksei.org.ng and the instructor password.
          </p>
        </div>
        <div className="rounded-3xl border border-navy/10 bg-paper p-6 shadow-sm">
          <LoginForm next={searchParams.next} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
