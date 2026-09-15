import Link from "next/link";
import { Dumbbell } from "lucide-react";

export const metadata = { title: "Welcome — Personal OS" };

export default function WelcomePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const signInHref = searchParams?.next
    ? `/auth/sign-in?next=${encodeURIComponent(searchParams.next)}`
    : "/auth/sign-in";

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0f1117] px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(15,17,23,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="mb-3 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg">
            <Dumbbell size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Personal OS</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-white/50">
            Track workouts, nutrition, and goals — with suggested reps and weights that
            progress with you.
          </p>
        </div>

        <Link
          href={signInHref}
          className="mt-6 block w-full rounded-full bg-white/10 py-3 text-sm font-semibold text-white shadow transition hover:bg-white/20"
        >
          Get Started
        </Link>

        <p className="mt-5 text-[12px] leading-relaxed text-white/30">
          By continuing, you agree to the{" "}
          <Link href="/terms" className="text-white/50 underline underline-offset-2 hover:text-white/80">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-white/50 underline underline-offset-2 hover:text-white/80">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
