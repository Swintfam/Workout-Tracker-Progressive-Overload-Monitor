import Link from "next/link";

export const metadata = { title: "Terms of Service — Personal OS" };

const LAST_UPDATED = "September 14, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-[#0f1117] px-4 py-14 text-white/80">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/welcome"
          className="mb-8 inline-block text-[13px] text-white/40 underline underline-offset-2 transition hover:text-white/70"
        >
          ← Back
        </Link>

        <h1 className="mb-1 text-2xl font-bold text-white">Terms of Service</h1>
        <p className="mb-8 text-[13px] text-white/40">Last updated {LAST_UPDATED}</p>

        <div className="flex flex-col gap-6 text-[14px] leading-relaxed">
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white/50">
            This is a template drafted for a small, personally-operated fitness app. It is not a
            substitute for advice from a licensed attorney — have one review it before relying on
            it for a public or commercial launch.
          </p>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Personal OS (&quot;the App&quot;), you agree to
              these Terms of Service and the accompanying Privacy Policy. If you do not agree,
              do not create an account or use the App.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">2. What the App Is</h2>
            <p>
              Personal OS is a personal workout, nutrition, and progress-tracking tool. It lets
              you log workouts and meals, set and track goals, view suggested reps/weights for
              progressive overload, and record mental-health check-ins. It is a self-tracking
              tool, not a medical device or clinical service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">3. Not Medical or Nutritional Advice</h2>
            <p>
              Nothing in the App — including suggested reps, weights, workouts, or nutrition
              targets — is medical, dietary, or fitness advice from a licensed professional.
              Exercise and nutrition carry inherent risk. Consult a physician or qualified
              professional before beginning any new exercise or nutrition program, especially if
              you have a pre-existing condition. You use the App, and act on anything it
              suggests, at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">4. Accounts</h2>
            <p>
              You&apos;re responsible for the accuracy of the information you provide and for
              keeping your login credentials secure. You must be at least 13 years old to create
              an account. Notify us if you believe your account has been accessed without your
              permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">5. Your Content</h2>
            <p>
              You retain ownership of the workout logs, meal entries, goals, notes, and
              check-ins you enter (&quot;Your Content&quot;). You grant the App the limited right
              to store and process Your Content solely to provide the App&apos;s features back to
              you — it is not sold or used to train third-party models.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">6. Acceptable Use</h2>
            <p>
              Don&apos;t use the App to store or transmit unlawful content, attempt to access
              another user&apos;s data, interfere with the App&apos;s operation, or reverse
              engineer it beyond what applicable law permits.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">7. Availability</h2>
            <p>
              The App is provided on an &quot;as is&quot; and &quot;as available&quot; basis, with
              no uptime guarantee. Features, including AI-generated content such as exercise
              illustrations, may change or be removed at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, the App and its operator are not liable
              for any injury, loss, or damage arising from your use of the App, including
              reliance on suggested workouts, weights, or nutrition targets.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">9. Termination</h2>
            <p>
              You may stop using the App and request deletion of your account and data at any
              time. We may suspend or terminate access for misuse of the App.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">10. Changes to These Terms</h2>
            <p>
              These Terms may be updated as the App changes. Continued use after an update means
              you accept the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-white">11. Contact</h2>
            <p>Questions about these Terms can be sent to the App&apos;s operator directly.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
