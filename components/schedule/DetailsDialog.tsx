"use client";

import { useEffect, useRef } from "react";
import { useSchedule } from "./ScheduleProvider";

/**
 * A native modal <dialog>: focus is trapped, Escape closes it and the page behind is inert.
 * Clicking the dimmed backdrop or the ✕ button also closes it.
 */
export function DetailsDialog({ title, children }: { title: string; children: React.ReactNode }) {
  const { closeDetails } = useSchedule();
  const ref = useRef<HTMLDialogElement>(null);

  // No cleanup: unmounting removes the dialog from the page, which closes it. Calling close()
  // in a cleanup would fire `close` -> closeDetails(), and React's development Strict Mode
  // (which runs effects twice) would then shut the popup the moment it opened.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={closeDetails}
      // A click whose target is the <dialog> itself landed on the backdrop, not the content.
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-auto max-h-[min(90vh,860px)] w-[min(640px,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-line bg-surface p-0 text-ink shadow-2xl shadow-black/80 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => ref.current?.close()}
        aria-label="إغلاق"
        className="absolute top-3 left-3 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-black/60 text-lg text-white backdrop-blur-sm hover:bg-black/80"
      >
        ✕
      </button>
      {children}
    </dialog>
  );
}
