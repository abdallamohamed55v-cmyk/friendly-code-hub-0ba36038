/** @doc Customize accent color, chat appearance and keyboard behavior. */
import { useState, useCallback, useEffect } from "react";
import { Check, Moon, CornerDownLeft } from "lucide-react";
import { SubShell, SubSection, SubCard, SubStatStrip } from "@/components/settings/SubShell";
import { getSendMode, setSendMode, type SendMode } from "@/lib/composerKey";

const accentColors = [
  { hsl: "262 60% 55%", hex: "#7c5cfc" },
  { hsl: "210 80% 55%", hex: "#3b82f6" },
  { hsl: "142 50% 50%", hex: "#22c55e" },
  { hsl: "330 70% 55%", hex: "#ec4899" },
  { hsl: "25 90% 55%", hex: "#f97316" },
  { hsl: "160 60% 45%", hex: "#14b8a6" },
  { hsl: "0 70% 55%", hex: "#ef4444" },
  { hsl: "270 60% 55%", hex: "#8b5cf6" },
  { hsl: "180 60% 45%", hex: "#06b6d4" },
  { hsl: "45 90% 50%", hex: "#eab308" },
  { hsl: "150 60% 40%", hex: "#10b981" },
  { hsl: "340 80% 55%", hex: "#f43f5e" },
  { hsl: "230 70% 60%", hex: "#5b6cf5" },
  { hsl: "290 65% 60%", hex: "#c855f0" },
  { hsl: "12 85% 58%", hex: "#f56042" },
  { hsl: "195 85% 50%", hex: "#0ea5e9" },
  { hsl: "85 60% 45%", hex: "#84cc16" },
  { hsl: "320 75% 60%", hex: "#e84cc4" },
];

const CustomizationPage = () => {
  const [currentAccent, setCurrentAccent] = useState(
    () => localStorage.getItem("accent") || "262 60% 55%",
  );
  const [sendMode, setSendModeState] = useState<SendMode>(() => getSendMode());

  const handleSendModeChange = useCallback((mode: SendMode) => {
    setSendMode(mode);
    setSendModeState(mode);
  }, []);

  // Lock the theme to the current dark experience.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    if (localStorage.getItem("theme") !== "dark") {
      localStorage.setItem("theme", "dark");
      window.dispatchEvent(new Event("themechange-custom"));
    }
  }, []);

  const handleAccentChange = useCallback((hsl: string) => {
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--user-bubble", `hsl(${hsl})`);
    localStorage.setItem("accent", hsl);
    localStorage.setItem("userBubbleColor", `hsl(${hsl})`);
    setCurrentAccent(hsl);
  }, []);

  const currentHex =
    accentColors.find((c) => c.hsl === currentAccent)?.hex || "#7c5cfc";

  const activeAction = (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">
          Active
        </p>
        <p className="text-[12.5px] font-mono text-foreground">{currentHex}</p>
      </div>
      <span
        className="w-9 h-9 rounded-full border border-border/70"
        style={{ background: currentHex }}
      />
    </div>
  );

  return (
    <SubShell
      title="Appearance"
      subtitle="Pick an accent — it flows through chat bubbles, links and primary actions."
      backTo="/settings"
      action={activeAction}
    >
      <SubSection title="Overview" description="Your current appearance at a glance.">
        <SubStatStrip
          items={[
            { label: "Accent", value: currentHex, sub: "Live across the app" },
            { label: "Theme", value: "Dark", sub: "Locked for now" },
            { label: "Palette", value: `${accentColors.length}`, sub: "Curated hues" },
            { label: "Mode", value: "Chat", sub: "Applied to bubbles" },
          ]}
        />
      </SubSection>

      <SubSection
        title="Preview"
        description="How your conversations will look with this accent."
      >
        <SubCard>
          <div className="space-y-2.5">
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-foreground/[0.05] border border-border/60 max-w-[75%]">
                <p className="text-[13px] text-foreground">What should we ship next?</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[75%] shadow-sm"
                style={{ background: `hsl(${currentAccent})` }}
              >
                <p className="text-primary-foreground text-[13px]">
                  Let's redesign the settings — make every page feel intentional.
                </p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-foreground/[0.05] border border-border/60 max-w-[75%]">
                <p className="text-[13px] text-foreground">On it. ✨</p>
              </div>
            </div>
          </div>
        </SubCard>
      </SubSection>

      <SubSection
        title="Accent color"
        description="Choose the brand hue that colors every primary surface."
      >
        <SubCard>
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5">
            {accentColors.map((c) => {
              const isSelected = currentAccent === c.hsl;
              return (
                <button
                  key={c.hex}
                  onClick={() => handleAccentChange(c.hsl)}
                  className={`relative aspect-square rounded-xl border transition active:scale-95 ${
                    isSelected
                      ? "border-foreground/70 scale-[1.04]"
                      : "border-border/60 hover:border-foreground/40"
                  }`}
                  style={{ background: c.hex }}
                  aria-label={c.hex}
                >
                  {isSelected && (
                    <span className="absolute inset-0 grid place-items-center bg-black/25 rounded-xl">
                      <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </SubCard>
      </SubSection>

      <SubSection
        title="Keyboard"
        description="How the Enter key behaves in the chat composer on desktop."
      >
        <SubCard>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-foreground/[0.06] border border-border/60 text-foreground/80 shrink-0">
              <CornerDownLeft className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-medium text-foreground">Send with Enter</p>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                {sendMode === "enter"
                  ? "Enter sends · Shift + Enter inserts a new line"
                  : "Shift + Enter sends · Enter inserts a new line"}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-foreground/[0.06] border border-border/60 p-0.5 shrink-0">
              {(["enter", "shift_enter"] as SendMode[]).map((mode) => {
                const active = sendMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSendModeChange(mode)}
                    className={`px-3 py-1 rounded-full text-[11.5px] font-medium transition ${
                      active
                        ? "bg-foreground/90 text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "enter" ? "Enter" : "Shift+Enter"}
                  </button>
                );
              })}
            </div>
          </div>
        </SubCard>
      </SubSection>

      <SubSection title="Theme" description="Global appearance mode.">
        <SubCard>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-foreground/[0.06] border border-border/60 text-foreground/80 shrink-0">
              <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-medium text-foreground">Dark mode</p>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                Light mode is planned for a future release.
              </p>
            </div>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] px-2 py-1 rounded-full bg-foreground/[0.06] border border-border/60 text-muted-foreground">
              Locked
            </span>
          </div>
        </SubCard>
      </SubSection>
    </SubShell>
  );
};

export default CustomizationPage;
