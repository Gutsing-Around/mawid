"use client";

import { useSchedule } from "@/components/schedule/ScheduleProvider";

/**
 * An invisible button covering the whole card that opens the details popup.
 * Links and the star sit above it (`relative z-10`), so they keep working.
 */
export function OpenDetails({ id, title }: { id: number; title: string }) {
  const { openDetails } = useSchedule();
  return (
    <button
      type="button"
      onClick={() => openDetails(id)}
      aria-label={`تفاصيل ${title}`}
      className="absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    />
  );
}
