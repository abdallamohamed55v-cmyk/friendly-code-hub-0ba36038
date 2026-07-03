import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { glassModelMenu, glassModelMenuStyle } from "@/components/model-picker/glassModelMenuStyles";

export type ResearchDepth = "lite" | "medium" | "max";

interface ResearchDepthDropdownProps {
  researchDepth: ResearchDepth;
  setResearchDepth: (depth: ResearchDepth) => void;
  researchDepthOpen: boolean;
  setResearchDepthOpen: (open: boolean | ((v: boolean) => boolean)) => void;
}

const DEPTH_OPTIONS: Array<{ id: ResearchDepth; label: string; hint: string }> = [
  { id: "lite", label: "Lite", hint: "Quick overview" },
  { id: "medium", label: "Medium", hint: "Balanced depth" },
  { id: "max", label: "Max", hint: "Full deep dive" },
];

const LABEL_MAP: Record<ResearchDepth, string> = {
  lite: "Lite",
  medium: "Medium",
  max: "Max",
};

export default function ResearchDepthDropdown({
  researchDepth,
  setResearchDepth,
  researchDepthOpen,
  setResearchDepthOpen,
}: ResearchDepthDropdownProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number; width: number } | null>(null);
  const MENU_W = 200;

  useLayoutEffect(() => {
    if (!researchDepthOpen || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Anchor menu ABOVE the trigger using `bottom` so the menu always sits within
      // the viewport regardless of trigger position or safe-area insets.
      const bottom = Math.max(8, vh - r.top + 8);
      let left = r.right - MENU_W;
      left = Math.max(8, Math.min(left, vw - MENU_W - 8));
      setPos({ left, bottom, width: MENU_W });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [researchDepthOpen]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setResearchDepthOpen((v) => !v)}
        className={glassModelMenu.triggerPill}
        aria-label="Report depth"
        aria-expanded={researchDepthOpen}
      >
        <span>{LABEL_MAP[researchDepth]}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform ${researchDepthOpen ? "rotate-180" : ""}`}
        />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {researchDepthOpen && pos && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setResearchDepthOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  style={{
                    position: "fixed",
                    left: pos.left,
                    bottom: pos.bottom,
                    width: pos.width,
                    zIndex: 9999,
                    maxHeight: "50vh",
                    overflowY: "auto",
                    ...glassModelMenuStyle,
                  }}
                  className={`${glassModelMenu.panel} p-1.5`}
                >
                  {DEPTH_OPTIONS.map((d) => {
                    const active = researchDepth === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setResearchDepth(d.id);
                          setResearchDepthOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-left transition-all ${active ? "text-foreground bg-foreground/5" : "text-foreground/85 hover:text-foreground hover:bg-foreground/5"}`}
                      >
                        <span className="flex flex-col items-start">
                          <span>{d.label}</span>
                          <span className="text-[11px] font-normal text-foreground/50">
                            {d.hint}
                          </span>
                        </span>
                        {active && <Check className="w-4 h-4" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
