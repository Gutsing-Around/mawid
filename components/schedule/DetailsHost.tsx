"use client";

import { ShowDetails } from "@/components/card/ShowDetails";
import { DetailsDialog } from "./DetailsDialog";
import { useSchedule } from "./ScheduleProvider";

/**
 * The one details popup on the page, built in the browser for whichever episode is open,
 * from the episode data the page already has. Keeping it here, rather than pre-rendering a
 * popup per card on the server, keeps every page much lighter.
 */
export function DetailsHost() {
  const { openId, byId } = useSchedule();
  const episode = openId === null ? undefined : byId.get(openId);
  if (!episode) return null;

  return (
    <DetailsDialog key={episode.id} title={episode.title}>
      <ShowDetails episode={episode} />
    </DetailsDialog>
  );
}
