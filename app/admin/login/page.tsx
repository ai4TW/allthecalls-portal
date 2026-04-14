import Logo from "@/components/Logo";

export default async function AdminLoginPage({
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
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-violetSoft">
            Admin
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Master Portal</h1>
          <p className="mt-1 text-sm text-ink-dim">
            Manage client access links and welcome emails.
          </p>
          <form action="/api/admin/login" method="POST" className="mt-6 space-y-4">
            {sp.from && <input type="hidden" name="from" value={sp.from} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Admin password
              </label>
              <input
                type="password"
                name="password"
                required
                autoFocus
                autoComplete="current-password"
                className="input"
                placeholder="••••••••••"
              />
            </div>
            {sp.error === "invalid" && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                Incorrect admin password.
              </div>
            )}
            <button type="submit" className="btn-primary w-full">
              Enter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
