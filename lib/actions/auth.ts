"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, isRole, signSession, type Role } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function destination(role: Role, next: string | null) {
  if (role === "STUDENT") return next?.startsWith("/dashboard") ? next : "/dashboard";
  if (next?.startsWith("/admin")) return next;
  return "/admin";
}

export async function login(input: { email: string; password: string; next?: string | null }) {
  const email = input.email.toLowerCase().trim();
  const password = input.password;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)) || !isRole(user.role)) {
    return { ok: false as const, message: "Those credentials were not recognised." };
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true as const, redirectTo: destination(user.role, input.next ?? null) };
}

export async function logout() {
  cookies().delete(COOKIE);
  redirect("/");
}
