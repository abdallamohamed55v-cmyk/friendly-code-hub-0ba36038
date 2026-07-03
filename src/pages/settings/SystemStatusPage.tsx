/** @doc System status — live uptime & incidents from Supabase on the unified SubShell design. */
import { useEffect, useMemo, useState } from "react";
import { Check, Bell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SubShell, SubSection, SubCard, SubStatStrip } from "@/components/settings/SubShell";

type Incident = {
  id: string;
  service_name: string;
  status: string;
  title: string | null;
  message: string | null;
  started_at: string;
  resolved_at: string | null;
};

const SERVICES: { name: string; color: string }[] = [
  { name: "Chat", color: "#7c5cff" },
  { name: "Images", color: "#ff8a1f" },
  { name: "Videos", color: "#ec4899" },
  { name: "Codes", color: "#22d3ee" },
  { name: "Database", color: "#10b981" },
  { name: "Website", color: "#facc15" },
];

const WINDOW_DAYS = 90;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

const SystemStatusPage = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("service_incidents")
        .select("id, service_name, status, title, message, started_at, resolved_at")
        .order("started_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load status");
      } else {
        setIncidents((data || []) as Incident[]);
      }
      setLoading(false);

      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user?.email && !cancelled) {
        setEmail(auth.user.email);
        const { data: existing } = await supabase
          .from("status_subscribers")
          .select("id")
          .eq("channel", "email")
          .eq("contact", auth.user.email)
          .maybeSingle();
        if (!cancelled && existing) setSubscribed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute per-service uptime over the rolling window from incident downtime.
  const uptimeByService = useMemo(() => {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const map: Record<string, number> = {};
    for (const svc of SERVICES) {
      const downMs = incidents
        .filter((i) => i.service_name === svc.name)
        .reduce((acc, i) => {
          const start = new Date(i.started_at).getTime();
          const end = i.resolved_at ? new Date(i.resolved_at).getTime() : now;
          const clampedStart = Math.max(start, windowStart);
          const clampedEnd = Math.min(end, now);
          return acc + Math.max(0, clampedEnd - clampedStart);
        }, 0);
      const pct = Math.max(0, 100 - (downMs / WINDOW_MS) * 100);
      map[svc.name] = pct;
    }
    return map;
  }, [incidents]);

  const currentlyDown = useMemo(
    () => incidents.filter((i) => !i.resolved_at).map((i) => i.service_name),
    [incidents],
  );
  const allOperational = currentlyDown.length === 0;

  const handleSubscribe = async () => {
    if (subscribed) return;
    const target = email.trim();
    if (!target) {
      setShowSubscribe(true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      toast.error("Please sign in to subscribe to status alerts");
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("status_subscribers").insert({
      channel: "email",
      contact: target,
    });
    setSubmitting(false);
    if (error) {
      const dup =
        error.code === "23505" ||
        error.message?.toLowerCase().includes("duplicate") ||
        error.message?.toLowerCase().includes("unique");
      if (dup) {
        setSubscribed(true);
        setShowSubscribe(false);
        toast.success("You're already subscribed");
      } else {
        toast.error(error.message || "Could not subscribe");
      }
    } else {
      setSubscribed(true);
      setShowSubscribe(false);
      toast.success("Subscribed to status alerts");
    }
  };

  const reasonFor = (inc: Incident) =>
    inc.message || (inc.title ? inc.title.replace(/^.*? is down\s*/i, "") : "") || "Service disruption";

  return (
    <SubShell
      title="System status"
      subtitle="Live uptime and incident history for every Megsy service."
      backTo="/settings"
    >
      <SubSection title="Overview" description={`Rolling ${WINDOW_DAYS}-day summary across all services.`}>
        <SubStatStrip
          items={[
            {
              label: "Status",
              value: loading ? "…" : allOperational ? "Operational" : "Degraded",
              sub: loading
                ? "Checking systems"
                : allOperational
                  ? "All systems normal"
                  : `${currentlyDown.length} service${currentlyDown.length === 1 ? "" : "s"} down`,
            },
            { label: "Services", value: `${SERVICES.length}`, sub: "Monitored" },
            { label: "Window", value: `${WINDOW_DAYS}d`, sub: "Rolling uptime" },
            {
              label: "Incidents",
              value: `${incidents.length}`,
              sub: incidents.length === 0 ? "On record" : "Last 100",
            },
          ]}
        />
      </SubSection>

      <SubSection title="Alerts" description="Get notified by email when a service is disrupted.">
        <SubCard>
          {!showSubscribe ? (
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-foreground/[0.06] text-foreground/80 shrink-0">
                {allOperational && !loading ? (
                  <Check className="w-[18px] h-[18px] text-emerald-400" strokeWidth={2.2} />
                ) : (
                  <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-medium text-foreground">
                  {subscribed ? "Subscribed to alerts" : "Email me on incidents"}
                </p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  We'll email you when a service is disrupted and when it recovers.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={submitting || subscribed}
                className="shrink-0 inline-flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-60 transition"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40 transition"
              />
              <button
                type="button"
                onClick={() => setShowSubscribe(false)}
                disabled={submitting}
                className="inline-flex items-center h-11 px-4 text-[13px] font-medium rounded-xl border border-border/70 text-foreground hover:bg-foreground/[0.06] disabled:opacity-60 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={submitting}
                className="inline-flex items-center gap-2 h-11 px-5 text-[13px] font-medium rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-60 transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          )}
        </SubCard>
      </SubSection>

      <SubSection title="Uptime" description={`Per-service availability over the last ${WINDOW_DAYS} days.`}>
        <SubCard flush>
          <div className="divide-y divide-border/60">
            {SERVICES.map((svc) => {
              const uptime = uptimeByService[svc.name] ?? 100;
              const isDown = currentlyDown.includes(svc.name);
              return (
                <div key={svc.name} className="px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-foreground">{svc.name}</span>
                      {isDown && (
                        <span className="text-[10px] uppercase tracking-wider text-rose-300 rounded-full border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5">
                          Down
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] tabular-nums text-muted-foreground">
                      {uptime.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06] border border-border/60">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isDown ? "bg-rose-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.max(2, uptime)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SubCard>
      </SubSection>

      <SubSection title="Incidents" description="Latest incidents and their resolution status.">
        {loading ? (
          <SubCard>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-[13px] py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading incidents…
            </div>
          </SubCard>
        ) : incidents.length === 0 ? (
          <SubCard>
            <div className="text-center py-6">
              <p className="text-[14px] font-semibold text-foreground">No incidents on record</p>
              <p className="text-[12.5px] mt-1 text-muted-foreground">
                All services have been running normally.
              </p>
            </div>
          </SubCard>
        ) : (
          <SubCard flush>
            <div className="divide-y divide-border/60">
              {incidents.map((incident) => {
                const isResolved = !!incident.resolved_at;
                return (
                  <div key={incident.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            isResolved ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-[14px] text-foreground truncate">
                            {incident.title || `${incident.service_name} is down`}
                          </div>
                          <div className="text-[12px] text-muted-foreground mt-0.5">
                            {reasonFor(incident)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[12px] text-muted-foreground tabular-nums">
                          {new Date(incident.started_at).toLocaleDateString()}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 capitalize ${
                            isResolved ? "text-emerald-400" : "text-rose-300"
                          }`}
                        >
                          {incident.status}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SubCard>
        )}
      </SubSection>
    </SubShell>
  );
};

export default SystemStatusPage;
