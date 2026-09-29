import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE, readSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE)?.value;
  const session = token ? await readSession(token) : null;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === "STUDENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (
      session.role === "INSTRUCTOR" &&
      (pathname === "/admin" ||
        pathname.startsWith("/admin/applications") ||
        pathname.startsWith("/admin/students"))
    ) {
      return NextResponse.redirect(new URL("/admin/courses", request.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/dashboard", "/dashboard/:path*"],
};
