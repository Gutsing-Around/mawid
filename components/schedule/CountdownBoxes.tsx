"use client";

import { useNow } from "@/hooks/useNow";
import { pad2, splitDuration, unitNoun } from "@/lib/format";

const UNITS = [
  { key: "days", unit: "day" },
  { key: "hours", unit: "hour" },
  { key: "minutes", unit: "minute" },
  { key: "seconds", unit: "second" },
] as const;

/**
 * The big glowing countdown for the next episode, as four clearly separated groups.
 * "boxes" (poster hero) puts each in a tile; "inline" (ticket hero) shows bare numbers.
 * Blank until hydrated, since the server can't know the current second.
 */
export function CountdownBoxes({ airingAt, variant }: { airingAt: number; variant: "boxes" | "inline" }) {
  const now = useNow();
  const parts = now === null ? null : splitDuration(airingAt - now);

  return (
    <div role="timer" className={`flex ${variant === "boxes" ? "gap-2.5 sm:gap-5" : "gap-5 sm:gap-7"}`}>
      {UNITS.map(({ key, unit }) => {
        const value = parts?.[key];
        return (
          <div
            key={key}
            className={
              variant === "boxes"
                ? "w-[clamp(68px,19vw,112px)] rounded-lg border border-line bg-banner/80 pt-3.5 pb-2.5 text-center backdrop-blur-sm"
                : "text-center"
            }
          >
            <b
              className={`block leading-none text-signal glow-signal tabular-nums ${
                variant === "boxes" ? "font-poster text-[clamp(36px,8vw,60px)] font-normal" : "font-mono text-3xl font-semibold"
              }`}
            >
              {value === undefined ? "--" : pad2(value)}
            </b>
            <small className="mt-1.5 block text-xs text-muted">
              {value === undefined ? " " : unitNoun(value, unit)}
            </small>
          </div>
        );
      })}
    </div>
  );
}
