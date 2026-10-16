"use client";

import { useRevealed } from "@/hooks/useRevealed";

/**
 * Wraps a show's artwork. For mature shows the art stays blurred behind a warning with a
 * red "عرض" button until the visitor chooses to see it; other shows render unchanged.
 * "lg" is for posters and the popup, "sm" for small thumbnails, "bg" for decorative
 * backgrounds (blurred, no button: revealing the show elsewhere unblurs it).
 */
export function MatureCover({
  mediaId,
  mature,
  size = "lg",
  children,
}: {
  mediaId: number;
  mature: boolean;
  size?: "lg" | "sm" | "bg";
  children: React.ReactNode;
}) {
  const [revealed, reveal] = useRevealed(mediaId);
  if (!mature || revealed) return children;

  return (
    <>
      {/* Blur every image inside; the scale hides the soft edges blur leaves. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden [&_img]:scale-110 [&_img]:blur-2xl">
        {children}
      </div>
      {size !== "bg" && (
        // The whole blurred area reveals on click (and sits above the card's "open details"
        // button), so the first click always removes the blur instead of opening the popup.
        // The inner button is the keyboard/screen-reader way to do the same.
        <div
          onClick={reveal}
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/45 p-2 text-center"
        >
          {size === "lg" && (
            <p className="text-xs leading-snug font-semibold text-white">
              <span aria-hidden className="text-signal">⚠ </span>
              محتوى للكبار
            </p>
          )}
          <button
            type="button"
            onClick={reveal}
            aria-label="عرض صورة العمل (محتوى للكبار)"
            className={`cursor-pointer rounded-md bg-signal font-bold text-white glow-box-signal transition hover:brightness-110 ${
              size === "lg" ? "px-4 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"
            }`}
          >
            {size === "sm" && <span aria-hidden>⚠ </span>}
            عرض
          </button>
        </div>
      )}
    </>
  );
}
