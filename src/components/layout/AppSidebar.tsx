import { startTransition, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation, type NavigateOptions } from "react-router-dom";
import { Pin, Plus, PanelLeft, LogIn, Cloud, Sparkles, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserSafe } from "@/lib/authSafe";

import { AnimatePresence, motion } from "framer-motion";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import MegsyStar from "@/components/files/MegsyStar";
import { useBrandLogo } from "@/hooks/useBrandLogo";

import { MediaIcon, CornIcon, EarnIcon, HomeIcon } from "@/components/sidebar/SidebarIcons";
import { useActiveWorkspaceId, WORKSPACE_CHANGED_EVENT } from "@/lib/activeWorkspace";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import SidebarSubNav from "@/components/layout/SidebarSubNav";
import { isCleopatraPath, pathForZone, stripZonePrefix } from "@/lib/zoneRouting";
import { prefetchRoute as sharedPrefetchRoute } from "@/hooks/usePrefetchRoute";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  mode: string;
  is_pinned?: boolean;
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation?: (id: string) => void;
  activeConversationId?: string | null;
  currentMode?: string;
  inline?: boolean;
  forceExpanded?: boolean;
}

const wsTag = (ws: string | null) => ws ?? "personal";
const cacheKey = (mode: string, uid: string, ws: string | null) =>
  `sidebar:convos:${mode}:${uid}:${wsTag(ws)}`;
const userCacheKey = (uid: string) => `sidebar:user:${uid}`;
const lastUserKey = "sidebar:last-user";
// Route prefetch is now centralized in usePrefetchRoute — the sidebar shares
// the same in-memory cache with the landing navbar so a hover in one place
// benefits the other. Zone-prefixed paths get normalized before lookup.
const prefetchRoute = (path: string) =>
  sharedPrefetchRoute(stripZonePrefix(path.split(/[?#]/)[0]));

const sectionAccentFor = (pathname: string, mode: string): { name: string; hsl: string } => {
  if (pathname.startsWith("/media") || pathname.startsWith("/images") || mode === "images")
    return { name: "images", hsl: "338 100% 71%" };
  if (pathname.startsWith("/videos") || pathname.startsWith("/cinema") || mode === "videos")
    return { name: "videos", hsl: "187 85% 53%" };
  if (
    pathname.startsWith("/megsy") ||
    pathname.startsWith("/agents") ||
    pathname.startsWith("/workspace") ||
    mode === "megsy-pr" ||
    mode === "build"
  )
    return { name: "os", hsl: "158 64% 52%" };
  return { name: "chat", hsl: "252 92% 67%" };
};

function groupByDate(items: Conversation[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - day;
  const startOf7Days = startOfToday - 6 * day;
  const startOf30Days = startOfToday - 29 * day;
  const buckets: Record<string, Conversation[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "Last 7 Days": [],
    "Last 30 Days": [],
    Older: [],
  };
  const byUpdated = (a: Conversation, b: Conversation) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  const pinned: Conversation[] = [];
  const others: Conversation[] = [];
  for (const c of items) {
    if (c.is_pinned) pinned.push(c);
    else others.push(c);
  }
  pinned.sort(byUpdated);
  others.sort(byUpdated);
  buckets.Pinned = pinned;
  for (const c of others) {
    const t = new Date(c.updated_at).getTime();
    if (t >= startOfToday) buckets.Today.push(c);
    else if (t >= startOfYesterday) buckets.Yesterday.push(c);
    else if (t >= startOf7Days) buckets["Last 7 Days"].push(c);
    else if (t >= startOf30Days) buckets["Last 30 Days"].push(c);
    else buckets.Older.push(c);
  }
  return buckets;
}

const AppSidebar = ({
  open,
  onClose,
  onNewChat,
  onSelectConversation,
  activeConversationId,
  currentMode = "chat",
  inline = false,
  forceExpanded = false,
}: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeWs = useActiveWorkspaceId();
  const megsyLogo = useBrandLogo();

  // Hydrate user from cache instantly so the bottom pill never flashes.
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isBuildMode = currentMode === "build";
  const showRecent = ["chat", "learning", "shopping", "research", "slides", "videos", "images", "code"].includes(currentMode);
  const showsUnifiedChatHistory =
    currentMode === "chat" || currentMode === "research" || currentMode === "slides";
  // In the general (chat) sidebar, surface conversations from every service —
  // videos, images, code, learning, shopping — so users can find any past
  // session without switching workspaces.
  const showsAllServicesHistory = currentMode === "chat";

  // Hydrate from local cache (user info + conversations) before network.
  // SECURITY: never read credits / subscription / billing info from localStorage —
  // those are sensitive values that must always come from the server.
  useEffect(() => {
    let cancelled = false;

    const hydrateSafeCache = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const sessionUid = session?.user?.id;
        const lastUid = localStorage.getItem(lastUserKey);

        if (!sessionUid) {
          setConversations([]);
          setUserName("");
          setAvatarUrl(null);
          return;
        }

        if (lastUid && lastUid !== sessionUid) {
          localStorage.removeItem(userCacheKey(lastUid));
        }

        const raw = localStorage.getItem(userCacheKey(sessionUid));
        if (!cancelled && raw) {
          const u = JSON.parse(raw);
          if (u.userName) setUserName(u.userName);
          if (u.avatarUrl !== undefined) setAvatarUrl(u.avatarUrl);
        }

        const conv = localStorage.getItem(cacheKey(currentMode, sessionUid, activeWs));
        if (!cancelled && conv) {
          const arr = JSON.parse(conv);
          if (Array.isArray(arr)) setConversations(arr);
        }
      } catch {
        if (!cancelled) setConversations([]);
      }
    };

    void hydrateSafeCache();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showRecent || !currentUserId) return;
    try {
      const raw = localStorage.getItem(cacheKey(currentMode, currentUserId, activeWs));
      if (raw) {
        const cached = JSON.parse(raw) as Conversation[];
        if (Array.isArray(cached)) setConversations(cached);
        else setConversations([]);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    }
  }, [currentUserId, currentMode, showRecent, activeWs]);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (showRecent) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, currentUserId, activeWs]);

  useEffect(() => {
    const onFocus = () => {
      if (showRecent) loadConversations();
    };
    const onConversationsChanged = () => {
      if (showRecent) loadConversations();
    };
    const onWorkspaceChanged = () => {
      // Clear the visible list immediately so old workspace data does not flash.
      setConversations([]);
      if (showRecent) loadConversations();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("megsy:conversations-changed", onConversationsChanged);
    window.addEventListener(WORKSPACE_CHANGED_EVENT, onWorkspaceChanged);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("megsy:conversations-changed", onConversationsChanged);
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, onWorkspaceChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, showRecent, currentUserId]);

  const loadUserInfo = async () => {
    const user = await getUserSafe();
    if (!user) {

      setCurrentUserId(null);
      setUserName("");
      setAvatarUrl(null);
      setCredits(0);
      setConversations([]);
      try {
        localStorage.removeItem(lastUserKey);
      } catch {}
      return;
    }
    setCurrentUserId(user.id);
    const emailPrefix = user.email?.split("@")[0] || "User";
    const fallbackName = user.user_metadata?.full_name || emailPrefix;
    setUserName(fallbackName);
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, avatar_url, display_name")
      .eq("id", user.id)
      .single();
    const next = { userName: fallbackName, avatarUrl: user.user_metadata?.avatar_url || null };
    let nextCredits = 0;
    if (profile) {
      nextCredits = Number(profile.credits) || 0;
      next.avatarUrl = profile.avatar_url || next.avatarUrl;
      if (profile.display_name) next.userName = profile.display_name;
      setCredits(nextCredits);
      setAvatarUrl(next.avatarUrl);
      setUserName(next.userName);
    }
    try {
      localStorage.setItem(lastUserKey, user.id);
      // SECURITY: do NOT persist credits in localStorage.
      localStorage.setItem(userCacheKey(user.id), JSON.stringify(next));
    } catch {}
  };

  const loadConversations = async () => {
    const user = await getUserSafe();
    if (!user) return;

    const validModes = ["code", "images", "videos", "learning", "shopping", "research", "slides"];
    const modeFilter = validModes.includes(currentMode) ? currentMode : "chat";
    const modesToFetch = showsAllServicesHistory
      ? ["chat", "research", "slides", "videos", "images", "code", "learning", "shopping"]
      : showsUnifiedChatHistory
        ? ["chat", "research", "slides"]
        : [modeFilter];

    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);
    const memberConvIds = (memberRows || []).map((r: any) => r.conversation_id);

    let query = supabase
      .from("conversations")
      .select("id, title, updated_at, mode, is_pinned")
      .in("mode", modesToFetch);
    if (memberConvIds.length > 0) {
      query = query.or(`user_id.eq.${user.id},id.in.(${memberConvIds.join(",")})`);
    } else {
      query = query.eq("user_id", user.id);
    }
    // Filter by active workspace: a workspace shows only its conversations,
    // "personal" mode (no workspace) shows only conversations not tied to any workspace.
    if (activeWs) {
      query = query.eq("workspace_id", activeWs);
    } else {
      query = query.is("workspace_id", null);
    }
    const { data } = await query
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) {
      setConversations(data);
      try {
        localStorage.setItem(cacheKey(modeFilter, user.id, activeWs), JSON.stringify(data));
      } catch {}
    } else {
      setConversations([]);
    }
  };

  const account = useActiveAccount();
  const displayName = account.name || userName || "User";
  const displayAvatar = account.avatarUrl ?? avatarUrl;
  const displayCredits = account.credits || credits;
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const [collapsed, setCollapsed, toggleCollapsed] = useSidebarCollapsed();
  const isCollapsed = inline && collapsed && !forceExpanded;
  const groups = useMemo(() => groupByDate(conversations), [conversations]);
  const sectionAccent = useMemo(
    () => sectionAccentFor(stripZonePrefix(location.pathname), currentMode),
    [location.pathname, currentMode],
  );

  // Desktop inline: collapse the sidebar immediately after any selection.
  const closeInline = useCallback(() => {
    if (inline) setCollapsed(true);
  }, [inline, setCollapsed]);

  const navigateSmoothly = useCallback(
    (path: string, options?: NavigateOptions) => {
      const target = pathForZone(path, location.pathname);
      onClose();
      closeInline();
      void prefetchRoute(target);
      startTransition(() => navigate(target, options));
    },
    [closeInline, location.pathname, navigate, onClose],
  );

  const isCleopatra = false;
  const currentAppPath = stripZonePrefix(location.pathname);

  const navItems: Array<{
    label: string;
    Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    path: string;
    match: (p: string) => boolean;
    isNew?: boolean;
  }> = [
    {
      label: "Home",
      Icon: HomeIcon,
      path: "/",
      match: (p: string) => p === "/" || p.startsWith("/chat"),
    },
    {
      label: "Library",
      Icon: MediaIcon,
      path: "/library",
      match: (p: string) => p.startsWith("/library"),
    },
    // Showcase hidden by user request
    {
      label: "Earn",
      Icon: EarnIcon,
      path: "/settings/referrals",
      match: (p: string) => p.startsWith("/settings/referrals"),
      isNew: true,
    },
  ];

  const handleNewChat = () => {
    if (isBuildMode) navigateSmoothly("/build");
    else {
      onNewChat();
      onClose();
      closeInline();
    }
  };

  // Cartoon palette (mirrors ReferralsPage)
  const PAGE_BG = "#000000";
  const SURFACE = "hsl(var(--surface-1))";
  const SURFACE_2 = "hsl(var(--surface-3))";
  const BORDER = "hsl(var(--surface-4))";
  const TEXT = "hsl(var(--brand-parchment))";
  const MUTED = "hsl(var(--brand-muted))";
  const INK = "hsl(var(--brand-ink))";
  const YELLOW = "hsl(var(--brand-action))";
  const MINT = "hsl(var(--brand-mint))";
  const cartoonFont = '"Space Grotesk", "Inter", system-ui, sans-serif';

  // Cartoon-style "sticker" surface for prominent buttons (new chat, etc.)
  const glassStyle: React.CSSProperties = {
    backgroundColor: SURFACE_2,
    border: `2px solid ${BORDER}`,
    color: TEXT,
    boxShadow: `3px 3px 0 ${BORDER}`,
  };

  // Sidebar shell — flat cartoon dark
  const panelGlassStyle: React.CSSProperties = {
    ["--section-accent" as any]: sectionAccent.hsl,
    backgroundColor: PAGE_BG,
    color: TEXT,
    fontFamily: cartoonFont,
    boxShadow: `inset -2px 0 0 ${BORDER}`,
  };

  // Active item — bright yellow pill, no border
  const activeItemStyle: React.CSSProperties = {
    backgroundColor: YELLOW,
    color: INK,
    fontWeight: 800,
  };

  const innerContent = (
    <div
      data-app-sidebar-panel="true"
      className="flex flex-col h-full w-full text-foreground relative overflow-hidden"
      style={panelGlassStyle}
    >
      {/* HEADER — brand + collapse */}
      <div
        className={`relative shrink-0 h-14 px-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
        style={{ borderBottom: `2px solid ${BORDER}` }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2 min-w-0 pl-1">
            <img
              src={megsyLogo}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain shrink-0"
              loading="eager"
              decoding="async"
            />
            <span
              className="text-[18px] tracking-tight truncate"
              style={{ fontWeight: 900, letterSpacing: "-0.02em", color: TEXT }}
            >
              {isCleopatra ? "Cleopatra AI" : "Megsy"}
            </span>
          </div>
        )}

        {inline && (
          <button
            onClick={toggleCollapsed}
            className="w-9 h-9 grid place-items-center rounded-full transition active:scale-90"
            style={{ color: TEXT, border: "none", backgroundColor: "transparent" }}
            aria-label="Toggle sidebar"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <PanelLeft className="w-[16px] h-[16px]" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* NAV — fixed top section */}
      <div
        className={`shrink-0 ${isCollapsed ? "px-2 py-2 flex flex-col items-center gap-1" : "px-3 py-3 space-y-1"}`}
      >
        {navItems.map(({ label, Icon, path, match, isNew }) => {
          const active = match(currentAppPath);
          if (isCollapsed) {
            return (
              <button
                key={label}
                onClick={() => navigateSmoothly(path)}
                onMouseEnter={() => prefetchRoute(path)}
                onFocus={() => prefetchRoute(path)}
                title={label}
                aria-label={label}
                style={active ? activeItemStyle : { color: TEXT, backgroundColor: "transparent" }}
                className="relative w-10 h-10 grid place-items-center rounded-full transition-all active:scale-95"
              >
                <Icon size={18} strokeWidth={2.2} />
              </button>
            );
          }
          return (
            <button
              key={label}
              onClick={() => navigateSmoothly(path)}
              onMouseEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              style={active ? activeItemStyle : { color: TEXT, backgroundColor: "transparent" }}
              className="w-full h-11 px-4 flex items-center gap-3 rounded-full transition-all active:scale-95"
            >
              <Icon size={18} strokeWidth={2.2} />
              <span className="text-[14px]" style={{ fontWeight: active ? 800 : 700 }}>
                {label}
              </span>
              {isNew && (
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: MINT,
                    color: INK,
                    fontWeight: 800,
                    border: `2px solid ${INK}`,
                  }}
                >
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Media sub-nav — only on media routes */}
      {currentAppPath.startsWith("/media") && (
        <div
          className={`shrink-0 border-t border-foreground/10 ${
            isCollapsed ? "px-2 py-2 flex flex-col items-center gap-1" : "px-3 py-2 space-y-1"
          }`}
        >
          {(() => {
            const active = currentAppPath.startsWith("/gallery");
            if (isCollapsed) {
              return (
                <button
                  onClick={() => navigateSmoothly("/gallery")}
                  onMouseEnter={() => prefetchRoute("/gallery")}
                  title="Cloud"
                  aria-label="Cloud"
                  style={active ? activeItemStyle : undefined}
                  className={`relative w-10 h-10 grid place-items-center rounded-xl border border-transparent transition-all ${
                    active
                      ? "text-foreground"
                      : "text-foreground/75 hover:text-foreground hover:bg-foreground/[0.06]"
                  }`}
                >
                  <Cloud className="w-5 h-5" strokeWidth={2} />
                </button>
              );
            }
            return (
              <button
                onClick={() => navigateSmoothly("/gallery")}
                onMouseEnter={() => prefetchRoute("/gallery")}
                style={active ? activeItemStyle : undefined}
                className={`w-full h-10 px-3 flex items-center gap-3 rounded-xl border border-transparent transition-all ${
                  active
                    ? "text-foreground"
                    : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.06]"
                }`}
              >
                <Cloud className="w-5 h-5" strokeWidth={2} />
                <span className="text-[14px] font-medium">Cloud</span>
              </button>
            );
          })()}
        </div>
      )}

      {/* NEW CHAT — prominent action (cartoon sticker) */}
      {!isCollapsed && (
        <div className="relative shrink-0 px-3 pb-2">
          <button
            onClick={handleNewChat}
            style={{
              backgroundColor: MINT,
              color: INK,
              border: `2.5px solid ${INK}`,
              boxShadow: `3px 3px 0 ${INK}`,
              fontWeight: 800,
            }}
            className="w-full h-11 px-4 flex items-center justify-between rounded-full transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-[14px]"
            title={isBuildMode ? "New project" : "New chat"}
          >
            <span>{isBuildMode ? "New project" : "New chat"}</span>
            <Plus className="w-4 h-4" strokeWidth={2.6} />
          </button>
        </div>
      )}

      {/* SCROLLABLE — conversations or sub-nav */}
      {!isCollapsed ? (
        <div className="relative flex-1 min-h-0 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
          {showRecent ? (
            conversations.length === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-[13px] text-muted-foreground/70">No conversations yet</p>
              </div>
            ) : (
              Object.entries(groups).map(([label, items]) =>
                items.length === 0 ? null : (
                  <div key={label} className="mb-3">
                    <div
                      className="px-3 pt-2 pb-1 text-[10.5px] uppercase tracking-[0.18em] flex items-center gap-1.5"
                      style={{ color: MUTED, fontWeight: 800 }}
                    >
                      {label === "Pinned" && <Pin className="w-3 h-3" strokeWidth={2.4} />}
                      {label}
                    </div>
                    <ul className="space-y-1">
                      {items.map((conv) => {
                        const onChatPage = currentAppPath === "/chat";
                        const isActive = activeConversationId === conv.id;
                        return (
                          <li key={conv.id}>
                            <button
                              onClick={() => {
                                onClose();
                                closeInline();
                                if (onChatPage) onSelectConversation?.(conv.id);
                                else
                                  navigateSmoothly("/chat", {
                                    state: { loadConversationId: conv.id },
                                  });
                              }}
                              style={
                                isActive
                                  ? {
                                      backgroundColor: "transparent",
                                      color: TEXT,
                                      border: "none",
                                      fontWeight: 800,
                                    }
                                  : {
                                      backgroundColor: "transparent",
                                      color: TEXT,
                                      border: "none",
                                      fontWeight: 600,
                                    }
                              }
                              className="w-full text-left px-3 py-2 rounded-full text-[13px] truncate transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            >
                              <span className="truncate">{conv.title || "Untitled"}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ),
              )
            )
          ) : (
            <SidebarSubNav
              mode={currentMode}
              size="sm"
              onNavigate={() => {
                onClose();
                closeInline();
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0" />
      )}

      {/* FOOTER — user pill (cartoon sticker) */}
      <div className="shrink-0 p-2" style={{ borderTop: `2px solid ${BORDER}` }}>
        {!currentUserId ? (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => navigateSmoothly("/auth")}
                style={{
                  backgroundColor: YELLOW,
                  color: INK,
                  border: `2.5px solid ${INK}`,
                  boxShadow: `2px 2px 0 ${INK}`,
                }}
                className="w-10 h-10 grid place-items-center rounded-full transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Log in"
                aria-label="Log in"
              >
                <LogIn className="w-[16px] h-[16px]" strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigateSmoothly("/auth")}
              style={{
                backgroundColor: YELLOW,
                color: INK,
                border: `2.5px solid ${INK}`,
                boxShadow: `3px 3px 0 ${INK}`,
                fontWeight: 800,
              }}
              className="w-full h-11 px-3 flex items-center justify-center gap-2 rounded-full text-[14px] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <LogIn className="w-4 h-4" strokeWidth={2.6} />
              <span>Log in</span>
            </button>
          )
        ) : isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => navigateSmoothly("/settings")}
              style={{ border: `2px solid ${BORDER}`, backgroundColor: SURFACE, color: TEXT }}
              className="w-10 h-10 rounded-full grid place-items-center text-[12px] font-bold overflow-hidden"
              title={displayName}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                initial
              )}
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 p-1.5 rounded-full"
            style={{ border: `2px solid ${BORDER}`, backgroundColor: SURFACE }}
          >
            <button
              onClick={() => navigateSmoothly("/settings")}
              className="flex-1 min-w-0 flex items-center gap-2.5 px-1.5 py-1 rounded-full text-left transition-colors"
              title="Settings"
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  style={{ border: `2px solid ${INK}` }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full grid place-items-center text-[12px] shrink-0"
                  style={{
                    backgroundColor: YELLOW,
                    color: INK,
                    border: `2px solid ${INK}`,
                    fontWeight: 900,
                  }}
                >
                  {initial}
                </div>
              )}
              <span
                className="text-[13px] truncate flex-1 leading-none"
                style={{ color: TEXT, fontWeight: 700 }}
              >
                {displayName}
              </span>
            </button>
            <button
              onClick={() => navigateSmoothly("/pricing")}
              style={{
                backgroundColor: MINT,
                color: INK,
                border: `2px solid ${INK}`,
                boxShadow: `2px 2px 0 ${INK}`,
                fontWeight: 800,
              }}
              className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] whitespace-nowrap transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              title={displayCredits > 0 ? `${displayCredits.toFixed(0)} credits` : "Upgrade"}
            >
              <span className="inline-flex shrink-0" style={{ color: YELLOW }}>
                <MegsyStar size={13} static className="" />
              </span>
              <span style={{ color: INK, WebkitTextFillColor: INK }}>
                {displayCredits > 0 ? displayCredits.toFixed(0) : "Upgrade"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // MOBILE — restore previous design (pre-redesign), unchanged for phones
  const mobileContent = (
    <div
      data-app-sidebar-panel="true"
      className="flex flex-col h-full text-foreground relative overflow-hidden"
      style={panelGlassStyle}
      data-section={sectionAccent.name}
    >
      <div className="relative shrink-0 px-4 pt-4 pb-2 flex items-center gap-2">
        <img
          src={megsyLogo}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] object-contain shrink-0"
          loading="eager"
          decoding="async"
        />
        <span
          className="text-[19px] tracking-tight truncate"
          style={{ fontWeight: 900, letterSpacing: "-0.02em", color: TEXT }}
        >
          {isCleopatra ? "Cleopatra AI" : "Megsy"}
        </span>
      </div>

      <div className="relative flex-1 overflow-y-auto px-3 pt-1 pb-32 min-h-0 [scrollbar-width:thin]">
        <div className="space-y-1 mb-3">
          {navItems.map(({ label, Icon, path, match }) => {
            const active = match(currentAppPath);
            return (
              <button
                key={label}
                onClick={() => navigateSmoothly(path)}
                onMouseEnter={() => prefetchRoute(path)}
                onFocus={() => prefetchRoute(path)}
                style={active ? activeItemStyle : { color: TEXT, backgroundColor: SURFACE }}
                className="w-full h-11 px-4 flex items-center gap-3 rounded-full transition-all active:scale-95"
              >
                <Icon size={19} strokeWidth={2.2} />
                <span className="text-[14.5px]" style={{ fontWeight: active ? 800 : 700 }}>
                  {label}
                </span>
              </button>
            );
          })}
          {currentAppPath.startsWith("/media") && (
            <button
              onClick={() => navigateSmoothly("/gallery")}
              onMouseEnter={() => prefetchRoute("/gallery")}
              style={
                currentAppPath.startsWith("/gallery")
                  ? activeItemStyle
                  : { color: TEXT, backgroundColor: SURFACE }
              }
              className="w-full h-11 px-4 flex items-center gap-3 rounded-full transition-all active:scale-95"
            >
              <Cloud className="w-5 h-5" strokeWidth={2.2} />
              <span className="text-[14.5px]" style={{ fontWeight: 700 }}>
                Cloud
              </span>
            </button>
          )}
        </div>

        {showRecent ? (
          conversations.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-[13px] text-muted-foreground/70">No conversations yet</p>
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length === 0 ? null : (
                <div key={label} className="mb-4">
                  <div className="px-3 pb-2 font-display text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60 flex items-center gap-1.5">
                    {label === "Pinned" && <Pin className="w-3 h-3" strokeWidth={2.2} />}
                    {label}
                  </div>
                  <ul className="space-y-1">
                    {items.map((conv) => {
                      const onChatPage = stripZonePrefix(location.pathname) === "/chat";
                      const isActive = activeConversationId === conv.id;
                      return (
                        <li key={conv.id}>
                          <button
                            onClick={() => {
                              onClose();
                              if (onChatPage) onSelectConversation?.(conv.id);
                              else
                                navigateSmoothly("/chat", {
                                  state: { loadConversationId: conv.id },
                                });
                            }}
                            style={{
                              borderColor: isActive ? "hsl(var(--primary) / 0.25)" : "transparent",
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-[14.5px] truncate transition-colors border ${
                              isActive
                                ? "bg-primary/10 text-foreground"
                                : "text-foreground/85 hover:bg-foreground/[0.05] hover:text-foreground"
                            }`}
                          >
                            <span className="truncate font-medium">{conv.title || "Untitled"}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ),
            )
          )
        ) : (
          <SidebarSubNav mode={currentMode} size="md" onNavigate={onClose} />
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6 pointer-events-none z-10
                   bg-gradient-to-t from-black via-black/90 to-transparent"
      >
        <div className="pointer-events-auto flex items-center gap-2">
          {!currentUserId ? (
            <button
              onClick={() => navigateSmoothly("/auth")}
              style={{
                backgroundColor: YELLOW,
                color: INK,
                border: `2.5px solid ${INK}`,
                boxShadow: `3px 3px 0 ${INK}`,
                fontWeight: 800,
              }}
              className="flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-[14px] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <LogIn className="w-4 h-4" strokeWidth={2.6} />
              <span>Log in</span>
            </button>
          ) : (
            <div
              className="flex-1 min-w-0 flex items-center gap-2 p-1.5 rounded-full"
              style={{ backgroundColor: SURFACE, border: `2px solid ${BORDER}` }}
            >
              <button
                onClick={() => navigateSmoothly("/settings")}
                className="flex-1 min-w-0 flex items-center gap-2 px-1 py-0.5 rounded-full text-left"
                title="Settings"
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: `2px solid ${INK}` }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full grid place-items-center text-[12px] shrink-0"
                    style={{
                      backgroundColor: YELLOW,
                      color: INK,
                      border: `2px solid ${INK}`,
                      fontWeight: 900,
                    }}
                  >
                    {initial}
                  </div>
                )}
                <span className="text-[13.5px] truncate" style={{ color: TEXT, fontWeight: 700 }}>
                  {displayName}
                </span>
              </button>

              <button
                onClick={() => navigateSmoothly("/pricing")}
                style={{
                  backgroundColor: MINT,
                  color: INK,
                  border: `2px solid ${INK}`,
                  boxShadow: `2px 2px 0 ${INK}`,
                  fontWeight: 800,
                }}
                className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title={displayCredits > 0 ? `${displayCredits.toFixed(0)} credits` : "Upgrade"}
              >
                <span className="inline-flex shrink-0" style={{ color: YELLOW }}>
                  <MegsyStar size={13} static className="" />
                </span>
                <span style={{ color: INK, WebkitTextFillColor: INK }}>
                  {displayCredits > 0 ? displayCredits.toFixed(0) : "Upgrade"}
                </span>
              </button>
            </div>
          )}

          <button
            onClick={handleNewChat}
            style={{
              backgroundColor: YELLOW,
              color: INK,
              border: `2.5px solid ${INK}`,
              boxShadow: `3px 3px 0 ${INK}`,
            }}
            className="w-11 h-11 shrink-0 rounded-full grid place-items-center transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title={isBuildMode ? "New project" : "New chat"}
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) return innerContent;

  const isTransparentSurface =
    typeof window !== "undefined" &&
    (stripZonePrefix(window.location.pathname).startsWith("/chat") ||
      stripZonePrefix(window.location.pathname).startsWith("/settings/referrals"));

  return (
    <AnimatePresence>
      {open && (
        <>
          {!isTransparentSurface && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-popover bg-black/55 cursor-pointer"
              onClick={onClose}
              onTouchStart={onClose}
            />
          )}
          {isTransparentSurface && (
            <div
              className="fixed inset-0 z-popover"
              onClick={onClose}
              onTouchStart={onClose}
              style={{ background: "transparent" }}
            />
          )}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}


            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.04, right: 0 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -400) onClose();
            }}
            style={{
              ["--section-accent" as any]: sectionAccent.hsl,
              backgroundColor: PAGE_BG,
              willChange: "transform",
              touchAction: "pan-y",
            }}
            className="fixed left-0 top-0 bottom-0 z-[91] w-[288px] flex flex-col overflow-hidden border-r border-foreground/10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileContent}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AppSidebar;
