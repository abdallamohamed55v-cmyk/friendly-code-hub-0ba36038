import { memo } from "react";
import { motion } from "framer-motion";
import { useZone } from "@/contexts/ZoneContext";

export type AgentKey = "ceo" | "coo" | "cto" | "executor" | "assistant" | "system";

export const AGENT_COLORS: Record<AgentKey, { label: string; color: string; bg: string }> = {
  ceo: { label: "CEO", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  coo: { label: "COO", color: "#a855f7", bg: "rgba(168,85,247,0.10)" },
  cto: { label: "CTO", color: "#0ea5e9", bg: "rgba(14,165,233,0.10)" },
  executor: { label: "Executor", color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  assistant: { label: "Megsy", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  system: { label: "System", color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
};

type Props = {
  agent: AgentKey;
  size?: number;
  active?: boolean;
};

const PATH = "M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z";

const AgentStar = ({ agent, size = 16, active = false }: Props) => {
  const c = AGENT_COLORS[agent] ?? AGENT_COLORS.system;
  const { isCleopatra } = useZone();

  if (isCleopatra) {
    const uid = `agent-${agent}-${size}-${active ? "a" : "s"}`;
    const Svg = active ? (motion.svg as any) : "svg";
    const animProps = active
      ? {
          animate: { rotate: [0, 180, 360], scale: [1, 1.15, 1] },
          transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
        }
      : {};
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="shrink-0"
        style={{ opacity: active ? 1 : 0.5 }}
        {...animProps}
      >
        <defs>
          <clipPath id={`clip-${uid}`}>
            <path d={PATH} />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${uid})`}>
          <rect x="0" y="0" width="100" height="33.34" fill="#CE1126" />
          <rect x="0" y="33.34" width="100" height="33.33" fill="#FFFFFF" />
          <rect x="0" y="66.67" width="100" height="33.33" fill="#0A0A0A" />
          <circle cx="50" cy="50" r="6" fill="#C9A84C" opacity="0.95" />
        </g>
        <path d={PATH} fill="none" stroke="#0A0A0A" strokeWidth="2" opacity="0.55" />
      </Svg>
    );
  }

  if (!active) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ color: c.color, opacity: 0.35 }}
        className="shrink-0"
      >
        <path d={PATH} fill="currentColor" />
      </svg>
    );
  }
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ color: c.color }}
      className="shrink-0"
      animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d={PATH} fill="currentColor" />
    </motion.svg>
  );
};

export default memo(AgentStar);
