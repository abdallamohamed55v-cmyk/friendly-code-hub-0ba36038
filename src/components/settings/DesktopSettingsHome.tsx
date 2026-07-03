import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import OliveAvatar from "@/components/branding/OliveAvatar";
import {
  AccountIcon,
  WorkspacesIcon,
  BillingIcon,
  ThemeIcon,
  IntegrationsIcon,
  MemoryIcon,
  SkillsIcon,
  NotificationsIcon,
  SupportIcon,
  PrivacyIcon,
  AiPersonalizationIcon,
} from "@/components/settings/SettingsIcons";

type Row = { title: string; path: string; hint?: string; kbd?: string };
type Section = {
  id: string;
  label: string;
  caption: string;
  Icon: React.ComponentType<{ className?: string }>;
  items: Row[];
};

const SECTIONS: Section[] = [
  {
    id: "account",
    label: "Account",
    caption: "Identity, billing and access",
    Icon: AccountIcon,
    items: [
      { title: "Profile", path: "/settings/profile", hint: "Name, avatar, contact", kbd: "P" },
      { title: "Plan & billing", path: "/settings/billing", hint: "Subscription, invoices", kbd: "B" },
      { title: "Switch account", path: "/settings/switch-account", hint: "Personal & workspace" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    caption: "How Megsy thinks for you",
    Icon: AiPersonalizationIcon,
    items: [
      { title: "Personalization", path: "/settings/ai-personalization", hint: "Tone, traits, behavior", kbd: "I" },
      { title: "Memory", path: "/settings/memory", hint: "What Megsy remembers", kbd: "M" },
      { title: "Skills", path: "/settings/skills", hint: "Tools and capabilities", kbd: "S" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    caption: "Teams, apps and signals",
    Icon: WorkspacesIcon,
    items: [
      { title: "Workspaces", path: "/settings/workspaces", hint: "Teams and projects", kbd: "W" },
      { title: "Integrations", path: "/settings/integrations", hint: "Connected apps" },
      { title: "Notifications", path: "/settings/notifications", hint: "Email and push", kbd: "N" },
    ],
  },
  {
    id: "system",
    label: "System",
    caption: "Appearance, language, data",
    Icon: ThemeIcon,
    items: [
      { title: "Appearance", path: "/settings/customization", hint: "Theme and density" },
      { title: "Language", path: "/settings/language", hint: "Interface language" },
      { title: "Privacy & data", path: "/settings/privacy", hint: "Exports, deletion" },
      { title: "System status", path: "/settings/system-status", hint: "Service health" },
    ],
  },
];

const SECTION_THEME: Record<string, { tint: string; ring: string; glow: string; accent: string; chip: string }> = {
  account: {
    tint: "linear-gradient(140deg, rgba(139,92,246,0.22) 0%, rgba(76,29,149,0.10) 55%, rgba(15,12,32,0.35) 100%)",
    ring: "rgba(167,139,250,0.28)",
    glow: "0 24px 60px -28px rgba(139,92,246,0.55)",
    accent: "#C4B5FD",
    chip: "rgba(139,92,246,0.18)",
  },
  intelligence: {
    tint: "linear-gradient(140deg, rgba(56,189,248,0.22) 0%, rgba(14,116,144,0.10) 55%, rgba(8,18,32,0.35) 100%)",
    ring: "rgba(125,211,252,0.28)",
    glow: "0 24px 60px -28px rgba(56,189,248,0.5)",
    accent: "#7DD3FC",
    chip: "rgba(56,189,248,0.18)",
  },
  workspace: {
    tint: "linear-gradient(140deg, rgba(52,211,153,0.22) 0%, rgba(6,95,70,0.10) 55%, rgba(10,22,18,0.35) 100%)",
    ring: "rgba(110,231,183,0.28)",
    glow: "0 24px 60px -28px rgba(52,211,153,0.5)",
    accent: "#6EE7B7",
    chip: "rgba(52,211,153,0.18)",
  },
  system: {
    tint: "linear-gradient(140deg, rgba(251,146,60,0.22) 0%, rgba(194,65,12,0.10) 55%, rgba(28,16,10,0.35) 100%)",
    ring: "rgba(253,186,116,0.28)",
    glow: "0 24px 60px -28px rgba(251,146,60,0.5)",
    accent: "#FDBA74",
    chip: "rgba(251,146,60,0.18)",
  },
};

export function DesktopSettingsHome() {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const account = useActiveAccount();
  const credits = account.credits;
  const userName = account.name || "User";
  const avatarUrl = account.avatarUrl;
  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [memberSince, setMemberSince] = useState<string>("—");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserEmail(user.email || "");
      if (user.created_at) {
        const d = new Date(user.created_at);
        setMemberSince(d.toLocaleDateString(undefined, { month: "short", year: "numeric" }));
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (profile && !cancelled) setPlan(profile.plan || "free");
    })();
    return () => { cancelled = true; };
  }, [account.kind]);

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const isFree = plan === "free";

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Up late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Mock usage ratio for visual; uses credits if available
  const usedRatio = credits !== null ? Math.min(1, Math.max(0, 1 - credits / 1000)) : 0.42;
  return (
    <div className="relative z-10 space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <header>
        <div className="mt-4 flex items-end flex-wrap">
          <div className="min-w-0">
            <p className="text-[13px] text-white/80">{greeting},</p>
            <h1 className="mt-1 text-[34px] leading-[1.05] font-semibold tracking-tight text-white">
              {userName}<span className="text-white/40">.</span>
            </h1>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { k: "Plan", v: planLabel, sub: isFree ? "Free tier" : "Active subscription" },
            { k: "Credits", v: credits !== null ? credits.toFixed(0) : "—", sub: "Available balance" },
            { k: "Member since", v: memberSince, sub: "Account age" },
            { k: "Status", v: "Active", sub: "All systems normal", dot: true },
          ].map((m) => (
            <div
              key={m.k}
              className="liquid-glass rounded-xl px-4 py-4 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/70 font-mono">{m.k}</p>
              <p className="mt-1.5 text-[20px] font-semibold tabular-nums text-white flex items-center gap-2 leading-none">
                {m.dot && <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                </span>}
                {m.v}
              </p>
              <p className="mt-1 text-[11px] text-white/60">{m.sub}</p>
            </div>
          ))}
        </div>
      </header>

      {/* ── Pulse + Upgrade row ─────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Usage pulse */}
        <div className="liquid-glass col-span-12 lg:col-span-7 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-mono">
                This cycle
              </p>
              <h3 className="mt-1 text-[16px] font-semibold text-white">Workspace pulse</h3>
              <p className="mt-0.5 text-[12px] text-white/70">
                Credits, sessions and Megsy activity across your workspace.
              </p>
            </div>
            <button
              onClick={() => go("/settings/billing")}
              className="liquid-glass-button h-8 px-3 rounded-lg text-[12px] font-medium text-white transition-colors flex items-center gap-1.5"
            >
              View usage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-mono">Credits used</p>
              <p className="text-[12px] text-white tabular-nums">{Math.round(usedRatio * 100)}%</p>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usedRatio * 100}%`,
                  background: "linear-gradient(90deg, #8B5CF6 0%, #6366F1 60%, #3B82F6 100%)",
                }}
              />
            </div>
          </div>

          {/* Mini sparkline-ish weeks */}
          <div className="mt-4 flex items-end gap-1 h-10">
            {Array.from({ length: 28 }).map((_, i) => {
              const h = 18 + Math.abs(Math.sin(i * 0.7) * 36) + (i % 5 === 0 ? 14 : 0);
              const palette = [
                "#8B5CF6","#6366F1","#3B82F6","#0EA5E9",
                "#06B6D4","#14B8A6","#10B981","#84CC16",
                "#EAB308","#F59E0B","#F97316","#EF4444",
                "#EC4899","#D946EF","#A855F7","#8B5CF6",
              ];
              const color = palette[i % palette.length];
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-colors"
                  style={{ height: `${h}%`, backgroundColor: color, opacity: 0.75 }}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-white/50 font-mono">
            <span>4w ago</span>
            <span>today</span>
          </div>
        </div>

        {/* Upgrade / identity */}
        <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-4">
          {isFree ? (
            <button
              onClick={() => go("/settings/billing")}
              className="group block w-full h-full text-left rounded-2xl p-5 relative overflow-hidden"
              style={{
                background:
                  "radial-gradient(120% 100% at 0% 0%, #A78BFA 0%, #7C3AED 35%, #4338CA 75%, #1E1B4B 100%)",
                boxShadow: "0 20px 60px -20px rgba(79,70,229,0.55)",
              }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-30"
                   style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
              <div className="relative">
                <div className="flex items-center gap-2 text-white/85">
                  <Sparkles className="w-4 h-4" />
                  <p className="text-[10px] uppercase tracking-[0.22em] font-mono">Megsy Premium</p>
                </div>
                <p className="mt-2 text-[20px] font-semibold leading-tight text-white">
                  Unlock unlimited intelligence.
                </p>
                <p className="mt-1 text-[12px] text-white/80 leading-relaxed max-w-xs">
                  Higher limits, priority models, advanced agents and early features.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white">
                  Upgrade plan
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </button>
          ) : (
            <div className="liquid-glass rounded-2xl p-5 h-full">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-mono">Plan</p>
              <p className="mt-1 text-[18px] font-semibold text-white">{planLabel}</p>
              <p className="mt-0.5 text-[12px] text-white/70">Thanks for being on Megsy.</p>
            </div>
          )}

          {/* Identity card */}
          <div className="liquid-glass rounded-2xl p-4 h-full flex items-center">
            <div className="flex items-center gap-3 w-full">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover border border-white/10" />
              ) : (
                <OliveAvatar seed={userEmail || userName} className="h-10 w-10 rounded-full border border-white/10" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
                <p className="text-[11px] text-white/60 truncate">{userEmail || "—"}</p>
              </div>
              <button
                onClick={() => go("/settings/profile")}
                className="liquid-glass-button h-8 px-3 rounded-md text-[11.5px] font-medium text-white transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category grid ───────────────────────────────────────── */}
      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3">
          All settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
              const Icon = section.Icon;
              const theme = SECTION_THEME[section.id];
              return (
                <article
                  key={section.id}
                  className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-xl"
                  style={{
                    background: theme.tint,
                    border: `1px solid ${theme.ring}`,
                    boxShadow: theme.glow,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-60"
                    style={{ background: theme.chip }}
                  />
                  <header className="relative px-5 pt-5 pb-4 flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl grid place-items-center shrink-0 border"
                      style={{
                        background: theme.chip,
                        borderColor: theme.ring,
                        color: theme.accent,
                      }}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-semibold text-white tracking-tight leading-tight">
                        {section.label}
                      </h3>
                      <p className="text-[11px] text-white/60">{section.caption}</p>
                    </div>
                  </header>

                  <ul className="relative px-2.5 pb-2.5 space-y-1">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <button
                          onClick={() => go(item.path)}
                          className="row group/row w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all duration-150 hover:bg-white/[0.08] border border-transparent hover:border-white/[0.08]"
                        >
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">{item.title}</p>
                            {item.hint && (
                              <p className="text-[11px] text-white/55 truncate">{item.hint}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ArrowUpRight
                              className="w-3.5 h-3.5 text-white/40 transition-all group-hover/row:-translate-y-0.5 group-hover/row:translate-x-0.5"
                              style={{ color: undefined }}
                            />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
      </section>

      {/* ── Footer rail: support + sign out ─────────────────────── */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {[
          { label: "Help & Support", hint: "Docs and contact", path: "/settings/support", Icon: SupportIcon },
          { label: "Privacy & Data", hint: "Exports and deletion", path: "/settings/privacy", Icon: PrivacyIcon },
          { label: "System Status", hint: "Live service health", path: "/settings/system-status", Icon: NotificationsIcon },
        ].map((r) => {
          const Icon = r.Icon;
          return (
            <button
              key={r.path}
              onClick={() => go(r.path)}
              className="liquid-glass group rounded-xl p-3 text-left transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <div className="h-8 w-8 rounded-lg grid place-items-center text-white shrink-0 bg-white/[0.06] border border-white/[0.08]">
                <Icon className="w-[15px] h-[15px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-white truncate">{r.label}</p>
                <p className="text-[10.5px] text-white/50 truncate">{r.hint}</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
            </button>
          );
        })}
      </footer>

      <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
        <span>v4.2 · {userEmail || "guest"}</span>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            go("/auth");
          }}
          className="h-8 px-3 rounded-md text-[11.5px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors border border-white/[0.08]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default DesktopSettingsHome;
