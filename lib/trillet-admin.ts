const BASE = "https://api.trillet.ai";

function authHeaders(): HeadersInit {
  const apiKey = process.env.TRILLET_API_KEY;
  const workspaceId = process.env.TRILLET_WORKSPACE_ID;
  if (!apiKey || !workspaceId) throw new Error("Trillet env vars missing");
  return {
    "x-api-key": apiKey,
    "x-workspace-id": workspaceId,
    "Content-Type": "application/json",
  };
}

export type TrilletFlow = {
  flowId: string;
  flowName: string;
  agentId: string;
  agentName: string;
};

type RawFlow = {
  _id?: string;
  name?: string;
  agent?: { _id?: string; name?: string };
};

export async function listFlows(): Promise<TrilletFlow[]> {
  const res = await fetch(`${BASE}/v1/api/call-flows`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Trillet ${res.status}`);
  const json = (await res.json()) as unknown;
  const arr: RawFlow[] = Array.isArray(json)
    ? (json as RawFlow[])
    : ((json as { flows?: RawFlow[]; data?: RawFlow[]; callFlows?: RawFlow[] })
        .flows ||
        (json as { data?: RawFlow[] }).data ||
        (json as { callFlows?: RawFlow[] }).callFlows ||
        []);
  return arr
    .filter((f) => f._id && f.agent?._id)
    .map((f) => ({
      flowId: f._id || "",
      flowName: f.name || "(unnamed flow)",
      agentId: f.agent?._id || "",
      agentName: f.agent?.name || "",
    }));
}
