"use client";

import { useNow } from "@/hooks/useNow";
import { clockText, countdownState, countdownText, type CountdownState } from "@/lib/format";

const STATE_CLASS: Record<CountdownState, string> = {
  upcoming: "text-ink",
  soon: "text-signal glow-signal",
  live: "text-accent glow-accent",
  aired: "text-muted",
};

/**
 * Ticking countdown to an episode. "text": "بعد يومين و3 ساعات"; "clock": "09:30:27"
 * (poster cards). Red within the hour, green while on air.
 */
export function Countdown({
  airingAt,
  format = "text",
  className = "",
}: {
  airingAt: number;
  format?: "text" | "clock";
  className?: string;
}) {
  const now = useNow();
  if (now === null) return <span className={`text-muted ${className}`}>…</span>;

  const remaining = airingAt - now;
  return (
    <span className={`tabular-nums ${STATE_CLASS[countdownState(remaining)]} ${className}`}>
      {format === "clock" ? clockText(remaining) : countdownText(remaining)}
    </span>
  );
}
