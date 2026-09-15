import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Dev: skip auth entirely — no real Supabase session exists locally
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Build the base response. The Supabase client below may mutate it
  // (via setAll) to write refreshed auth cookies.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the incoming request object so the rest of this function
          // sees the updated cookies, then write them to the response so the
          // browser persists the refreshed token.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() is what triggers a token refresh when the access
  // token is expired. Must be called before any routing decisions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isWelcomeRoute = pathname.startsWith("/welcome");
  const isLegalRoute = pathname.startsWith("/terms") || pathname.startsWith("/privacy");
  const isPublicRoute = isAuthRoute || isWelcomeRoute || isLegalRoute;
  const isApiRoute = pathname.startsWith("/api");
  const isOnboardRoute = pathname.startsWith("/onboard");

  // Not logged in → send to welcome/sign-in
  if (!user && !isPublicRoute) {
    const url = new URL("/welcome", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in but still on sign-in / welcome → dashboard
  if (user && (pathname === "/auth/sign-in" || isWelcomeRoute)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged in but not onboarded → /onboard
  if (user && !isPublicRoute && !isOnboardRoute && !isApiRoute) {
    const hasOnboarded = request.cookies.has("app_onboarded");
    if (!hasOnboarded) {
      return NextResponse.redirect(new URL("/onboard", request.url));
    }
  }

  // Return the (potentially cookie-updated) response
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
