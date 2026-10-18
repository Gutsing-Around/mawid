import Image from "next/image";

/** The site mascot's poses (transparent WebPs in public/mascot, sized to their real ratio). */
const POSES = {
  celebrate: { width: 612, height: 640 },
  fix: { width: 640, height: 583 },
  confused: { width: 550, height: 640 },
  sleepy: { width: 527, height: 640 },
  cool: { width: 563, height: 640 },
} as const;

export type MascotPose = keyof typeof POSES;

/**
 * The mascot, used for a few moments only: empty states, the 404 and error pages, and the
 * "added to my list" pop-up. Decorative: the text next to it always says the same thing.
 */
export function Mascot({
  pose,
  height,
  className = "",
  priority = false,
}: {
  pose: MascotPose;
  /** Rendered height in CSS pixels; width follows the pose's ratio. */
  height: number;
  className?: string;
  priority?: boolean;
}) {
  const { width: w, height: h } = POSES[pose];
  return (
    <Image
      src={`/mascot/${pose}.webp`}
      alt=""
      aria-hidden
      width={Math.round((w / h) * height)}
      height={height}
      priority={priority}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
