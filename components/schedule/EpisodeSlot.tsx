"use client";

import { useSchedule } from "./ScheduleProvider";

/**
 * Wraps one server-rendered card and shows or hides it for the current filters and day.
 * The card arrives as `children`, so it stays a server component.
 */
export function EpisodeSlot({ id, children }: { id: number; children: React.ReactNode }) {
  const { visibleIds } = useSchedule();
  return (
    <div hidden={!visibleIds.has(id)} className="min-w-0">
      {children}
    </div>
  );
}
