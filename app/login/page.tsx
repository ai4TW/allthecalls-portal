import Logo from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-dim">Access your AI receptionist mission control.</p>

          <form action="/api/login" method="POST" className="mt-6 space-y-4">
            {sp.from && <input type="hidden" name="from" value={sp.from} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
              />
            </div>
            {sp.error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {sp.error === "invalid"
                  ? "Wrong email or password."
                  : "Something went wrong. Please try again."}
              </div>
            )}
            <button type="submit" className="btn-primary w-full">
              Sign in
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-ink-mute">
          AllTheCalls Portal · Powered by AllTheCalls.ai
        </p>
      </div>
    </main>
  );
}
