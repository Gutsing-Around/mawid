"use client";

import { useRef, useState } from "react";
import { SHARE_TARGETS } from "@/lib/share";

/**
 * "مشاركة": shares a page with a short Arabic message. On phones it opens the system share sheet
 * (WhatsApp, Telegram, Instagram…); elsewhere a menu with WhatsApp, Telegram, X and "copy link".
 * The link is built from the current origin when clicked, so it always points at this site.
 */
export function ShareButton({
  path,
  text,
  label = "مشاركة",
  opens = "down",
  className = "",
}: {
  /** The page to share, e.g. a show page path or "/". */
  path: string;
  /** The message that goes with the link. */
  text: string;
  label?: string;
  /** Which way the menu opens; "up" near the bottom of the page. */
  opens?: "down" | "up";
  className?: string;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;
  const close = () => menuRef.current?.removeAttribute("open");

  // Phones have a native share sheet that already lists the visitor's own apps.
  const shareNatively = (event: React.MouseEvent) => {
    if (!navigator.share || !window.matchMedia("(pointer: coarse)").matches) return;
    event.preventDefault();
    navigator.share({ text, url: url() }).catch(() => {
      // Cancelled by the visitor, or not allowed: nothing to do.
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        close();
      }, 1400);
    } catch {
      window.prompt("انسخ الرابط:", url());
    }
  };

  const item =
    "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-start text-sm hover:bg-chip focus-visible:bg-chip focus-visible:outline-none";

  return (
    // <details> gives an accessible open/close toggle without extra state.
    <details ref={menuRef} className={`group relative ${className}`}>
      <summary
        onClick={shareNatively}
        className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-line bg-chip px-4 py-2 text-sm font-semibold transition hover:border-muted group-open:border-accent group-open:text-accent [&::-webkit-details-marker]:hidden"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </summary>
      <div className={`absolute start-0 z-30 w-56 ${opens === "up" ? "bottom-full mb-2" : "mt-2"} overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/70`}>
        {SHARE_TARGETS.map((target) => (
          <button
            key={target.name}
            type="button"
            className={item}
            onClick={() => {
              window.open(target.link(url(), text), "_blank", "noopener");
              close();
            }}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0" style={{ fill: target.color }}>
              <path d={target.logo} />
            </svg>
            {target.name}
          </button>
        ))}
        <button type="button" onClick={copy} className={`${item} border-t border-line`}>
          <span aria-hidden className="w-5 text-center">{copied ? "✓" : "🔗"}</span>
          <span aria-live="polite" className={copied ? "text-accent" : ""}>
            {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
          </span>
        </button>
      </div>
    </details>
  );
}
