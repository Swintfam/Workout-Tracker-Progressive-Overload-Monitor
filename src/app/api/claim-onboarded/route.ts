import { getUserTargets } from "@/lib/targets";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sets the app_onboarded cookie and redirects to the dashboard.
 * Called server-side from the /onboard page when the DB confirms
 * the user already completed onboarding. Doing this in a Route Handler
 * (not a Server Component) is the only way to set cookies + redirect
 * in the same response in Next.js App Router.
 */
export async function GET(request: NextRequest) {
  try {
    const targets = await getUserTargets();

    if (targets?.onboarding_complete === true) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.set("app_onboarded", "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: false,
      });
      return response;
    }
  } catch {
    // Fall through — send back to onboard
  }

  // Not onboarded or DB error — back to wizard
  return NextResponse.redirect(new URL("/onboard", request.url));
}
