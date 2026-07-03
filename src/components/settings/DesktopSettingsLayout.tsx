import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, PanelLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";
import { useSettingsShell } from "@/components/settings/SettingsShell";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
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
  SignOutIcon,
  AiPersonalizationIcon,
} from "@/components/settings/SettingsIcons";

type NavItem = {
  id: string;
  label: string;
  path: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: "NEW" | "SOON";
};
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Account",
    items: [
      { id: "overview", label: "Overview", path: "/settings", Icon: AccountIcon },
      { id: "profile", label: "Profile", path: "/settings/profile", Icon: AccountIcon },
      { id: "billing", label: "Plan & Billing", path: "/settings/billing", Icon: BillingIcon },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "workspaces", label: "Workspaces", path: "/settings/workspaces", Icon: WorkspacesIcon },
      { id: "integrations", label: "Integrations", path: "/settings/integrations", Icon: IntegrationsIcon },
    ],
  },
  {
    title: "AI",
    items: [
      { id: "ai-personalization", label: "Personalization", path: "/settings/ai-personalization", Icon: AiPersonalizationIcon },
      { id: "memory", label: "Memory", path: "/settings/memory", Icon: MemoryIcon },
      { id: "skills", label: "Skills", path: "/settings/skills", Icon: SkillsIcon },
    ],
  },
  {
    title: "System",
    items: [
      { id: "customization", label: "Appearance", path: "/settings/customization", Icon: ThemeIcon },
      { id: "notifications", label: "Notifications", path: "/settings/notifications", Icon: NotificationsIcon },
      { id: "privacy", label: "Privacy & Data", path: "/settings/privacy", Icon: PrivacyIcon },
    ],
  },
  {
    title: "Support",
    items: [{ id: "support", label: "Help Center", path: "/settings/support", Icon: SupportIcon }],
  },
];

interface DesktopSettingsLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function DesktopSettingsLayout({
  children,
  title,
  subtitle,
  action,
}: DesktopSettingsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const shell = useSettingsShell();
  const [collapsed, setCollapsed, toggleCollapsed] = useSidebarCollapsed();
  const go = (path: string) => navigate(path);
  const settingsVideoRef = useRef<HTMLVideoElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    go("/auth");
  };

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    if (path === "/settings") return currentPath === "/settings";
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  const isSettingsHome = location.pathname === "/settings";

  useEffect(() => {
    if (!isSettingsHome) return;
    const video = settingsVideoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    const handleVisibility = () => {
      if (!document.hidden) video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isSettingsHome]);

  // When mounted inside the persistent SettingsShell, portal just the inner
  // content (header + body) into the shell's main area so the sidebar/chrome
  // never unmounts between sub-pages.
  if (shell.active && shell.mainEl) {
    return createPortal(
      <>
        <div className="mx-auto max-w-6xl px-10 py-10 xl:px-12">
          <div className="settings-desktop-content pb-24 text-foreground">{children}</div>
        </div>
      </>,
      shell.mainEl,
    );
  }

  return (
    <AppLayout>
      <div
        data-settings-page
        data-settings-home={isSettingsHome ? "true" : undefined}
        className={cn(
          "settings-desktop-canvas relative h-full w-full overflow-hidden antialiased text-foreground",
          isSettingsHome ? "bg-transparent" : "bg-background"
        )}
      >
        {isSettingsHome && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <video
              ref={settingsVideoRef}
              className="absolute inset-0 h-full w-full object-cover"
              poster="/media/settings-background-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260411_104032_69319010-2458-492b-b04d-b40a5dfa4482.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 z-[1] settings-desktop-grid" aria-hidden />
        <div className="relative z-10 h-full w-full flex">
          <aside
            className={cn(
              "shrink-0 flex flex-col border-r border-white/10 bg-white/[0.06] backdrop-blur-xl transition-[width] duration-200 ease-out",
              collapsed ? "w-[72px]" : "w-72",
            )}
          >
            <div
              className={cn(
                "h-16 flex items-center transition-all",
                collapsed ? "px-3 justify-center" : "px-5 gap-2",
              )}
            >
              <button
                onClick={() => go("/chat")}
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors",
                  collapsed && "hidden",
                )}
                aria-label="Back to chat"
              >
                <ArrowLeft className="w-[18px] h-[18px]" />
              </button>
              <div className={cn("flex-1 min-w-0 overflow-hidden", collapsed && "hidden")}>
                <p className="text-[15px] leading-none font-semibold tracking-tight truncate text-foreground">
                  Settings
                </p>
              </div>
              <button
                onClick={toggleCollapsed}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors shrink-0"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand" : "Collapse"}
              >
                <PanelLeft className={cn("w-[18px] h-[18px] transition-transform", collapsed && "rotate-180")} />
              </button>
            </div>

            <nav className={cn("flex-1 overflow-y-auto py-5 space-y-6", collapsed ? "px-2" : "px-4")}>
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <p
                    className={cn(
                      "mb-2 text-[10px] font-semibold uppercase text-muted-foreground/70 transition-opacity",
                      collapsed ? "opacity-0 h-0 mb-0" : "px-3",
                    )}
                  >
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.path);
                      const Icon = item.Icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => go(item.path)}
                          className={cn(
                            "relative h-10 rounded-lg transition-colors border border-transparent",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.08]",
                            collapsed ? "w-full grid place-items-center px-0" : "w-full px-3 flex items-center gap-3 text-left text-[13px]",
                            active ? "font-medium" : "font-medium",
                          )}
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                          <span className={cn("truncate", collapsed && "hidden")}>{item.label}</span>
                          {item.badge && !collapsed && (
                            <span
                              className={cn(
                                "ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white",
                                item.badge === "NEW" ? "bg-amber-500" : "bg-zinc-400",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Sign out */}
            <div className={cn("py-4 border-t border-border/50", collapsed ? "px-2" : "px-4")}>
              <button
                onClick={handleLogout}
                className={cn(
                  "h-10 rounded-lg border border-white/10 bg-white/[0.06] transition-colors text-white/70 hover:text-destructive hover:bg-white/[0.10]",
                  collapsed ? "w-full grid place-items-center px-0" : "w-full px-3 flex items-center gap-2 text-[13px] font-medium",
                )}
                title={collapsed ? "Sign out" : undefined}
              >
                <SignOutIcon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                <span className={cn(collapsed && "hidden")}>Sign out</span>
              </button>
            </div>
          </aside>

          {/* Main */}
          <main className={cn("flex-1 overflow-y-auto", isSettingsHome ? "bg-transparent" : "bg-background/70")}>
            <div className="mx-auto max-w-6xl px-10 py-10 xl:px-12">
              <div className="settings-desktop-content pb-24 text-foreground">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsHeader({
  title,
  subtitle,
  action,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  if (!title && !subtitle && !action) return null;
  return (
    <div className="border-b border-border/50 bg-card/25 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-10 py-8 xl:px-12 flex items-start justify-between gap-6">
        <div className="min-w-0">
          {title && (
            <h1 className="text-[30px] leading-tight font-semibold text-foreground">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 text-[14px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export default DesktopSettingsLayout;
