/** @doc Notifications — grouped email preferences on the unified SubShell design. */
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useActiveWorkspaceId } from "@/lib/activeWorkspace";
import { SubShell, SubSection, SubCard, SubStatStrip } from "@/components/settings/SubShell";

interface Preferences {
  email_welcome: boolean;
  email_low_balance: boolean;
  email_transactions: boolean;
  email_newsletter: boolean;
}

const defaults: Preferences = {
  email_welcome: true,
  email_low_balance: true,
  email_transactions: true,
  email_newsletter: false,
};

const groups: Array<{
  n: string;
  title: string;
  desc: string;
  items: Array<{ key: keyof Preferences; label: string; desc: string }>;
}> = [
  {
    n: "01",
    title: "Account",
    desc: "Operational emails tied to your account — onboarding and billing.",
    items: [
      { key: "email_welcome", label: "Welcome & onboarding", desc: "Tips to help you get started" },
      { key: "email_transactions", label: "Transactions & receipts", desc: "Payments, refunds and plan changes" },
    ],
  },
  {
    n: "02",
    title: "Activity",
    desc: "Important signals about how you're using Megsy — credits, alerts.",
    items: [
      { key: "email_low_balance", label: "Low balance", desc: "Heads up when your credits run low" },
    ],
  },
  {
    n: "03",
    title: "From Megsy",
    desc: "Optional product stories. We never send promos without consent.",
    items: [
      { key: "email_newsletter", label: "Product newsletter", desc: "New features and product updates" },
    ],
  },
];

export default function NotificationSettingsPage() {
  const workspaceId = useActiveWorkspaceId();
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const loadPrefs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    let q = supabase
      .from("notification_preferences")
      .select("email_welcome, email_low_balance, email_transactions, email_newsletter")
      .eq("user_id", user.id);
    q = workspaceId ? q.eq("workspace_id", workspaceId) : q.is("workspace_id", null);
    const { data } = await q.maybeSingle();
    setPrefs(data ? (data as Preferences) : defaults);
    setLoading(false);
  };

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    let sel = supabase.from("notification_preferences").select("id").eq("user_id", user.id);
    sel = workspaceId ? sel.eq("workspace_id", workspaceId) : sel.is("workspace_id", null);
    const { data: existing } = await sel.maybeSingle();

    let error;
    if (existing?.id) {
      const res = await supabase
        .from("notification_preferences")
        .update({ ...next, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id, workspace_id: workspaceId, ...next });
      error = res.error;
    }
    setSaving(false);
    if (error) toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
  };

  const active = Object.values(prefs).filter(Boolean).length;
  const total = Object.keys(prefs).length;

  const StatusPill = (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-card/40 text-[12px]">
      {saving ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          <span className="font-mono text-muted-foreground">Saving</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-muted-foreground">Saved</span>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <SubShell title="Notifications" backTo="/settings">
        <div className="py-24 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </SubShell>
    );
  }

  return (
    <SubShell
      title="Notifications"
      subtitle="Choose which emails Megsy sends you. Every category is off by default when we're unsure — you're in control."
      backTo="/settings"
      action={StatusPill}
    >
      <SubSection title="Overview" description="Your current email preferences at a glance.">
        <SubStatStrip
          items={[
            { label: "Channel", value: "Email", sub: "Delivered to your inbox" },
            { label: "Active", value: `${active}`, sub: `of ${total} categories` },
            { label: "Muted", value: `${total - active}`, sub: "Currently silent" },
            { label: "Status", value: saving ? "Saving" : "Saved", sub: "Autosaves per toggle" },
          ]}
        />
      </SubSection>

      {groups.map((g) => (
        <SubSection key={g.title} title={g.title} description={g.desc}>
          <SubCard flush>
            <div className="divide-y divide-border/60">
              {g.items.map((it) => (
                <label
                  key={it.key}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer transition hover:bg-foreground/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-medium text-foreground">{it.label}</p>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">{it.desc}</p>
                  </div>
                  <Switch
                    checked={prefs[it.key]}
                    onCheckedChange={(v) => updatePref(it.key, v)}
                  />
                </label>
              ))}
            </div>
          </SubCard>
        </SubSection>
      ))}
    </SubShell>
  );
}
