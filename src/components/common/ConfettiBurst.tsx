/** @doc ConfettiBurst — tiny CSS/motion confetti burst used to celebrate learning streaks. No external deps, respects prefers-reduced-motion, auto-cleans after ~1.2s. */

import { useEffect, useMemo, useState } from "react";
import { m as motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/studyProgress";

interface ConfettiBurstProps {
  /** When this key changes, a fresh burst plays. */
  trigger: number | string;
  /** Number of confetti particles (default 18). */
  count?: number;
  /** Optional palette override. */
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
];

/**
 * Fires a short-lived burst of confetti when `trigger` changes. Absolutely
 * positioned; parent must be `relative` (or the burst will paint from the
 * page corner). Silent when the user prefers reduced motion.
 */
export function ConfettiBurst({ trigger, count = 18, colors = DEFAULT_COLORS }: ConfettiBurstProps) {
  const reduced = prefersReducedMotion();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [trigger]);

  // Precompute particle configs per burst so each render feels organic.
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 60 + Math.random() * 80;
      return {
        id: i,
        color: colors[i % colors.length],
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 20, // slight upward bias
        rot: (Math.random() - 0.5) * 540,
        size: 6 + Math.random() * 6,
        delay: Math.random() * 0.08,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, count]);

  if (reduced) return null;

  return (
    <div
      key={key}
      className="pointer-events-none absolute inset-0 overflow-visible grid place-items-center"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.6 }}
          animate={{ opacity: 0, x: p.dx, y: p.dy, rotate: p.rot, scale: 1 }}
          transition={{ duration: 0.9 + Math.random() * 0.3, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            borderRadius: 2,
            position: "absolute",
          }}
        />
      ))}
    </div>
  );
}

export default ConfettiBurst;
