"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Polls the current server component at a fixed interval by calling
 * `router.refresh()`. Respects page visibility — pauses while the tab
 * is backgrounded so we're not hammering Trillet on idle tabs.
 *
 * Why this exists: the Trillet CSV-export endpoint is slow and has no
 * push/webhook, so the portal has to pull. Ten seconds of staleness is
 * plenty — and the upstream cache in lib/trillet.ts dedupes overlapping
 * fetches across tabs.
 */
export default function AutoRefresh({
  intervalMs = 10000,
  showIndicator = true,
}: {
  intervalMs?: number;
  showIndicator?: boolean;
}) {
  const router = useRouter();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
          setTick((t) => t + 1);
        }
      }, intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        setTick((t) => t + 1);
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, intervalMs]);

  if (!showIndicator) return null;

  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-mute">
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
        aria-hidden
        data-tick={tick}
      />
      Live
    </div>
  );
}
