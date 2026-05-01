"use client";

import { useState } from "react";

export default function TenantNotesForm({
  callId,
  initialNotes,
  saved,
  brand,
}: {
  callId: string;
  initialNotes: string;
  saved?: boolean;
  brand: string;
}) {
  const [value, setValue] = useState(initialNotes);
  const dirty = value !== initialNotes;

  return (
    <form action={`/api/notes/${encodeURIComponent(callId)}`} method="POST">
      <textarea
        name="notes"
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add notes about this call — follow-ups, action items, anything you want to remember."
        className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3.5 py-3 text-sm focus:border-neutral-500 focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs">
          {saved && !dirty && <span className="text-emerald-600">✓ Saved</span>}
          {dirty && <span className="text-amber-600">Unsaved changes</span>}
        </div>
        <button
          type="submit"
          disabled={!dirty}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: brand }}
        >
          Save notes
        </button>
      </div>
    </form>
  );
}
