"use client";

import { useEffect, useRef } from "react";

/** The look sprite: 5×5 frames, row = looking up → down, column = looking left → right (viewer's side). */
const SPRITE = "/mascot/look.webp";
/** The front-facing frame alone, shown until the sprite has loaded. */
const CENTER = "/mascot/look-center.webp";
const GRID = 5;
const MIDDLE = 2;

/**
 * How far the cursor must go for a full turn is measured per direction from the space that
 * side actually has: the face sits in a top corner, so there's little room above it or to its
 * outer side. Reaching the screen edge in any direction turns it all the way, within these limits.
 */
const RANGE_LIMITS = { x: [70, 650], y: [34, 480] } as const;
/** How far past a frame boundary the cursor must go before switching back (prevents flicker). */
const HYSTERESIS = 0.18;
/** Time between frames when the head sweeps across several of them. */
const STEP_MS = 55;
/** Crossfade between two frames. */
const FADE_MS = 110;
/** Phones have no cursor: after a touch, the face looks back to the front after this long. */
const TOUCH_RETURN_MS = 2500;

/** Each frame is shown a bit larger than the badge, so the head (not the shoulders) fills the circle. */
const ZOOM = 1.32;
/** Where the head's centre sits inside a frame (fraction of the frame); lower when looking down. */
const HEAD_CENTER_X = 0.5;
const HEAD_CENTER_Y_BY_ROW = [0.42, 0.43, 0.44, 0.47, 0.5];

/**
 * The mascot beside the logo, watching the cursor. It shows one of 25 drawn frames (the head
 * turned toward the cursor), steps through the in-between frames when the cursor jumps far,
 * and crossfades between them, so the turn looks drawn rather than distorted. Updates the DOM
 * directly (no React re-renders). On touch screens it follows the finger. With reduced motion
 * it stays facing forward. The 115 KB sprite only loads on the first pointer movement.
 */
export function MascotFace({ size }: { size: number }) {
  const backRef = useRef<HTMLSpanElement>(null);
  const frontRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cell = size * ZOOM;
    const offsetX = size / 2 - HEAD_CENTER_X * cell;
    const paint = (el: HTMLSpanElement, row: number, col: number) => {
      const offsetY = size / 2 - HEAD_CENTER_Y_BY_ROW[row] * cell;
      el.style.backgroundImage = `url(${SPRITE})`;
      el.style.backgroundSize = `${cell * GRID}px ${cell * GRID}px`;
      el.style.backgroundPosition = `${offsetX - col * cell}px ${offsetY - row * cell}px`;
    };

    let spriteReady = false;
    let spriteRequested = false;
    const shown = { row: MIDDLE, col: MIDDLE };
    const target = { row: MIDDLE, col: MIDDLE };
    let stepTimer: ReturnType<typeof setTimeout> | undefined;
    let returnTimer: ReturnType<typeof setTimeout> | undefined;

    // Move one frame at a time toward the target, crossfading each step.
    const step = () => {
      stepTimer = undefined;
      if (!spriteReady || (shown.row === target.row && shown.col === target.col)) return;
      const previous = { ...shown };
      shown.row += Math.sign(target.row - shown.row);
      shown.col += Math.sign(target.col - shown.col);
      paint(back, previous.row, previous.col);
      paint(front, shown.row, shown.col);
      front.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: "ease-out" });
      stepTimer = setTimeout(step, STEP_MS);
    };
    const lookAt = (row: number, col: number) => {
      target.row = row;
      target.col = col;
      if (!stepTimer) step();
    };

    // Continuous position (0…4) → frame index, sticking to the current frame near boundaries.
    const toIndex = (value: number, current: number) =>
      Math.abs(value - current) < 0.5 + HYSTERESIS ? current : Math.round(value);

    const loadSprite = () => {
      if (spriteRequested) return;
      spriteRequested = true;
      const img = new Image();
      img.onload = () => {
        spriteReady = true;
        paint(back, shown.row, shown.col);
        paint(front, shown.row, shown.col);
        step();
      };
      img.src = SPRITE;
    };

    const onPointer = (e: PointerEvent) => {
      loadSprite();
      const r = front.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      // Space from the face to the screen edge on the side the cursor is on.
      const room = (delta: number, before: number, after: number, [min, max]: readonly [number, number]) =>
        Math.min(max, Math.max(min, delta < 0 ? before : after));
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const rangeX = room(dx, cx, window.innerWidth - cx, RANGE_LIMITS.x);
      const rangeY = room(dy, cy, window.innerHeight - cy, RANGE_LIMITS.y);
      const x = (Math.max(-1, Math.min(1, dx / rangeX)) + 1) * MIDDLE;
      const y = (Math.max(-1, Math.min(1, dy / rangeY)) + 1) * MIDDLE;
      lookAt(toIndex(y, target.row), toIndex(x, target.col));
      clearTimeout(returnTimer);
      if (e.pointerType === "touch") returnTimer = setTimeout(() => lookAt(MIDDLE, MIDDLE), TOUCH_RETURN_MS);
    };
    const center = () => lookAt(MIDDLE, MIDDLE);

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", center);
    window.addEventListener("blur", center);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.documentElement.removeEventListener("pointerleave", center);
      window.removeEventListener("blur", center);
      clearTimeout(stepTimer);
      clearTimeout(returnTimer);
    };
  }, [size]);

  // Before the sprite loads, both layers show the small front-facing frame.
  const cell = size * ZOOM;
  const initial: React.CSSProperties = {
    backgroundImage: `url(${CENTER})`,
    backgroundSize: `${cell}px ${cell}px`,
    backgroundPosition: `${size / 2 - HEAD_CENTER_X * cell}px ${size / 2 - HEAD_CENTER_Y_BY_ROW[MIDDLE] * cell}px`,
    backgroundRepeat: "no-repeat",
  };

  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0 overflow-hidden rounded-full border border-line bg-chip shadow-[0_0_14px_rgb(255_46_62/0.25)]"
      style={{ width: size, height: size }}
    >
      <span ref={backRef} className="absolute inset-0 bg-no-repeat" style={initial} />
      <span ref={frontRef} className="absolute inset-0 bg-no-repeat" style={initial} />
    </span>
  );
}
