import { memo, useEffect, useState } from "react";
import { Brain } from "lucide-react";
import MegsyStar from "@/components/files/MegsyStar";
import { useZone } from "@/contexts/ZoneContext";

interface ThinkingLoaderProps {
  searchStatus?: string;
}

// Thinking states:
//  • 0 – <5s   : "Thinking…" / "بفكّر…"
//  • 5 – <15s : "Thinking deeply…" / "بفكّر بعمق…"
//  • >=15s   : star + status text
const ThinkingLoader = ({ searchStatus }: ThinkingLoaderProps) => {
  const [elapsed, setElapsed] = useState(0);
  const { isCleopatra } = useZone();
  useEffect(() => {
    const start = Date.now();
    const t = window.setInterval(() => setElapsed(Date.now() - start), 500);
    return () => window.clearInterval(t);
  }, []);

  const starColor = isCleopatra ? "#C9A84C" : "#5B8DEF";
  const starClass = isCleopatra ? "" : "text-[#5B8DEF]";
  const thinkingLabel = isCleopatra ? "بفكّر…" : "Thinking…";
  const deepLabel = isCleopatra ? "بفكّر بعمق…" : "Thinking deeply…";
  const rtl = isCleopatra;

  if (searchStatus?.trim()) {
    return (
      <div className="flex items-center gap-2 py-1" aria-live="polite" dir={rtl ? "rtl" : undefined}>
        <MegsyStar size={22} className={starClass} />
        <span className="ai-shimmer text-[13px] font-medium motion-reduce:animate-none">
          {searchStatus}
        </span>
      </div>
    );
  }

  if (elapsed < 5000) {
    return (
      <div className="flex items-center gap-2 py-1" aria-live="polite" dir={rtl ? "rtl" : undefined}>
        <MegsyStar size={16} className={starClass} />
        <span className="ai-shimmer text-[13px] font-medium motion-reduce:animate-none">
          {thinkingLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1" aria-live="polite" dir={rtl ? "rtl" : undefined}>
      <MegsyStar size={16} className={starClass} />
      <Brain className="w-4 h-4 animate-pulse" style={{ color: starColor }} />
      <span className="ai-shimmer text-[13px] font-medium motion-reduce:animate-none">
        {deepLabel}
      </span>
    </div>
  );
};

export default memo(ThinkingLoader);
