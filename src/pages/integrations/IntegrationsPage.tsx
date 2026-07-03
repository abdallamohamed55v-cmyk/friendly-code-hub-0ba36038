/** @doc Browse and connect third-party integrations. */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { integrations, INTEGRATION_CATEGORIES, type Integration } from "@/lib/integrationsData";
import IntegrationDetailModal from "@/components/integrations/IntegrationDetailModal";
import { SubShell, SubSection, SubCard, SubStatStrip } from "@/components/settings/SubShell";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type AppMeta = Record<string, any>;

const FAVICON_SOURCES = (domain: string) => [
  `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
];

const BrandLogo = ({ integration, size = 28 }: { integration: Integration; size?: number }) => {
  const [srcIdx, setSrcIdx] = useState(0);
  const sources = integration.domain ? FAVICON_SOURCES(integration.domain) : [];
  const url = sources[srcIdx];
  if (!url) {
    return (
      <span className="font-semibold text-foreground/70" style={{ fontSize: size * 0.55 }}>
        {integration.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      loading="lazy"
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
};

const LogoTile = ({ integration, size = 40 }: { integration: Integration; size?: number }) => (
  <div
    className="grid place-items-center shrink-0 rounded-md bg-card border border-border"
    style={{ width: size, height: size }}
  >
    <BrandLogo integration={integration} size={Math.round(size * 0.6)} />
  </div>
);

const IntegrationsPage = () => {
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [appMeta, setAppMeta] = useState<Record<string, AppMeta>>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [toolEnabled, setToolEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConnections();
    loadToolSettings();
  }, []);

  const loadToolSettings = async () => {
    const { data } = await supabase.from("pipedream_tool_settings").select("app_slug, enabled");
    const map: Record<string, boolean> = {};
    for (const row of data ?? []) map[row.app_slug] = row.enabled;
    setToolEnabled(map);
  };

  const toggleTool = async (appSlug: string, next: boolean) => {
    setToolEnabled((prev) => ({ ...prev, [appSlug]: next }));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("pipedream_tool_settings").upsert(
      {
        user_id: user.id,
        app_slug: appSlug,
        enabled: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,app_slug" },
    );
  };

  const loadConnections = async () => {
    setIsLoadingConnections(true);
    try {
      const [github, supa, notify, cf, pd] = await Promise.all([
        supabase.functions.invoke("github-push", { body: { action: "status" } }),
        supabase.functions.invoke("supabase-link-manager", { body: { action: "status" } }),
        supabase.functions.invoke("report-error", {
          headers: { "x-fn": "notify-user" },
          body: { action: "status" },
        }),
        supabase.functions.invoke("report-error", {
          headers: { "x-fn": "check-cf-secrets" },
          body: {},
        }),
        supabase.functions.invoke("pipedream-connect", { body: { action: "list_accounts" } }),
      ]);

      const connected: Record<string, boolean> = {};
      const meta: Record<string, AppMeta> = {};

      if (!github.error && github.data?.connected) connected.github = true;
      if (!supa.error && supa.data?.connected) connected.supabase = true;

      if (!notify.error && notify.data) {
        meta.email = { ...notify.data.email };
        meta.telegram = { ...notify.data.telegram };
        if (notify.data.email?.connected) connected.email = true;
        if (notify.data.telegram?.connected) connected.telegram = true;
      }

      const cfOk = !cf.error && cf.data?.verify?.success === true;
      meta.cloudflare = { available: cfOk };
      if (cfOk) connected.cloudflare = true;

      if (!pd.error && Array.isArray(pd.data?.accounts)) {
        for (const a of pd.data.accounts) {
          const slug = a.app_slug ?? a.app?.name_slug ?? a.app?.slug;
          if (!slug) continue;
          connected[slug] = true;
          meta[slug] = {
            account_id: a.account_id ?? a.id,
            account_name: a.account_name ?? a.name,
          };
        }
      }

      setConnectedApps(connected);
      setAppMeta(meta);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleConnect = async (integration: Integration, form?: any) => {
    setLoadingApp(integration.id);
    try {
      if (integration.type === "pipedream" && integration.pipedreamSlug) {
        const { data, error } = await supabase.functions.invoke("pipedream-connect", {
          body: { action: "create_token" },
        });
        if (error || data?.error || !data?.connect_link_url) {
          throw new Error(data?.error || error?.message || "Pipedream not configured");
        }
        const url = `${data.connect_link_url}&app=${encodeURIComponent(integration.pipedreamSlug)}`;
        const popup = window.open(url, `pd-${integration.app}`, "width=600,height=750");
        if (!popup) throw new Error("Allow popups to complete the connection");

        await new Promise<void>((resolve) => {
          const start = Date.now();
          const timer = window.setInterval(async () => {
            if (popup.closed || Date.now() - start > 180_000) {
              window.clearInterval(timer);
              resolve();
              return;
            }
            const { data: poll } = await supabase.functions.invoke("pipedream-connect", {
              body: { action: "list_accounts" },
            });
            const found = (poll?.accounts || []).some(
              (a: any) =>
                (a.app_slug ?? a.app?.name_slug ?? a.app?.slug) === integration.pipedreamSlug,
            );
            if (found) {
              window.clearInterval(timer);
              try {
                popup.close();
              } catch {}
              resolve();
            }
          }, 2500);
        });

        await loadConnections();
        if (connectedApps[integration.app]) toast.success(`${integration.name} connected`);
        setSelectedIntegration(null);
        return;
      }

      if (integration.app === "github" || integration.app === "supabase") {
        const popup = window.open(
          "about:blank",
          `${integration.app}-oauth`,
          "width=600,height=750",
        );
        try {
          const startFn =
            integration.app === "github" ? "oauth-github-connect" : "supabase-oauth-start";
          const { data, error } = await supabase.functions.invoke(startFn, {
            body: { redirect_to: window.location.href },
          });
          if (error || data?.error || !data?.authorize_url) {
            throw new Error(data?.error || error?.message || "OAuth is not configured");
          }
          if (!popup) throw new Error("Allow popups to complete the connection");
          popup.location.href = data.authorize_url;

          await new Promise<void>((resolve) => {
            const listener = (ev: MessageEvent) => {
              if (ev.data?.type !== `${integration.app}-oauth`) return;
              window.removeEventListener("message", listener);
              window.clearInterval(poll);
              resolve();
            };
            window.addEventListener("message", listener);
            const poll = window.setInterval(() => {
              if (popup.closed) {
                window.clearInterval(poll);
                window.removeEventListener("message", listener);
                resolve();
              }
            }, 1000);
          });

          await loadConnections();
          toast.success(`${integration.name} connected`);
          setSelectedIntegration(null);
        } catch (e) {
          if (popup && !popup.closed) popup.close();
          throw e;
        }
        return;
      }

      if (integration.app === "email" || integration.app === "telegram") {
        const { data, error } = await supabase.functions.invoke("report-error", {
          headers: { "x-fn": "notify-user" },
          body: { action: "connect", app: integration.app, ...(form || {}) },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message || "Failed");
        await loadConnections();
        toast.success(`${integration.name} enabled`);
        setSelectedIntegration(null);
        return;
      }

      if (integration.app === "cloudflare") {
        toast.info("Cloudflare is configured by the server administrator.");
        return;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${integration.name} connection failed`);
    } finally {
      setLoadingApp(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setLoadingApp(integration.id);
    try {
      if (integration.type === "pipedream") {
        const accountId = appMeta[integration.app]?.account_id;
        if (accountId) {
          await supabase.functions.invoke("pipedream-connect", {
            body: { action: "delete_account", account_id: accountId },
          });
        }
      } else if (integration.app === "github") {
        await supabase.functions.invoke("github-push", { body: { action: "disconnect" } });
      } else if (integration.app === "supabase") {
        await supabase.functions.invoke("supabase-link-manager", {
          body: { action: "disconnect" },
        });
      } else if (integration.app === "email" || integration.app === "telegram") {
        await supabase.functions.invoke("report-error", {
          headers: { "x-fn": "notify-user" },
          body: { action: "disconnect", app: integration.app },
        });
      }
      await loadConnections();
      toast.success(`${integration.name} disconnected`);
      setSelectedIntegration(null);
    } finally {
      setLoadingApp(null);
    }
  };

  const isConnected = (app: string) => !!connectedApps[app];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return integrations.filter((i) => {
      if (activeCategory !== "All" && i.category !== activeCategory) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const connectedCount = Object.keys(connectedApps).filter((k) => connectedApps[k]).length;

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = { All: integrations.length };
    for (const i of integrations) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, []);

  const IntegrationRow = ({ integration }: { integration: Integration }) => {
    const connected = isConnected(integration.app);
    const isPipedream = integration.type === "pipedream";
    const enabled = toolEnabled[integration.app] !== false;
    return (
      <div className="group flex items-center gap-4 px-4 py-3.5 hover:bg-foreground/[0.03] transition-colors">
        <button
          onClick={() => setSelectedIntegration(integration)}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <LogoTile integration={integration} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[14.5px] font-medium text-foreground truncate">
                {integration.name}
              </h3>
              {connected && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  Connected
                </span>
              )}
            </div>
            <p className="text-[12.5px] mt-0.5 text-muted-foreground line-clamp-1">
              {integration.description}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          {connected && isPipedream && (
            <label className="hidden sm:flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[11px] text-muted-foreground">Use in chat</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enabled}
                onChange={(e) => toggleTool(integration.app, e.target.checked)}
              />
              <span
                aria-hidden
                className="relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors border border-border peer-checked:bg-foreground peer-checked:border-foreground"
              >
                <span
                  className="inline-block h-3 w-3 rounded-full transition-transform bg-background"
                  style={{ transform: enabled ? "translateX(18px)" : "translateX(2px)" }}
                />
              </span>
            </label>
          )}
          <button
            onClick={() => setSelectedIntegration(integration)}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors shrink-0",
              connected
                ? "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] border border-border/60"
                : "bg-foreground text-background hover:opacity-90",
            )}
          >
            {connected ? "Manage" : "Connect"}
          </button>
        </div>
      </div>
    );
  };

  const SearchToolbar = () => (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-border/70 bg-card/40 overflow-hidden">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations"
            className="w-full bg-transparent pl-9 pr-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {INTEGRATION_CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold transition active:scale-95",
                active
                  ? "bg-foreground text-background"
                  : "border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {cat} <span className="opacity-60 font-normal">({categoryCounts[cat] ?? 0})</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const List = () => {
    if (isLoadingConnections) {
      return (
        <SubCard>
          <div className="py-12 grid place-items-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Loading…
            </p>
          </div>
        </SubCard>
      );
    }
    if (filtered.length === 0) {
      return (
        <SubCard>
          <div className="py-10 text-center">
            <p className="text-[13px] font-semibold text-foreground">No matches</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Try a different keyword or category.
            </p>
          </div>
        </SubCard>
      );
    }
    return (
      <SubCard flush>
        <div className="divide-y divide-border/60">
          {filtered.map((i) => (
            <IntegrationRow key={i.id} integration={i} />
          ))}
        </div>
      </SubCard>
    );
  };

  const statusPill = (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-card/40 text-[12px] text-muted-foreground font-mono tabular-nums">
      {connectedCount}/{integrations.length}
    </div>
  );

  return (
    <SubShell
      title="Integrations"
      subtitle="Connect your tools and services. Manage which apps Megsy can act on."
      backTo="/settings"
      action={statusPill}
    >
      <SubSection title="Overview" description="Your connected apps at a glance.">
        <SubStatStrip
          items={[
            { label: "Connected", value: `${connectedCount}`, sub: `of ${integrations.length}` },
            { label: "Available", value: `${integrations.length}`, sub: "In the catalog" },
            { label: "Categories", value: `${INTEGRATION_CATEGORIES.length - 1}`, sub: "Grouped types" },
            { label: "Selected", value: activeCategory, sub: "Current filter" },
          ]}
        />
      </SubSection>

      <SubSection title="Browse" description="Search or filter by category to find an integration.">
        <SearchToolbar />
      </SubSection>

      <SubSection title="Catalog" description="Tap an integration to connect, disconnect, or manage settings.">
        <List />
      </SubSection>

      <IntegrationDetailModal
        integration={selectedIntegration}
        isConnected={selectedIntegration ? isConnected(selectedIntegration.app) : false}
        isLoading={selectedIntegration ? loadingApp === selectedIntegration.id : false}
        meta={selectedIntegration ? appMeta[selectedIntegration.app] : undefined}
        onConnect={(form) => selectedIntegration && handleConnect(selectedIntegration, form)}
        onDisconnect={() => selectedIntegration && handleDisconnect(selectedIntegration)}
        onClose={() => setSelectedIntegration(null)}
      />
    </SubShell>
  );
};

export default IntegrationsPage;
