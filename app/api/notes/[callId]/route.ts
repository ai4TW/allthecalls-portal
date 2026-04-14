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

  const back = new URL(`/calls/${encodeURIComponent(callId)}?saved=1`, req.url);
  return NextResponse.redirect(back, 303);
}
