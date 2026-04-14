const BASE = "https://api.trillet.ai";

function authHeaders(): HeadersInit {
  const apiKey = process.env.TRILLET_API_KEY;
  const workspaceId = process.env.TRILLET_WORKSPACE_ID;
  if (!apiKey || !workspaceId) {
    throw new Error("TRILLET_API_KEY and TRILLET_WORKSPACE_ID must be set");
  }
  return {
    "x-api-key": apiKey,
    "x-workspace-id": workspaceId,
    "Content-Type": "application/json",
  };
}

export type Call = {
  id: string;
  callId?: string;
  from?: string;
  to?: string;
  direction?: string;
  status?: string;
  duration?: number;
  startedAt?: string;
  createdAt?: string;
  endedAt?: string;
  agentId?: string;
  flowId?: string;
  flowName?: string;
  cost?: number;
  summary?: string;
  recordingUrl?: string;
  transcript?: Array<{ role: string; text: string; at?: string }> | string;
  variables?: Record<string, unknown>;
  raw?: Record<string, unknown>;
};

function pickArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    for (const k of ["calls", "data", "items", "results", "history", "callHistory"]) {
      if (Array.isArray(o[k])) return o[k] as unknown[];
    }
  }
  return [];
}

function normalizeCall(raw: Record<string, unknown>): Call {
  const get = (k: string) => raw[k] as string | undefined;
  return {
    id: (get("id") || get("callId") || get("_id") || "") as string,
    callId: get("callId") || (get("id") as string),
    from: get("from") || get("fromNumber") || get("caller"),
    to: get("to") || get("toNumber") || get("callee"),
    direction: get("direction"),
    status: get("status"),
    duration: typeof raw.duration === "number" ? raw.duration : Number(raw.duration) || 0,
    startedAt: get("startedAt") || get("startTime") || get("createdAt"),
    createdAt: get("createdAt"),
    endedAt: get("endedAt") || get("endTime"),
    agentId: get("agentId") || get("callAgentId"),
    flowId: get("flowId") || get("pathwayId") || get("callFlowId"),
    flowName: get("flowName") || get("pathway"),
    cost: typeof raw.cost === "number" ? raw.cost : Number(raw.cost) || 0,
    summary: get("summary") || get("postCallSummary"),
    recordingUrl: get("recordingUrl") || get("recording_url") || get("audioUrl"),
    transcript: (raw.transcript ?? raw.messages) as Call["transcript"],
    variables: (raw.variables as Record<string, unknown>) ?? undefined,
    raw,
  };
}

async function tryGet(url: string): Promise<Call[]> {
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (res.status === 500) return []; // Trillet returns 500 on zero results
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Trillet ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const arr = pickArray(json);
  return arr.map((r) => normalizeCall(r as Record<string, unknown>));
}

/**
 * Fetch call history filtered to a specific Trillet voice agent.
 * Tries multiple Trillet param shapes since their docs are inconsistent.
 */
export async function listCallsForAgent(
  agentId: string,
  flowId?: string,
  limit = 100,
): Promise<Call[]> {
  const attempts = [
    `${BASE}/v1/api/call-history?agentId=${agentId}&limit=${limit}`,
    `${BASE}/v1/api/call-history?callAgentId=${agentId}&limit=${limit}`,
    flowId && `${BASE}/v1/api/call-history?flowId=${flowId}&limit=${limit}`,
    flowId && `${BASE}/v1/api/call-history?pathwayId=${flowId}&limit=${limit}`,
    `${BASE}/v1/api/call-history?limit=${limit}`,
  ].filter(Boolean) as string[];

  for (const url of attempts) {
    try {
      const calls = await tryGet(url);
      // If the first call returned items, filter client-side as a safety net
      if (calls.length > 0) {
        const filtered = calls.filter(
          (c) =>
            c.agentId === agentId ||
            c.flowId === flowId ||
            (!c.agentId && !c.flowId), // unknown shape — keep
        );
        return filtered.length > 0 ? filtered : calls;
      }
    } catch (e) {
      // try next param shape
      console.warn("[trillet] attempt failed:", (e as Error).message);
    }
  }
  return [];
}

export async function getCall(callId: string): Promise<Call | null> {
  const url = `${BASE}/v1/api/call-history/${callId}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, unknown>;
  const inner = (json.call || json.data || json) as Record<string, unknown>;
  return normalizeCall(inner);
}

export async function getRecordingUrl(callId: string): Promise<string | null> {
  const url = `${BASE}/v1/api/recordings/${callId}`;
  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, unknown>;
  return (
    (json.recordingUrl as string) ||
    (json.url as string) ||
    (json.audioUrl as string) ||
    null
  );
}

export async function exportCallHistoryCsv(
  agentId: string,
  opts: {
    includeTranscripts?: boolean;
    includePostAnalysis?: boolean;
    limit?: number;
  } = {},
): Promise<{ csv: string; filename: string } | null> {
  const url = `${BASE}/v2/api/call-history/export-csv`;
  const body = {
    agentId,
    includeTranscripts: opts.includeTranscripts ?? false,
    includePostAnalysis: opts.includePostAnalysis ?? false,
    ...(opts.limit ? { limit: opts.limit } : {}),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const csv = await res.text();
  const cd = res.headers.get("content-disposition") || "";
  const m = cd.match(/filename="?([^";]+)"?/i);
  return { csv, filename: m?.[1] || `call-history-${Date.now()}.csv` };
}
