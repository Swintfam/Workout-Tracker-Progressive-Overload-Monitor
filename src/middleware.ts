import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Dev: bypass entirely
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isOnboardRoute = pathname.startsWith("/onboard");
  const isApiRoute = pathname.startsWith("/api");

  // Check for Supabase session cookie directly — no network call needed.
  // @supabase/ssr stores the session as sb-[project-ref]-auth-token (chunked as .0, .1 etc.)
  const hasSession = request.cookies.getAll().some((c) =>
    c.name.startsWith("sb-ljbpbcjienthupeyzxhc-auth-token")
  );

  // Not logged in → sign-in page
  if (!hasSession && !isAuthRoute) {
    const url = new URL("/auth/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in but on sign-in page → dashboard
  if (hasSession && pathname === "/auth/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged in but hasn't completed onboarding → /onboard
  // Skip check for auth routes, onboard itself, and API routes
  if (hasSession && !isAuthRoute && !isOnboardRoute && !isApiRoute) {
    const hasOnboarded = request.cookies.has("app_onboarded");
    if (!hasOnboarded) {
      return NextResponse.redirect(new URL("/onboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
