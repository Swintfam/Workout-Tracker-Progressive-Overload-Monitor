import { getUserTargets } from "@/lib/targets";
import { redirect } from "next/navigation";
import OnboardWizard from "./OnboardWizard";

/**
 * Server Component — runs on the server before any JS reaches the browser.
 * If the user already completed onboarding, redirect them through the
 * /api/claim-onboarded route, which sets the cookie and bounces to /.
 * No client-side fetch, no race condition.
 */
export default async function OnboardPage() {
  let alreadyOnboarded = false;

  try {
    const targets = await getUserTargets();
    alreadyOnboarded = targets?.onboarding_complete === true;
  } catch {
    // Can't read DB — fall through and show wizard
  }

  if (alreadyOnboarded) {
    redirect("/api/claim-onboarded");
  }

  return <OnboardWizard />;
}
