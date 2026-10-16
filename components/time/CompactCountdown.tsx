"use client";

import { useNow } from "@/hooks/useNow";
import { countdownState, pad2, splitDuration } from "@/lib/format";

/**
 * Numbers-only countdown for ticket stubs: "08س 40د 12ث" (or "2ي 08س 40د" beyond a day).
 * Red within the hour; "يُعرض الآن" in green while on air.
 */
export function CompactCountdown({ airingAt, className = "" }: { airingAt: number; className?: string }) {
  const now = useNow();
  if (now === null) return <span className={`text-muted ${className}`}>…</span>;

  const remaining = airingAt - now;
  const state = countdownState(remaining);
  if (state === "live") return <span className={`font-bold text-accent glow-accent ${className}`}>يُعرض الآن</span>;
  if (state === "aired") return <span className={`text-muted ${className}`}>عُرضت</span>;

  const { days, hours, minutes, seconds } = splitDuration(remaining);
  const parts: [number, string][] = days > 0
    ? [[days, "ي"], [hours, "س"], [minutes, "د"]]
    : [[hours, "س"], [minutes, "د"], [seconds, "ث"]];

  return (
    <span className={`inline-flex gap-1.5 font-mono tabular-nums ${state === "soon" ? "text-signal glow-signal" : "text-ink"} ${className}`}>
      {parts.map(([value, letter]) => (
        <span key={letter}>
          {pad2(value)}
          <span className="font-sans text-[0.8em] opacity-60">{letter}</span>
        </span>
      ))}
    </span>
  );
}
