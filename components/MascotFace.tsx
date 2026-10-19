"use client";

import { useEffect, useRef } from "react";

/** The look sprite: 5×5 frames, row = looking up → down, column = looking left → right (viewer's side). */
const SPRITE = "/mascot/look.webp";
/** The front-facing frame alone, shown until the sprite has loaded. */
const CENTER = "/mascot/look-center.webp";
const GRID = 5;
const MIDDLE = 2;
const LAST = GRID - 1;

/**
 * How far the cursor must go for a full turn is measured per direction from the space that
 * side actually has: the face sits in a top corner, so there's little room above it or to its
 * outer side. Reaching the screen edge in any direction turns it all the way, within these limits.
 */
const RANGE_LIMITS = { x: [70, 650], y: [34, 480] } as const;
/** How quickly the head glides to the next drawn frame (ms; lower = snappier). */
const FOLLOW_MS = 75;
/** How far past a frame boundary the cursor must go before switching back (prevents flicker). */
const HYSTERESIS = 0.15;
/** Phones have no cursor: after a touch, the face looks back to the front after this long. */
const TOUCH_RETURN_MS = 2500;
/**
 * Continuous drift (px) of the whole head with the cursor: a little overall, plus a little within
 * the current frame, so small mouse movements move the head smoothly between drawn angles.
 */
const DRIFT = { overall: 1.4, withinFrame: 2.2 };

/** Each frame is shown a bit larger than the badge, so the head (not the shoulders) fills the circle. */
const ZOOM = 1.32;
/** Where the head's centre sits inside a frame (fraction of the frame); lower when looking down. */
const HEAD_CENTER_X = 0.5;
const HEAD_CENTER_Y_BY_ROW = [0.42, 0.43, 0.44, 0.47, 0.5];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * The mascot beside the logo, watching the cursor.
 *
 * The head always settles on one of the 25 drawn frames (the one nearest the cursor's
 * direction), so at rest it's a clean drawing, never a double image. Moving between frames, it
 * glides: the drawn point eases toward the new frame (frame-rate independent smoothing) and the
 * 4 nearest frames are blended by distance for that split second. Meanwhile the whole head
 * drifts a couple of pixels continuously with the cursor, so small movements feel fluid. Four stacked layers are updated
 * directly in requestAnimationFrame (no React re-renders), only while moving. On touch it
 * follows the finger; with reduced motion it stays still. The 115 KB sprite loads on the first
 * pointer event; a 5 KB front frame shows until then.
 */
export function MascotFace({ size }: { size: number }) {
  const headRef = useRef<HTMLSpanElement>(null);
  const layerRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const head = headRef.current;
    const layers = layerRefs.current.filter((l): l is HTMLSpanElement => l !== null);
    if (!head || layers.length !== 4 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cell = size * ZOOM;
    const offsetX = size / 2 - HEAD_CENTER_X * cell;
    const paint = (el: HTMLSpanElement, row: number, col: number) => {
      const offsetY = size / 2 - HEAD_CENTER_Y_BY_ROW[row] * cell;
      el.style.backgroundPosition = `${offsetX - col * cell}px ${offsetY - row * cell}px`;
    };

    // pos: the blended point being drawn; goal: the drawn frame it settles on (always whole
    // numbers, so at rest there's never a double image); raw: the exact cursor-derived point.
    const pos = { x: MIDDLE, y: MIDDLE };
    const goal = { x: MIDDLE, y: MIDDLE };
    const raw = { x: MIDDLE, y: MIDDLE };
    const drift = { x: 0, y: 0 };
    let spriteReady = false;
    let spriteRequested = false;
    let frame = 0;
    let last = 0;
    let returnTimer: ReturnType<typeof setTimeout> | undefined;

    // Blend the 4 frames around the current point. With "over" compositing, layer k gets
    // opacity = its weight / (sum of weights so far), which yields exactly the bilinear weights.
    const render = () => {
      const x = clamp(pos.x, 0, LAST);
      const y = clamp(pos.y, 0, LAST);
      const col = Math.min(LAST - 1, Math.floor(x));
      const row = Math.min(LAST - 1, Math.floor(y));
      const fx = x - col;
      const fy = y - row;
      const cells: [number, number, number][] = [
        [row, col, (1 - fx) * (1 - fy)],
        [row, col + 1, fx * (1 - fy)],
        [row + 1, col, (1 - fx) * fy],
        [row + 1, col + 1, fx * fy],
      ];
      let sum = 0;
      cells.forEach(([r, c, weight], k) => {
        sum += weight;
        paint(layers[k], r, c);
        layers[k].style.opacity = k === 0 ? "1" : sum > 0 ? (weight / sum).toFixed(3) : "0";
      });
      head.style.transform = `translate(${drift.x.toFixed(2)}px, ${drift.y.toFixed(2)}px)`;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const t = 1 - Math.exp(-dt / FOLLOW_MS);
      pos.x += (goal.x - pos.x) * t;
      pos.y += (goal.y - pos.y) * t;
      const driftGoal = (axis: "x" | "y") =>
        ((raw[axis] - MIDDLE) / MIDDLE) * DRIFT.overall + (raw[axis] - goal[axis]) * DRIFT.withinFrame;
      drift.x += (driftGoal("x") - drift.x) * t;
      drift.y += (driftGoal("y") - drift.y) * t;
      render();
      const moving =
        Math.abs(goal.x - pos.x) > 0.002 ||
        Math.abs(goal.y - pos.y) > 0.002 ||
        Math.abs(driftGoal("x") - drift.x) > 0.01 ||
        Math.abs(driftGoal("y") - drift.y) > 0.01;
      frame = moving ? requestAnimationFrame(tick) : 0;
      if (!moving) last = 0;
    };
    // Settle on the nearest drawn frame, sticking to the current one near boundaries.
    const nearest = (value: number, current: number) =>
      Math.abs(value - current) < 0.5 + HYSTERESIS ? current : clamp(Math.round(value), 0, LAST);
    const lookAt = (x: number, y: number) => {
      raw.x = x;
      raw.y = y;
      goal.x = nearest(x, goal.x);
      goal.y = nearest(y, goal.y);
      if (spriteReady && !frame) frame = requestAnimationFrame(tick);
    };

    const loadSprite = () => {
      if (spriteRequested) return;
      spriteRequested = true;
      const img = new Image();
      img.onload = () => {
        spriteReady = true;
        for (const layer of layers) {
          layer.style.backgroundImage = `url(${SPRITE})`;
          layer.style.backgroundSize = `${cell * GRID}px ${cell * GRID}px`;
        }
        render();
        frame = requestAnimationFrame(tick);
      };
      img.src = SPRITE;
    };

    const onPointer = (e: PointerEvent) => {
      loadSprite();
      const r = head.parentElement!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      // Space from the face to the screen edge on the side the cursor is on.
      const room = (delta: number, before: number, after: number, [min, max]: readonly [number, number]) =>
        clamp(delta < 0 ? before : after, min, max);
      const rangeX = room(dx, cx, window.innerWidth - cx, RANGE_LIMITS.x);
      const rangeY = room(dy, cy, window.innerHeight - cy, RANGE_LIMITS.y);
      lookAt((clamp(dx / rangeX, -1, 1) + 1) * MIDDLE, (clamp(dy / rangeY, -1, 1) + 1) * MIDDLE);
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
      cancelAnimationFrame(frame);
      clearTimeout(returnTimer);
    };
  }, [size]);

  // Before the sprite loads, the bottom layer shows the small front-facing frame.
  const cell = size * ZOOM;
  const frontFrame: React.CSSProperties = {
    backgroundImage: `url(${CENTER})`,
    backgroundSize: `${cell}px ${cell}px`,
    backgroundPosition: `${size / 2 - HEAD_CENTER_X * cell}px ${size / 2 - HEAD_CENTER_Y_BY_ROW[MIDDLE] * cell}px`,
  };

  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0 overflow-hidden rounded-full border border-line bg-chip shadow-[0_0_14px_rgb(255_46_62/0.25)]"
      style={{ width: size, height: size }}
    >
      {/* Breathing: a very slow, tiny rise and fall so the face never looks frozen. */}
      <span className="absolute inset-0 animate-[breathe_3.8s_ease-in-out_infinite_alternate] motion-reduce:animate-none">
        <span ref={headRef} className="absolute inset-0 will-change-transform">
          {[0, 1, 2, 3].map((k) => (
            <span
              key={k}
              ref={(el) => {
                layerRefs.current[k] = el;
              }}
              className="absolute inset-0 bg-no-repeat"
              style={k === 0 ? frontFrame : { opacity: 0 }}
            />
          ))}
        </span>
      </span>
    </span>
  );
}
