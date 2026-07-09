import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Dev: bypass entirely
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  // Check for Supabase session cookie directly — no network call needed.
  // @supabase/ssr stores the session as sb-[project-ref]-auth-token (chunked as .0, .1 etc.)
  const hasSession = request.cookies.getAll().some((c) =>
    c.name.startsWith("sb-ljbpbcjienthupeyzxhc-auth-token")
  );

  if (!hasSession && !isAuthRoute) {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && request.nextUrl.pathname === "/auth/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
