"use client";

import { DetailsDialog } from "./DetailsDialog";
import { useSchedule } from "./ScheduleProvider";

/**
 * Wraps one server-rendered card: shows or hides it for the current filters and day,
 * and opens its server-rendered details in a popup. Both arrive as props, so they stay
 * server components. The popup renders outside the hidden wrapper, so the hero can open
 * it even when the card itself isn't on screen.
 */
export function EpisodeSlot({
  id,
  title,
  details,
  children,
}: {
  id: number;
  title: string;
  details: React.ReactNode;
  children: React.ReactNode;
}) {
  const { visibleIds, openId } = useSchedule();
  return (
    <>
      <div hidden={!visibleIds.has(id)} className="min-w-0">
        {children}
      </div>
      {openId === id && <DetailsDialog title={title}>{details}</DetailsDialog>}
    </>
  );
}
