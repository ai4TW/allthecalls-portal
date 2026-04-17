import { unstable_cache } from "next/cache";

const BASE = "https://api.trillet.ai";

// How long to cache Trillet CSV exports. Short TTL = near-real-time while still
// preventing multiple concurrent polls (from multiple tabs or a refresh storm)
// from hammering Trillet's slow CSV-export endpoint.
const LIST_CACHE_SECONDS = 5;
const DETAIL_CACHE_SECONDS = 3;

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
  callId: string;
  recordId: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  duration: number;
  startedAt: string;
  endedAt: string;
  agentName: string;
  flowName: string;
  cost: number;
  summary: string;
  recordingUrl: string;
  transcript?: Array<{ role: string; text: string; at?: string }>;
  analyzed?: Record<string, unknown>;
};

/** RFC4180-ish CSV parser — handles quoted fields, escaped quotes, newlines inside fields. */
function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"' && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.length > 0))
    .map((r) => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => {
        o[h] = r[i] ?? "";
      });
      return o;
    });
}

function rowToCall(r: Record<string, string>): Call {
  let analyzed: Record<string, unknown> | undefined;
  const raw = r["Analyzed Data (JSON)"];
  if (raw) {
    try {
      analyzed = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  const id = r["Call ID"] || r["Record ID"] || "";
  return {
    id,
    callId: r["Call ID"] || id,
    recordId: r["Record ID"] || "",
    from: r["From Phone Number"] || "",
    to: r["To Phone Number"] || "",
    direction: r["Direction"] || "",
    status: r["Status"] || "",
    duration: parseFloat(r["Duration (s)"]) || 0,
    startedAt: r["Start Time (UTC)"] || "",
    endedAt: r["End Time (UTC)"] || "",
    agentName: r["Agent Name"] || "",
    flowName: r["Call Flow Name"] || "",
    cost: parseFloat(r["Cost"]) || 0,
    summary: r["Summary"] || "",
    recordingUrl: r["Recording Link"] || "",
    analyzed,
  };
}

type ExportOpts = {
  includeTranscripts?: boolean;
  includePostAnalysis?: boolean;
  limit?: number;
};

async function fetchExportCsv(agentId: string, opts: ExportOpts = {}): Promise<string> {
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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Trillet ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.text();
}

async function listCallsForAgentUncached(agentId: string, limit: number): Promise<Call[]> {
  const csv = await fetchExportCsv(agentId, { limit });
  const rows = parseCsv(csv);
  const calls = rows.map(rowToCall);
  calls.sort((a, b) => {
    const da = new Date(a.startedAt).getTime() || 0;
    const db = new Date(b.startedAt).getTime() || 0;
    return db - da;
  });
  return calls;
}

/**
 * List calls for a specific Trillet voice agent. Sorted newest → oldest.
 * Cached for LIST_CACHE_SECONDS to dedupe concurrent polls.
 */
export async function listCallsForAgent(
  agentId: string,
  _flowId?: string,
  limit = 200,
): Promise<Call[]> {
  const cached = unstable_cache(
    async () => listCallsForAgentUncached(agentId, limit),
    ["trillet-calls-list", agentId, String(limit)],
    { revalidate: LIST_CACHE_SECONDS, tags: ["trillet-calls", `trillet-calls-${agentId}`] },
  );
  return cached();
}

async function getCallUncached(agentId: string, callId: string): Promise<Call | null> {
  const csv = await fetchExportCsv(agentId, {
    includeTranscripts: true,
    includePostAnalysis: true,
  });
  const rows = parseCsv(csv);
  const row = rows.find((r) => r["Call ID"] === callId || r["Record ID"] === callId);
  if (!row) return null;
  const call = rowToCall(row);

  const transcriptRaw = row["Transcript"] || row["Transcripts"] || "";
  if (transcriptRaw) {
    call.transcript = parseTranscript(transcriptRaw);
  }
  return call;
}

/** Fetch a single call with transcript + post-analysis included. */
export async function getCall(agentId: string, callId: string): Promise<Call | null> {
  const cached = unstable_cache(
    async () => getCallUncached(agentId, callId),
    ["trillet-call-detail", agentId, callId],
    { revalidate: DETAIL_CACHE_SECONDS, tags: ["trillet-calls", `trillet-calls-${agentId}`] },
  );
  return cached();
}

/** Attempt to parse Trillet's transcript column into role/text pairs. */
function parseTranscript(raw: string): Array<{ role: string; text: string }> {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  // Try JSON first
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((m: Record<string, unknown>) => ({
            role: String(m.role || m.speaker || m.from || "?"),
            text: String(m.text || m.content || m.message || ""),
          }))
          .filter((m) => m.text);
      }
    } catch {
      /* ignore */
    }
  }
  // Plain text — split on newlines, try to detect "Speaker: text" format
  const lines = trimmed.split("\n").filter(Boolean);
  return lines.map((line) => {
    const m = line.match(/^([A-Za-z][A-Za-z0-9 _-]*?):\s*(.+)$/);
    if (m) return { role: m[1].trim(), text: m[2].trim() };
    return { role: "speaker", text: line.trim() };
  });
}

export async function exportCallHistoryCsv(
  agentId: string,
  opts: ExportOpts = {},
): Promise<{ csv: string; filename: string }> {
  const csv = await fetchExportCsv(agentId, opts);
  return { csv, filename: `call-history-${Date.now()}.csv` };
}

/** Stream a call recording from Trillet by record ID. */
export async function fetchRecording(recordId: string): Promise<Response> {
  const url = `${BASE}/v2/api/recordings/${encodeURIComponent(recordId)}`;
  return fetch(url, { headers: authHeaders(), cache: "no-store" });
}

/** Verify a recordId belongs to the given agent. Prevents cross-tenant access. */
export async function recordIdBelongsToAgent(
  agentId: string,
  recordId: string,
): Promise<boolean> {
  try {
    const csv = await fetchExportCsv(agentId, { limit: 500 });
    const rows = parseCsv(csv);
    return rows.some((r) => r["Record ID"] === recordId);
  } catch {
    return false;
  }
}
