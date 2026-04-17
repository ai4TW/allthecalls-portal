import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { listCallsForAgent } from "@/lib/trillet";
import Nav from "@/components/Nav";
import StatsBar from "@/components/StatsBar";
import CallList from "@/components/CallList";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let calls = [] as Awaited<ReturnType<typeof listCallsForAgent>>;
  let error: string | null = null;
  try {
    calls = await listCallsForAgent(session.agentId, session.flowId, 100);
  } catch (e) {
    error = (e as Error).message;
  }

  const recent = calls.slice(0, 10);

  return (
    <>
      <Nav session={session} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
              <span className="gradient-text">{session.name}</span>
            </h1>
            <p className="mt-1 text-sm text-ink-dim">
              Live call history from your AI receptionist.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/calls" className="btn-ghost">All calls</Link>
            <a href="/api/export?transcripts=1&analysis=1" className="btn-primary text-sm">
              Export CSV
            </a>
          </div>
        </div>

        <StatsBar calls={calls} />

        <div className="mt-8 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-ink">Recent calls</h2>
            <AutoRefresh intervalMs={8000} />
          </div>
          <Link href="/calls" className="text-sm font-medium text-accent-cyan hover:underline">
            View all →
          </Link>
        </div>

        {error ? (
          <div className="card p-6 text-rose-300">
            <div className="font-semibold">Couldn&apos;t load calls</div>
            <div className="mt-1 text-sm text-ink-dim">{error}</div>
          </div>
        ) : (
          <CallList calls={recent} />
        )}
      </main>
    </>
  );
}
