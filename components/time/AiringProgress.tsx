"use client";

import { useClock } from "@/hooks/useNow";
import { countdownState, DAY } from "@/lib/format";

/** The line fills across the week before an episode airs. */
const WINDOW = 7 * DAY;

/**
 * A thin line that fills as the episode approaches. It stays dark green while more than
 * 24 hours away, brightens through the last day, and glows bright green once on air.
 */
export function AiringProgress({ airingAt, className = "" }: { airingAt: number; className?: string }) {
  // Whole-minute resolution is plenty for a line, and avoids re-rendering every second.
  const remaining = useClock((now) => Math.floor((airingAt - now) / 60) * 60);
  if (remaining === null) return <div className={`h-1.5 rounded-full bg-chip ${className}`} />;

  const state = countdownState(remaining);
  const fill = state === "upcoming" || state === "soon" ? Math.min(1, Math.max(0.03, 1 - remaining / WINDOW)) : 1;
  // 0% bright beyond 24 hours, rising to 100% at airing time.
  const brightness = remaining >= DAY ? 0 : Math.round((1 - Math.max(0, remaining) / DAY) * 100);
  const color =
    state === "aired"
      ? "var(--muted)"
      : state === "live"
        ? "var(--accent)"
        : `color-mix(in oklab, var(--accent) ${brightness}%, var(--accent-deep))`;

  return (
    <div
      role="progressbar"
      aria-label="اقتراب موعد الحلقة"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fill * 100)}
      className={`h-1.5 overflow-hidden rounded-full bg-chip ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width,background-color] duration-700 ${state === "live" ? "animate-pulse shadow-[0_0_10px_var(--accent)] motion-reduce:animate-none" : ""}`}
        style={{ width: `${fill * 100}%`, backgroundColor: color, opacity: state === "aired" ? 0.4 : 1 }}
      />
    </div>
  );
}
