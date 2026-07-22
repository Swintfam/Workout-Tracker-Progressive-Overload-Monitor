import { getUserTargets } from "@/lib/targets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const targets = await getUserTargets();
    const response = NextResponse.json(targets ?? { exists: false });

    // If already onboarded, set the cookie server-side so middleware
    // reliably sees it on the very next request — no client-side race.
    if (targets?.onboarding_complete === true) {
      response.cookies.set("app_onboarded", "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: false,
      });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
