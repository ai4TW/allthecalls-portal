import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchRecording, recordIdBelongsToAgent } from "@/lib/trillet";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const ok = await recordIdBelongsToAgent(session.agentId, id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  const upstream = await fetchRecording(id);
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "recording unavailable", status: upstream.status },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type") || "audio/ogg";
  headers.set("Content-Type", ct);
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("Accept-Ranges", "bytes");

  return new NextResponse(upstream.body, { status: 200, headers });
}
