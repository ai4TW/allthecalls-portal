export type PortalUser = {
  email: string;
  password: string;
  agentId: string;
  flowId: string;
  name: string;
};

/**
 * Load the portal user directory.
 *
 * Source of truth is the `USERS_JSON` env var — a JSON array of user objects.
 * Falls back to the legacy `DEMO_*` env vars so older deployments keep working.
 *
 * Example USERS_JSON:
 * [
 *   {"email":"brayden@allthecalls.ai","password":"xxx","agentId":"...","flowId":"...","name":"Gia · AllTheCalls"},
 *   {"email":"brayden@nextlevelacq.com","password":"yyy","agentId":"...","flowId":"...","name":"Gia · Next Level ACQ"}
 * ]
 */
export function loadUsers(): PortalUser[] {
  const raw = process.env.USERS_JSON;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return arr
          .filter(
            (u): u is PortalUser =>
              u &&
              typeof u.email === "string" &&
              typeof u.password === "string" &&
              typeof u.agentId === "string",
          )
          .map((u) => ({
            email: u.email.trim().toLowerCase(),
            password: u.password,
            agentId: u.agentId,
            flowId: u.flowId || "",
            name: u.name || u.email,
          }));
      }
    } catch (e) {
      console.error("[users] Failed to parse USERS_JSON:", (e as Error).message);
    }
  }

  // Legacy fallback — single DEMO_* user
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD;
  const agentId = process.env.DEMO_AGENT_ID;
  if (email && password && agentId) {
    return [
      {
        email,
        password,
        agentId,
        flowId: process.env.DEMO_FLOW_ID || "",
        name: process.env.DEMO_CLIENT_NAME || email,
      },
    ];
  }

  return [];
}

export function findUser(email: string, password: string): PortalUser | null {
  const target = email.trim().toLowerCase();
  const users = loadUsers();
  const match = users.find((u) => u.email === target && u.password === password);
  return match || null;
}
