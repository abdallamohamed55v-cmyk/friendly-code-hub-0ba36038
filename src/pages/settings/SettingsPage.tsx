/** @doc Settings home — soft lavender mobile layout with centered profile and grouped rows. */
import { useState, useEffect, useMemo, type FC, type SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopSettingsLayout from "@/components/settings/DesktopSettingsLayout";
import DesktopSettingsHome from "@/components/settings/DesktopSettingsHome";

import { supabase } from "@/integrations/supabase/client";

import OliveAvatar from "@/components/branding/OliveAvatar";
import MegsyStar from "@/components/branding/MegsyStar";
import {
  AccountIcon,
  WorkspacesIcon,
  BillingIcon,
  AiPersonalizationIcon,
  MemoryIcon,
  SkillsIcon,
  AppearanceIcon,
  NotificationsIcon,
  IntegrationsIcon,
  SupportIcon,
  PrivacyIcon,
  StatusIcon,
  LogoutIcon,
} from "@/components/settings/SettingsIcons";
import { useActiveAccount } from "@/hooks/useActiveAccount";


type Row = { icon: FC<SVGProps<SVGSVGElement>>; label: string; path: string };
type Group = { title: string; rows: Row[] };

const SettingsPage = () => {
  const navigate = useNavigate();
  const go = (path: string) => navigate(path);
  const account = useActiveAccount();

  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("free");

  const userName = account.name || "User";
  const avatarUrl = account.avatarUrl;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles").select("plan").eq("id", user.id).single();
      if (profile && !cancelled) setPlan(profile.plan || "free");
    })();
    return () => { cancelled = true; };
  }, []);

  const isPremium = useMemo(
    () => !["free", "", null, undefined].includes((plan || "").toLowerCase()),
    [plan]
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    go("/auth");
  };

  const groups: Group[] = [
    {
      title: "Account Settings",
      rows: [
        { icon: AccountIcon, label: "Account", path: "/settings/profile" },
        { icon: WorkspacesIcon, label: "Workspaces", path: "/settings/workspaces" },
        { icon: BillingIcon, label: "Billing", path: "/settings/billing" },
      ],
    },
    {
      title: "AI",
      rows: [
        { icon: AiPersonalizationIcon, label: "Personalization", path: "/settings/ai-personalization" },
        { icon: MemoryIcon, label: "Memory", path: "/settings/memory" },
        { icon: SkillsIcon, label: "Skills", path: "/settings/skills" },
      ],
    },
    {
      title: "Preferences",
      rows: [
        { icon: AppearanceIcon, label: "Appearance", path: "/settings/customization" },
        { icon: NotificationsIcon, label: "Notifications", path: "/settings/notifications" },
        { icon: IntegrationsIcon, label: "Integrations", path: "/settings/integrations" },
      ],
    },
    {
      title: "Settings",
      rows: [
        { icon: SupportIcon, label: "Help & Support", path: "/settings/support" },
        { icon: PrivacyIcon, label: "Privacy & Data", path: "/settings/privacy" },
        { icon: StatusIcon, label: "System Status", path: "/settings/system-status" },
      ],
    },
  ];

  const isMobile = useIsMobile();
  if (!isMobile) {
    return (
      <DesktopSettingsLayout>
        <DesktopSettingsHome />
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-md mx-auto px-5 pt-4 pb-10">
        {/* Top bar */}
        <div className="relative flex items-center justify-center h-11">
          <button
            onClick={() => go("/chat")}
            aria-label="Back"
            className="absolute left-0 w-10 h-10 rounded-full bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center active:scale-95 transition"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight">Settings</h1>
        </div>

        {/* Profile */}
        <div className="mt-6 flex flex-col items-center">
          <div className="w-[92px] h-[92px] rounded-full overflow-hidden ring-2 ring-foreground/15 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <OliveAvatar seed={userEmail || userName} className="w-full h-full" />}
          </div>
          <p className="mt-3 text-[18px] font-semibold tracking-tight">{userName}</p>
          <p className="text-[13px] text-foreground/55 mt-0.5">{userEmail || "—"}</p>
        </div>

        {/* Premium upgrade CTA */}
        <button
          onClick={() => go("/pricing")}
          className="mt-6 w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left text-white transition active:scale-[0.99] border border-white/10"
          style={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #4F46E5 100%)",
            boxShadow: "0 12px 28px -12px rgba(99, 102, 241, 0.6)",
          }}
        >
          <MegsyStar className="w-6 h-6 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold leading-tight">Upgrade to Premium</p>
          </div>
        </button>


        {/* Groups */}
        <div className="mt-6 space-y-5">
          {groups.map(group => (
            <section key={group.title}>
              <h2 className="text-[12px] font-medium text-foreground/50 px-1 mb-2">
                {group.title}
              </h2>
              <div className="rounded-2xl bg-card border border-foreground/10 overflow-hidden">
                {group.rows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.label}
                      onClick={() => go(row.path)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-foreground/[0.03] active:bg-foreground/[0.06] transition"
                    >
                      <Icon className="w-[18px] h-[18px] text-foreground/80 shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 text-[15px] font-medium text-foreground">{row.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Logout group */}
          <section>
            <div className="rounded-2xl bg-card border border-foreground/10 overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-foreground/[0.03] active:bg-foreground/[0.06] transition"
              >
                <LogoutIcon className="w-[18px] h-[18px] text-rose-400 shrink-0" strokeWidth={1.8} />
                <span className="flex-1 text-[15px] font-medium text-rose-400">Logout</span>
              </button>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
