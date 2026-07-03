import { memo } from "react";
import { m as motion } from "framer-motion";
import { useZone } from "@/contexts/ZoneContext";

/**
 * Brand sparkle — 8-point star.
 * - Megsy zone: solid `currentColor` (text-primary by default).
 * - Cleopatra zone: filled with Egyptian-flag stripes (red / white / black).
 * Sized via the `size` prop (px). Pass `static` to render without animation.
 */
const STAR_PATH = "M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z";

const EGYPT_RED = "#CE1126";
const EGYPT_WHITE = "#FFFFFF";
const EGYPT_BLACK = "#0A0A0A";
const EGYPT_GOLD = "#C9A84C";

const CleopatraFill = ({ uid }: { uid: string }) => (
  <>
    <defs>
      <clipPath id={`clip-${uid}`}>
        <path d={STAR_PATH} />
      </clipPath>
    </defs>
    <g clipPath={`url(#clip-${uid})`}>
      <rect x="0" y="0" width="100" height="33.34" fill={EGYPT_RED} />
      <rect x="0" y="33.34" width="100" height="33.33" fill={EGYPT_WHITE} />
      <rect x="0" y="66.67" width="100" height="33.33" fill={EGYPT_BLACK} />
      {/* Saladin gold accent in the central white band */}
      <circle cx="50" cy="50" r="6" fill={EGYPT_GOLD} opacity="0.95" />
    </g>
    <path d={STAR_PATH} fill="none" stroke={EGYPT_BLACK} strokeWidth="2" opacity="0.55" />
  </>
);

const MegsyStar = ({
  size = 16,
  static: isStatic = false,
  className = "text-primary",
}: {
  size?: number;
  static?: boolean;
  className?: string;
}) => {
  const { isCleopatra } = useZone();
  const uid = `${size}-${isStatic ? "s" : "a"}`;

  if (isCleopatra) {
    const Svg = isStatic ? "svg" : (motion.svg as any);
    const animationProps = isStatic
      ? {}
      : {
          animate: { rotate: [0, 180, 360], scale: [1, 1.1, 1] },
          transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
        };
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Cleopatra AI"
        {...animationProps}
      >
        <CleopatraFill uid={uid} />
      </Svg>
    );
  }

  if (isStatic) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path d={STAR_PATH} fill="currentColor" />
      </svg>
    );
  }
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d={STAR_PATH} fill="currentColor" />
    </motion.svg>
  );
};

export default memo(MegsyStar);
