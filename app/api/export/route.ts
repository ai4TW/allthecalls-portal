import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exportCallHistoryCsv } from "@/lib/trillet";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url), 303);

  const url = new URL(req.url);
  const includeTranscripts = url.searchParams.get("transcripts") === "1";
  const includePostAnalysis = url.searchParams.get("analysis") === "1";

  let result;
  try {
    result = await exportCallHistoryCsv(session.agentId, {
      includeTranscripts,
      includePostAnalysis,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Export failed", detail: (e as Error).message },
      { status: 502 },
    );
  }

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
