"use client";

import { useEffect, useState } from "react";
import { FAVORITE_ADDED_EVENT } from "@/hooks/useFavorites";
import { Mascot } from "./Mascot";

/** How long the pop-up stays on screen. */
const VISIBLE_MS = 2600;

/**
 * A short celebration when a show is added to قائمتي: the cheering mascot slides in at the
 * bottom of the screen. Listens for the event useFavorites() fires, so it covers every
 * star button on the site. Announced to screen readers through a polite live region.
 */
export function FavoriteToast() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onAdded = (e: Event) => {
      setTitle((e as CustomEvent<{ title: string }>).detail.title);
      clearTimeout(timer);
      timer = setTimeout(() => setTitle(null), VISIBLE_MS);
    };
    window.addEventListener(FAVORITE_ADDED_EVENT, onAdded);
    return () => {
      window.removeEventListener(FAVORITE_ADDED_EVENT, onAdded);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-4"
    >
      {title && (
        <div
          key={title}
          className="flex animate-[toast-in_300ms_cubic-bezier(0.2,0.8,0.3,1)] items-center gap-3 rounded-xl border border-signal/40 bg-surface/95 py-2 ps-2 pe-5 shadow-2xl shadow-black/70 backdrop-blur-sm motion-reduce:animate-none"
        >
          <Mascot pose="celebrate" height={72} className="-my-4" />
          <div className="text-start">
            <p className="glow-signal text-sm font-bold text-signal">أُضيف إلى قائمتي!</p>
            <p className="max-w-[60vw] truncate text-xs text-muted">{title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
