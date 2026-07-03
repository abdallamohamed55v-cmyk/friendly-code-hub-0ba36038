// Brand 8-point sparkle. Solid currentColor for Megsy; Egyptian-flag stripes for Cleopatra.
import { useZone } from "@/contexts/ZoneContext";

type Props = { className?: string };

const PATH =
  "M12 1.5c.4 0 .76.28.87.69l1.55 5.93a3 3 0 0 0 2.1 2.1l5.94 1.55a.9.9 0 0 1 0 1.74l-5.93 1.55a3 3 0 0 0-2.1 2.1l-1.55 5.94a.9.9 0 0 1-1.74 0l-1.55-5.93a3 3 0 0 0-2.1-2.1L1.55 13.5a.9.9 0 0 1 0-1.74l5.93-1.55a3 3 0 0 0 2.1-2.1l1.55-5.94c.11-.4.46-.67.87-.67Z";

const MegsyStar = ({ className = "w-4 h-4" }: Props) => {
  const { isCleopatra } = useZone();
  if (isCleopatra) {
    const uid = "cleo-star-sm";
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
          <clipPath id={uid}>
            <path d={PATH} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid})`}>
          <rect x="0" y="0" width="24" height="8" fill="#CE1126" />
          <rect x="0" y="8" width="24" height="8" fill="#FFFFFF" />
          <rect x="0" y="16" width="24" height="8" fill="#0A0A0A" />
          <circle cx="12" cy="12" r="1.4" fill="#C9A84C" />
        </g>
        <path d={PATH} fill="none" stroke="#0A0A0A" strokeWidth="0.6" opacity="0.55" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={PATH} />
    </svg>
  );
};

export default MegsyStar;
