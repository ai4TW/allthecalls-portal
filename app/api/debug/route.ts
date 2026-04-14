import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "no session" }, { status: 401 });

  const BASE = "https://api.trillet.ai";
  const res = await fetch(`${BASE}/v2/api/call-history/export-csv`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.TRILLET_API_KEY!,
      "x-workspace-id": process.env.TRILLET_WORKSPACE_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId: session.agentId,
      includeTranscripts: true,
      includePostAnalysis: true,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "fetch failed", status: res.status });
  }
  const csv = await res.text();

  // Inline parse
  function parseCsv(csv: string): Record<string, string>[] {
    const rows: string[][] = [];
    let cur: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
      const c = csv[i];
      if (inQuotes) {
        if (c === '"' && csv[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ",") { cur.push(field); field = ""; }
        else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
        else if (c === "\r") { /* skip */ }
        else { field += c; }
      }
    }
    if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
    if (rows.length === 0) return [];
    const headers = rows[0];
    return rows.slice(1).filter((r) => r.some((v) => v.length > 0)).map((r) => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = r[i] ?? ""; });
      return o;
    });
  }

  const rows = parseCsv(csv);
  const ids = rows.slice(0, 10).map((r) => ({
    callId: r["Call ID"],
    recordId: r["Record ID"],
    status: r["Status"],
  }));

  return NextResponse.json({
    csvBytes: csv.length,
    rowCount: rows.length,
    headers: Object.keys(rows[0] || {}).slice(0, 30),
    firstIds: ids,
    hasBxq6: rows.some((r) => r["Call ID"] === "Bxq6m5J4iFqs"),
  });
}
