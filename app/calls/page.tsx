import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listCallsForAgent } from "@/lib/trillet";
import Nav from "@/components/Nav";
import CallList from "@/components/CallList";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CallsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let calls = [] as Awaited<ReturnType<typeof listCallsForAgent>>;
  let error: string | null = null;
  try {
    calls = await listCallsForAgent(session.agentId, session.flowId, 200);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <Nav session={session} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">All Calls</h1>
              <AutoRefresh intervalMs={8000} />
            </div>
            <p className="mt-1 text-sm text-ink-dim">
              {calls.length} call{calls.length === 1 ? "" : "s"} for {session.name}
            </p>
          </div>
          <a href="/api/export?transcripts=1&analysis=1" className="btn-primary text-sm">
            Export CSV
          </a>
        </div>

        {error ? (
          <div className="card p-6 text-rose-300">
            <div className="font-semibold">Couldn&apos;t load calls</div>
            <div className="mt-1 text-sm text-ink-dim">{error}</div>
          </div>
        ) : (
          <CallList calls={calls} />
        )}
      </main>
    </>
  );
}
