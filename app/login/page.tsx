import Logo from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const msg = sp.error === "invalid_link"
    ? "That login link is invalid or has been revoked. Check your welcome email for the current link."
    : sp.error === "use_link"
    ? "The portal now uses personal login links. Check your welcome email, or contact your AllTheCalls admin."
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-dim">
            This portal uses a personal login link.
          </p>
          <div className="mt-6 rounded-xl border border-bg-edge bg-bg-panel/60 p-4 text-left text-sm text-ink-dim">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-violet/20 text-accent-violetSoft">
              📩
            </div>
            <div className="font-semibold text-ink">Check your welcome email</div>
            <div className="mt-1">
              Tap the &ldquo;Open My Portal&rdquo; button in your welcome email. The link
              keeps you signed in for 30 days.
            </div>
          </div>
          {msg && (
            <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {msg}
            </div>
          )}
          <div className="mt-6 text-xs text-ink-mute">
            Need help? <a href="mailto:hello@allthecalls.ai" className="text-accent-cyan hover:underline">hello@allthecalls.ai</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-ink-mute">
          AllTheCalls Portal · Powered by AllTheCalls.ai
        </p>
      </div>
    </main>
  );
}
