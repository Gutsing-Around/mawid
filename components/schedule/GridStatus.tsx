"use client";

import { Mascot } from "@/components/Mascot";
import { useSchedule } from "./ScheduleProvider";

/** Shown when the selected day has no episodes: a confused mascot for "no results", a yawning one for a quiet day. */
export function GridStatus() {
  const { visibleIds, filters } = useSchedule();
  if (visibleIds.size > 0) return null;

  const filtered = Boolean(filters.query || filters.genre || filters.platform);
  return (
    <div className="col-span-full flex flex-col items-center gap-3 py-10 text-center">
      <Mascot pose={filtered ? "confused" : "sleepy"} height={180} />
      <p className="font-display text-lg">
        {filtered ? "لم أجد شيئًا يطابق بحثك" : "لا توجد حلقات في هذا اليوم"}
      </p>
      <p className="text-sm text-muted">
        {filtered ? "جرّب يومًا آخر أو غيّر البحث والتصفية." : "يوم هادئ… جرّب يومًا آخر من الأيام بالأعلى."}
      </p>
    </div>
  );
}
