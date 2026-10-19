"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/** The two lenses in face.webp, as % of the image: [left, top, right, bottom]. Measured from the art. */
const LENSES = [
  [19.3, 48, 39.2, 60.5],
  [49.8, 51.3, 72.6, 65],
] as const;

/** The head turns toward the cursor (slightly enlarged so the circle never shows an edge). */
const HEAD_STYLE: React.CSSProperties = {
  transform:
    "scale(1.16) translate(calc(var(--lx) * 13%), calc(var(--ly) * 10%)) rotateY(calc(var(--lx) * 30deg)) rotateX(calc(var(--ly) * -24deg))",
};
/** Each lens keeps its brightest spot facing the cursor; the far side is shaded. */
const LENS_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle at calc(50% + var(--lx) * 38%) calc(50% + var(--ly) * 38%), transparent 22%, rgb(60 38 26 / 0.55) 100%)",
};

/** How far (px) the cursor has to be for the head to turn all the way. */
const FULL_TURN_DISTANCE = 320;
/** Phones have no cursor: after a touch, the face drifts back to centre after this long. */
const TOUCH_RETURN_MS = 2500;

/**
 * The mascot's face beside the logo. It watches the cursor: the head turns toward it in 3D
 * and the bright spot of each glowing lens slides toward it. On touch screens it follows
 * the finger while touching. Motion is driven by two CSS variables (--lx, --ly in -1…1)
 * updated at most once per frame, so React never re-renders. Off when reduced motion is on.
 */
export function MascotFace({ size }: { size: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let returnTimer: ReturnType<typeof setTimeout> | undefined;

    // Ease toward the target each frame, so the head moves smoothly rather than snapping.
    const step = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      el.style.setProperty("--lx", current.x.toFixed(3));
      el.style.setProperty("--ly", current.y.toFixed(3));
      frame =
        Math.abs(target.x - current.x) > 0.002 || Math.abs(target.y - current.y) > 0.002
          ? requestAnimationFrame(step)
          : 0;
    };
    const moveTo = (x: number, y: number) => {
      target.x = x;
      target.y = y;
      if (!frame) frame = requestAnimationFrame(step);
    };

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, distance / FULL_TURN_DISTANCE);
      moveTo((dx / distance) * reach, (dy / distance) * reach);
      clearTimeout(returnTimer);
      if (e.pointerType === "touch") returnTimer = setTimeout(() => moveTo(0, 0), TOUCH_RETURN_MS);
    };
    const center = () => moveTo(0, 0);

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", center);
    window.addEventListener("blur", center);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.removeEventListener("pointerleave", center);
      window.removeEventListener("blur", center);
      cancelAnimationFrame(frame);
      clearTimeout(returnTimer);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      className="relative inline-block shrink-0 overflow-hidden rounded-full border border-line bg-chip shadow-[0_0_14px_rgb(255_46_62/0.25)] [--lx:0] [--ly:0] [perspective:110px]"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0" style={HEAD_STYLE}>
        <Image src="/mascot/face.webp" alt="" fill sizes={`${size * 2}px`} priority />
        {LENSES.map(([left, top, right, bottom]) => (
          <span
            key={left}
            className="absolute rounded-[30%]"
            style={{ ...LENS_STYLE, left: `${left}%`, top: `${top}%`, width: `${right - left}%`, height: `${bottom - top}%` }}
          />
        ))}
      </span>
    </span>
  );
}
