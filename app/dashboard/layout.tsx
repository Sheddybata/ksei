import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/shells";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  if (session.role !== "STUDENT") redirect("/admin");
  return <StudentShell name={session.name}>{children}</StudentShell>;
}
