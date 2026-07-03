/** @doc useBrandLogo — returns the correct brand icon URL for the active zone (Megsy default, Cleopatra Egyptian-flag variant). */
import { useZone } from "@/contexts/ZoneContext";
import megsyProjectLogo from "@/assets/megsy-project-logo.png";
import cleopatraIcon from "@/assets/cleopatra-icon-transparent.png";

const megsyIconUrl = megsyProjectLogo;

export function useBrandLogo(): string {
  const { isCleopatra } = useZone();
  return isCleopatra ? cleopatraIcon : megsyIconUrl;
}

export { megsyIconUrl as megsyIcon, cleopatraIcon };
