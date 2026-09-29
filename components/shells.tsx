"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { BookOpen, ClipboardList, IdCard, LayoutDashboard, Library, PenLine, ScrollText } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { logout } from "@/lib/actions/auth";
import type { Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/applications", label: "Admissions", icon: ClipboardList, adminOnly: true },
  { href: "/admin/students", label: "Students & IDs", icon: IdCard, adminOnly: true },
  { href: "/admin/records", label: "Year record", icon: ScrollText },
  { href: "/admin/courses", label: "Programmes", icon: Library },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
];

export function AdminShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const visible = links.filter((link) => role === "ADMIN" || !link.adminOnly);

  return (
    <div className="min-h-screen bg-ivory md:grid md:grid-cols-[250px_1fr]">
      <aside className="no-print hidden border-r border-navy/10 bg-navy text-ivory md:flex md:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/">
            <Wordmark light />
          </Link>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Education management</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visible.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold",
                  active ? "bg-white/10 text-gold-soft" : "text-ivory/80 hover:bg-white/5",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-gold">{role}</p>
          <form action={logout} className="mt-3">
            <button className="text-sm font-semibold text-ivory/80 hover:text-white" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="print-area">
        <div className="no-print flex items-center gap-2 overflow-x-auto border-b border-navy/10 bg-paper px-3 py-3 md:hidden">
          {visible.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-ivory">
              {link.label}
            </Link>
          ))}
          <form action={logout}>
            <button className="whitespace-nowrap rounded-full border border-navy/20 px-3 py-1.5 text-xs font-semibold text-navy" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}

export function StudentShell({ name, children }: { name: string; children: ReactNode }) {
  const pathname = usePathname();
  const activeLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [pathname]);
  const links = [
    { href: "/dashboard", label: "My course", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/assessments", label: "Tests", icon: ClipboardList },
    { href: "/dashboard/formation", label: "Formation", icon: PenLine },
    { href: "/dashboard/record", label: "Record", icon: ScrollText },
    { href: "/dashboard/readiness", label: "Readiness", icon: ClipboardList },
    { href: "/dashboard/resources", label: "Handbooks", icon: Library },
    { href: "/dashboard/id-card", label: "ID", icon: IdCard },
  ];

  return (
    <div className="min-h-screen bg-ivory">
      <header className="no-print sticky top-0 z-40 border-b border-navy/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="min-w-0">
              <Wordmark compact />
            </Link>
            <p className="sr-only">{name}</p>
            <form action={logout} className="shrink-0">
              <button className="rounded-full px-3 py-2 text-sm font-semibold text-navy/70" type="submit">
                Sign out
              </button>
            </form>
          </div>
          <nav className="nav-scroll -mx-4 mt-2 flex gap-1 overflow-x-auto px-4 pb-3">
            {links.map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname.startsWith("/dashboard/courses")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={active ? activeLink : undefined}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold",
                    active ? "bg-navy text-ivory" : "text-navy hover:bg-ivory-deep",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
