"use client";

import { useState } from "react";

export default function NotesForm({
  callId,
  initialNotes,
  saved,
}: {
  callId: string;
  initialNotes: string;
  saved?: boolean;
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
        className="input resize-y"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-ink-mute">
          {saved && !dirty && <span className="text-emerald-400">✓ Saved</span>}
          {dirty && <span className="text-amber-400">Unsaved changes</span>}
        </div>
        <button
          type="submit"
          disabled={!dirty}
          className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save notes
        </button>
      </div>
    </form>
  );
}
