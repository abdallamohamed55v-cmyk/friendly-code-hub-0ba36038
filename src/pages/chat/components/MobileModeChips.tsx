import {
  Image as ImageIcon,
  Video as VideoIcon,
  Microscope,
  GraduationCap,
  Code2,
  FileText,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { m as motion } from "framer-motion";
import type { AgentDef } from "@/lib/agentRegistry";

type ChipId =
  | "code"
  | "images"
  | "video"
  | "deep-research"
  | "slides"
  | "docs"
  | "learning";

interface MobileModeChipsProps {
  chatMode: string;
  selectedAgent: AgentDef | null;
  handleModeChange: (mode: any) => void;
  setChatMode: (mode: any) => void;
  setSelectedAgent: (agent: AgentDef | null) => void;
  onAgentSelect?: (agentId: string) => void;
}

const CHIPS: { id: ChipId; label: string; Icon: LucideIcon }[] = [
  { id: "images", label: "Images", Icon: ImageIcon },
  { id: "video", label: "Videos", Icon: VideoIcon },
  { id: "deep-research", label: "Deep Research", Icon: Microscope },
  { id: "learning", label: "Learning", Icon: GraduationCap },
  { id: "code", label: "Coder", Icon: Code2 },
  { id: "docs", label: "Docs", Icon: FileText },
  { id: "slides", label: "Slides", Icon: Presentation },
];

/**
 * Horizontally scrollable chip strip shown above the mobile composer. Replaces
 * the modes list that used to live inside the "+" sheet.
 */
export function MobileModeChips({
  chatMode,
  selectedAgent,
  handleModeChange,
  setChatMode,
  setSelectedAgent,
  onAgentSelect,
}: MobileModeChipsProps) {
  const activeId: ChipId | null = (() => {
    if (chatMode && chatMode !== "normal") return chatMode as ChipId;
    if (selectedAgent?.id === "docs") return "docs";
    return null;
  })();

  const handleClick = (id: ChipId) => {
    if (id === "docs") {
      setChatMode("normal");
      onAgentSelect?.(id);
      return;
    }
    setSelectedAgent(null);
    if (activeId === id) {
      handleModeChange("normal");
    } else {
      handleModeChange(id as any);
    }
  };

  return (
    <div
      className="-mx-2 mb-2"
      data-chips-row
    >
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {CHIPS.map(({ id, label, Icon }) => {
          const active = activeId === id;
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(id)}
              className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-foreground text-background border-transparent"
                  : "bg-foreground/[0.06] text-foreground border-foreground/12 active:bg-foreground/[0.1]"
              }`}
            >
              <Icon className="w-[15px] h-[15px]" strokeWidth={2} />
              <span className="whitespace-nowrap">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
