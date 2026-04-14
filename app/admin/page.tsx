import { headers } from "next/headers";
import Logo from "@/components/Logo";
import { listUsers, type PortalUser } from "@/lib/users";
import { listFlows, type TrilletFlow } from "@/lib/trillet-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<{
  error?: string;
  created?: string;
  deleted?: string;
  sent?: string;
}>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const hdrs = await headers();
  const host = hdrs.get("host") || "app.allthecalls.ai";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  let users: PortalUser[] = [];
  let flows: TrilletFlow[] = [];
  let loadError: string | null = null;
  try {
    [users, flows] = await Promise.all([listUsers(), listFlows()]);
  } catch (e) {
    loadError = (e as Error).message;
  }

  const usersByAgent = new Map(users.map((u) => [u.agentId, u]));
  const orphans = flows.filter((f) => !usersByAgent.has(f.agentId));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent-violetSoft">
              Admin
            </div>
            <div className="font-display text-lg font-semibold text-ink">Master Portal</div>
          </div>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button className="btn-ghost">Sign out</button>
        </form>
      </header>

      {loadError && (
        <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
          <div className="font-semibold">Couldn&apos;t load data</div>
          <div className="mt-1 text-xs">{loadError}</div>
          <div className="mt-2 text-xs text-ink-dim">
            Did you run the <code className="font-mono">supabase/migrations/001_portal_users.sql</code>{" "}
            migration in Supabase SQL editor?
          </div>
        </div>
      )}

      <FlashBanner sp={sp} />

      {/* ADD NEW CLIENT */}
      <section className="card mb-6 p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Add a client login</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Pick the Trillet call flow. Portal generates a personal login URL you can email from here.
        </p>
        <form action="/api/admin/provision" method="POST" className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Client email
            </label>
            <input type="email" name="email" required className="input" placeholder="kenny@lonestar.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Display name
            </label>
            <input type="text" name="name" required className="input" placeholder="Ria · Lonestar Key Properties" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Trillet call flow
            </label>
            <select
              name="_flow_select"
              required
              defaultValue=""
              className="input"
              onChange={undefined}
            >
              <option value="" disabled>— Pick a flow —</option>
              {flows.map((f) => (
                <option key={f.flowId} value={`${f.agentId}::${f.flowId}`}>
                  {f.flowName} · {f.agentName}
                </option>
              ))}
            </select>
            <input type="hidden" name="agentId" />
            <input type="hidden" name="flowId" />
            <p className="mt-1 text-xs text-ink-mute">
              {flows.length} flow{flows.length === 1 ? "" : "s"} in your Trillet workspace.
            </p>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary w-full md:w-auto">
              Generate login URL
            </button>
          </div>
        </form>
        {/* Tiny inline script to pipe the dropdown into agentId/flowId hidden inputs before submit. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var sel=document.querySelector('select[name="_flow_select"]');
                if(!sel) return;
                var form=sel.form;
                form.addEventListener('submit', function(){
                  var v=sel.value||'';
                  var parts=v.split('::');
                  form.querySelector('input[name="agentId"]').value=parts[0]||'';
                  form.querySelector('input[name="flowId"]').value=parts[1]||'';
                });
              })();
            `,
          }}
        />
      </section>

      {/* TRILLET FLOWS WITHOUT A LOGIN (orphans) */}
      {orphans.length > 0 && (
        <section className="card mb-6 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Flows without a login
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            These Trillet call flows exist but no client can see them yet.
          </p>
          <div className="mt-4 space-y-2">
            {orphans.map((f) => (
              <div
                key={f.flowId}
                className="flex items-center justify-between gap-3 rounded-xl border border-bg-edge bg-bg-panel/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{f.flowName}</div>
                  <div className="text-xs text-ink-mute">
                    {f.agentName} · {f.agentId}
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  No login
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVE LOGINS */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-bg-edge px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">Active logins</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
            {users.length} total
          </span>
        </div>
        {users.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-dim">
            No portal users yet. Add one above.
          </div>
        ) : (
          <div className="divide-y divide-bg-edge">
            {users.map((u) => {
              const accessUrl = `${origin}/access/${u.accessToken}`;
              const flow = flows.find((f) => f.agentId === u.agentId);
              return (
                <div key={u.id} className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-lg font-semibold text-ink">{u.name}</div>
                      <div className="text-sm text-ink-dim">{u.email}</div>
                      <div className="mt-1 text-xs text-ink-mute">
                        {flow ? `${flow.flowName} · ` : ""}agent {u.agentId}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action="/api/admin/send-email" method="POST">
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn-primary text-sm">Send welcome email</button>
                      </form>
                      <form
                        action="/api/admin/delete"
                        method="POST"
                        onSubmit={undefined}
                      >
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          className="btn-ghost text-sm text-rose-300 hover:text-rose-200"
                          type="submit"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                      Personal access URL
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={accessUrl}
                      onClick={undefined}
                      className="input font-mono text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-ink-mute">
        Deleting a login revokes their access immediately.
      </p>
    </main>
  );
}

function FlashBanner({
  sp,
}: {
  sp: { error?: string; created?: string; deleted?: string; sent?: string };
}) {
  if (sp.created) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        ✅ Login created. Copy the access URL or click &ldquo;Send welcome email&rdquo;.
      </div>
    );
  }
  if (sp.deleted) {
    return (
      <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
        Login deleted. That access URL no longer works.
      </div>
    );
  }
  if (sp.sent) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        📧 Welcome email sent to {decodeURIComponent(sp.sent)}.
      </div>
    );
  }
  if (sp.error) {
    return (
      <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
        {decodeURIComponent(sp.error)}
      </div>
    );
  }
  return null;
}
