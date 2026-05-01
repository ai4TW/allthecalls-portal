import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { saveNote } from "@/lib/notes";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ callId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { callId } = await params;
  const fd = await req.formData();
  const notes = String(fd.get("notes") || "");

  try {
    await saveNote(session.userId, callId, notes);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Redirect back to whatever page submitted the form (tenant CRM or legacy
  // /calls). Falls back to the legacy path if no Referer is set.
  const referer = req.headers.get("referer");
  let back: URL;
  if (referer) {
    try {
      back = new URL(referer);
      back.searchParams.set("saved", "1");
    } catch {
      back = new URL(`/calls/${encodeURIComponent(callId)}?saved=1`, req.url);
    }
  } else {
    back = new URL(`/calls/${encodeURIComponent(callId)}?saved=1`, req.url);
  }
  return NextResponse.redirect(back, 303);
}
