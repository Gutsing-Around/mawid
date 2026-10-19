"use client";

import { useEffect, useRef } from "react";

/** The look sprite: 9 columns × 8 rows, row = looking up → down, column = looking left → right (viewer's side). */
const SPRITE = "/mascot/look.webp";
/** The level, front-facing frame alone, shown until the sprite has loaded. */
const CENTER = "/mascot/look-center.webp";
// These must match reference/mascot/look/build-look.cjs.
const COLS = 9;
const ROWS = 8;
/** The row looking straight ahead. The drawings have more upward tilts than downward ones. */
const LEVEL_ROW = 5;
/** Where the face rests (looking straight ahead), and how many frames it can turn each way from there. */
const REST = { x: (COLS - 1) / 2, y: LEVEL_ROW };
const SPAN = { left: REST.x, right: COLS - 1 - REST.x, up: REST.y, down: ROWS - 1 - REST.y };

/**
 * How far the cursor must go for a full turn is measured per direction from the space that
 * side actually has: the face sits in a top corner, so there's little room above it or to its
 * outer side. Reaching the screen edge in any direction turns it all the way, within these limits.
 */
const RANGE_LIMITS = { x: [70, 650], y: [34, 480] } as const;
/** How quickly the head turns toward the cursor (ms; lower = snappier, higher = floatier). */
const FOLLOW_MS = 85;
/** Crossfade between two consecutive drawn frames. */
const CROSSFADE_MS = 70;
/** How far past a frame boundary the cursor must go before switching back (prevents flicker). */
const HYSTERESIS = 0.15;
/** Phones have no cursor: after a touch, the face looks back to the front after this long. */
const TOUCH_RETURN_MS = 2500;
/**
 * Continuous drift (px) of the whole head with the cursor: a little overall, plus a little within
 * the current frame, so small mouse movements move the head smoothly between drawn angles.
 */
const DRIFT = { overall: 1.4, withinFrame: 1.3 };

/** Each frame is shown a bit larger than the badge, so the head (not the shoulders) fills the circle. */
const ZOOM = 1.38;
/** Where the head's centre sits inside a frame (fraction of the frame); lower when looking down. */
const HEAD_CENTER_X = 0.5;
const HEAD_CENTER_Y = { up: 0.47, level: 0.46, down: 0.5 };
const HEAD_CENTER_Y_BY_ROW = Array.from({ length: ROWS }, (_, row) => {
  const t = row < REST.y ? (row - REST.y) / SPAN.up : (row - REST.y) / SPAN.down; // -1 (up) … 0 (level) … 1 (down)
  return t < 0
    ? HEAD_CENTER_Y.level + t * (HEAD_CENTER_Y.level - HEAD_CENTER_Y.up)
    : HEAD_CENTER_Y.level + t * (HEAD_CENTER_Y.down - HEAD_CENTER_Y.level);
});

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * The mascot beside the logo, watching the cursor.
 *
 * A point on the 9×8 grid of drawn frames eases toward the cursor's direction (frame-rate
 * independent smoothing), and the face shows the single drawn frame nearest that point,
 * crossfading 70ms between consecutive frames: a flipbook of 72 hand-drawn angles, so the turn
 * is smooth and always a clean drawing (no blended double images). The whole head also drifts
 * a pixel or two continuously with the cursor, so small movements feel fluid. Two stacked layers are
 * updated directly in requestAnimationFrame (no React re-renders), only while moving. On touch it
 * follows the finger; with reduced motion it stays still. The ~190 KB sprite loads on the first
 * pointer event; a 5 KB front frame shows until then.
 */
export function MascotFace({ size }: { size: number }) {
  const headRef = useRef<HTMLSpanElement>(null);
  const layerRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const head = headRef.current;
    const layers = layerRefs.current.filter((l): l is HTMLSpanElement => l !== null);
    if (!head || layers.length !== 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cell = size * ZOOM;
    const offsetX = size / 2 - HEAD_CENTER_X * cell;
    const paint = (el: HTMLSpanElement, row: number, col: number) => {
      const offsetY = size / 2 - HEAD_CENTER_Y_BY_ROW[row] * cell;
      el.style.backgroundPosition = `${offsetX - col * cell}px ${offsetY - row * cell}px`;
    };

    // pos: the eased point (the frame nearest it is shown); goal: the frame it settles on (whole
    // numbers, so at rest there's never a double image); raw: the exact cursor-derived point.
    const pos = { ...REST };
    const goal = { ...REST };
    const raw = { ...REST };
    const drift = { x: 0, y: 0 };
    let spriteReady = false;
    let spriteRequested = false;
    let frame = 0;
    let last = 0;
    let returnTimer: ReturnType<typeof setTimeout> | undefined;

    // Flipbook: always show the single drawn frame nearest the eased point. Neighbouring frames
    // differ so little that stepping through them reads as animation; a 70ms crossfade between
    // consecutive frames smooths each step without the double image that blending 4 frames gave.
    const [back, front] = layers;
    const shown = { row: REST.y, col: REST.x };
    const render = () => {
      const row = Math.round(clamp(pos.y, 0, ROWS - 1));
      const col = Math.round(clamp(pos.x, 0, COLS - 1));
      if (row !== shown.row || col !== shown.col) {
        paint(back, shown.row, shown.col);
        paint(front, row, col);
        front.animate([{ opacity: 0 }, { opacity: 1 }], { duration: CROSSFADE_MS, easing: "ease-out" });
        shown.row = row;
        shown.col = col;
      }
      head.style.transform = `translate(${drift.x.toFixed(2)}px, ${drift.y.toFixed(2)}px)`;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const t = 1 - Math.exp(-dt / FOLLOW_MS);
      pos.x += (goal.x - pos.x) * t;
      pos.y += (goal.y - pos.y) * t;
      // How far the cursor is toward the edge of the turn on this axis, from -1 to 1.
      const turned = (axis: "x" | "y") => {
        const d = raw[axis] - REST[axis];
        return d / (axis === "x" ? (d < 0 ? SPAN.left : SPAN.right) : d < 0 ? SPAN.up : SPAN.down) || 0;
      };
      const driftGoal = (axis: "x" | "y") => turned(axis) * DRIFT.overall + (raw[axis] - goal[axis]) * DRIFT.withinFrame;
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
    const nearest = (value: number, current: number, count: number) =>
      Math.abs(value - current) < 0.5 + HYSTERESIS ? current : clamp(Math.round(value), 0, count - 1);
    const lookAt = (x: number, y: number) => {
      raw.x = x;
      raw.y = y;
      goal.x = nearest(x, goal.x, COLS);
      goal.y = nearest(y, goal.y, ROWS);
      if (spriteReady && !frame) frame = requestAnimationFrame(tick);
    };

    const loadSprite = () => {
      if (spriteRequested) return;
      spriteRequested = true;
      const img = new Image();
      img.onload = () => {
        spriteReady = true;
        for (const layer of [back, front]) {
          layer.style.backgroundImage = `url(${SPRITE})`;
          layer.style.backgroundSize = `${cell * COLS}px ${cell * ROWS}px`;
          layer.style.opacity = "1";
          paint(layer, shown.row, shown.col);
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
      // From -1 (all the way left/up) to 1 (right/down), then onto the frames on that side of the rest frame.
      const tx = clamp(dx / rangeX, -1, 1);
      const ty = clamp(dy / rangeY, -1, 1);
      lookAt(REST.x + tx * (tx < 0 ? SPAN.left : SPAN.right), REST.y + ty * (ty < 0 ? SPAN.up : SPAN.down));
      clearTimeout(returnTimer);
      if (e.pointerType === "touch") returnTimer = setTimeout(() => lookAt(REST.x, REST.y), TOUCH_RETURN_MS);
    };
    const center = () => lookAt(REST.x, REST.y);

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
    backgroundPosition: `${size / 2 - HEAD_CENTER_X * cell}px ${size / 2 - HEAD_CENTER_Y_BY_ROW[REST.y] * cell}px`,
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
          {[0, 1].map((k) => (
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
