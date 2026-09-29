import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/shells";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role === "STUDENT") redirect("/dashboard");
  return (
    <AdminShell role={session.role} name={session.name}>
      {children}
    </AdminShell>
  );
}
