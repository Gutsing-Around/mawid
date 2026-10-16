"use client";

import { useSchedule } from "@/components/schedule/ScheduleProvider";

/**
 * Covers the whole card. It's a real link to the show page, so search engines can follow
 * it and Ctrl/middle-click or "open in new tab" opens the full page; a plain click opens the
 * details popup instead. Links and the star sit above it (`relative z-10`) and keep working.
 */
export function OpenDetails({ id, title, href }: { id: number; title: string; href: string }) {
  const { openDetails } = useSchedule();
  return (
    <a
      href={href}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openDetails(id);
      }}
      aria-label={`تفاصيل ${title}`}
      className="absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    />
  );
}
