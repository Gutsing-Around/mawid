/** Most seasons are short enough to draw one tick per episode. */
const MAX_TICKS = 26;

/** Season progress: aired episodes filled, this episode highlighted, the rest empty. */
export function SeasonProgress({ episode, total }: { episode: number; total: number }) {
  const aired = Math.min(episode - 1, total);

  return (
    <div
      role="progressbar"
      aria-label="تقدّم الموسم"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={aired}
      className="flex h-1.5 gap-0.5"
    >
      {total <= MAX_TICKS ? (
        Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`flex-1 rounded-[1px] ${
              i < aired ? "bg-accent" : i === aired ? "bg-accent/35" : "bg-chip"
            }`}
          />
        ))
      ) : (
        <span className="flex-1 overflow-hidden rounded-[1px] bg-chip">
          <span
            className="block h-full bg-accent"
            style={{ width: `${Math.round((aired / total) * 100)}%` }}
          />
        </span>
      )}
    </div>
  );
}
