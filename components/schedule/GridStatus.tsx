"use client";

import { useSchedule } from "./ScheduleProvider";

/** Message shown when the selected day has no episodes matching the filters. */
export function GridStatus() {
  const { visibleIds, filters } = useSchedule();
  if (visibleIds.size > 0) return null;

  const filtered = Boolean(filters.query || filters.genre || filters.platform);
  return (
    <p className="col-span-full py-16 text-center text-muted">
      {filtered ? "لا توجد حلقات تطابق بحثك في هذا اليوم." : "لا توجد حلقات في هذا اليوم."}
    </p>
  );
}
