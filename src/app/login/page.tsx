import { signIn } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-background font-bold">
            N
          </div>
          <h1 className="text-lg font-semibold">Naeem&apos;s Dashboard</h1>
          <p className="text-sm text-muted">Sign in to continue</p>
        </div>

        <form action={signIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {searchParams?.error && (
            <p className="text-sm text-red-400">{searchParams.error}</p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-xl bg-accent py-2 text-sm font-medium text-background transition hover:bg-accent-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
