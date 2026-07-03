/** @doc Manage what Megsy remembers across conversations. */
// Memory — editorial redesign using SubShell (matches account/workspaces settings).
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, RotateCcw, Plus, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  SubShell,
  SubSection,
  SubCard,
  SubStatStrip,
  DangerCallout,
} from "@/components/settings/SubShell";
import { cn } from "@/lib/utils";

interface MemoryEntry {
  id: string;
  title: string;
  summary: string;
  scope: string | null;
  created_at: string;
}

interface MemoryProfile {
  account_summary: string | null;
  preferences: Record<string, any> | null;
}

const MemoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [profile, setProfile] = useState<MemoryProfile | null>(null);
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Manual add
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      await refresh(user.id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (uid: string) => {
    const [{ data: prof }, { data: rows }] = await Promise.all([
      supabase
        .from("user_memory_profiles")
        .select("account_summary, preferences")
        .eq("user_id", uid)
        .maybeSingle(),
      supabase
        .from("user_memory_entries")
        .select("id, title, summary, scope, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setProfile((prof as MemoryProfile) ?? { account_summary: null, preferences: null });
    setEnabled(((prof as any)?.preferences?.enabled ?? true) !== false);
    setEntries((rows as MemoryEntry[]) ?? []);
  };

  const handleToggle = async (next: boolean) => {
    if (!userId) return;
    setBusy(true);
    setEnabled(next);
    try {
      const nextPrefs = { ...(profile?.preferences ?? {}), enabled: next };
      const { error } = await supabase
        .from("user_memory_profiles")
        .upsert({ user_id: userId, preferences: nextPrefs }, { onConflict: "user_id" });
      if (error) throw error;
      setProfile((p) => ({
        ...(p ?? { account_summary: null, preferences: null }),
        preferences: nextPrefs,
      }));
      toast.success(next ? "Memory enabled" : "Memory paused");
    } catch (e: any) {
      setEnabled(!next);
      toast.error(e?.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("user_memory_entries").delete().eq("id", id);
      if (error) throw error;
      setEntries((es) => es.filter((e) => e.id !== id));
      toast.success("Memory removed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleReset = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("user_memory_entries").delete().eq("user_id", userId);
      if (error) throw error;
      setEntries([]);
      setResetOpen(false);
      toast.success("All memories reset");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async () => {
    if (!userId) return;
    const title = newTitle.trim().slice(0, 200);
    const summary = newSummary.trim().slice(0, 2000);
    if (!title || !summary) {
      toast.error("Title and summary are required");
      return;
    }
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("user_memory_entries")
        .insert({ user_id: userId, title, summary, scope: "manual" })
        .select("id, title, summary, scope, created_at")
        .maybeSingle();
      if (error) throw error;
      if (data) setEntries((es) => [data as MemoryEntry, ...es]);
      setNewTitle("");
      setNewSummary("");
      setAddOpen(false);
      toast.success("Memory added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const grouped = useMemo(() => {
    const auto = entries.filter((e) => e.scope !== "manual");
    const manual = entries.filter((e) => e.scope === "manual");
    return { auto, manual };
  }, [entries]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const AddForm = () => (
    <div className="space-y-3">
      <input
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Short title (e.g. Loves espresso)"
        maxLength={200}
        className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] bg-foreground/[0.04] border border-border/70 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground/40 transition"
      />
      <textarea
        value={newSummary}
        onChange={(e) => setNewSummary(e.target.value)}
        placeholder="One-sentence fact Megsy should remember about you"
        rows={3}
        maxLength={2000}
        className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] bg-foreground/[0.04] border border-border/70 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground/40 resize-none transition"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setAddOpen(false);
            setNewTitle("");
            setNewSummary("");
          }}
          className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="px-4 py-2 rounded-xl text-[13px] font-medium bg-foreground text-background disabled:opacity-50 hover:opacity-90 transition inline-flex items-center gap-2"
        >
          {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );

  const EntryGroup = ({
    title,
    items,
  }: {
    title: string;
    items: MemoryEntry[];
  }) => (
    <div>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        <span className="text-[11px] text-muted-foreground">{items.length}</span>
      </div>
      <SubCard flush>
        <div className="divide-y divide-border/60">
          {items.map((e) => (
          <div
            key={e.id}
            className="group flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-foreground/[0.03] transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-foreground leading-snug">{e.title}</p>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                {e.summary}
              </p>
            </div>
            <button
              onClick={() => handleDelete(e.id)}
              disabled={deletingId === e.id}
              className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
              aria-label="Delete memory"
            >
              {deletingId === e.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          ))}
        </div>
      </SubCard>
    </div>
  );

  return (
    <SubShell
      title="Memory"
      subtitle="Every fact Megsy has archived about you — pause, delete or teach new ones."
      action={
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={busy} />
      }
    >
      <SubSection
        title="Status"
        description={
          enabled
            ? "Megsy captures durable facts across every conversation."
            : "New facts won't be saved and existing ones won't be recalled."
        }
      >
        <SubCard>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full",
                enabled
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400",
              )}
            >
              <Brain className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground">
                {enabled ? "Memory is active" : "Memory is paused"}
              </p>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                {entries.length} {entries.length === 1 ? "memory" : "memories"} stored
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={handleToggle} disabled={busy} />
          </div>
        </SubCard>
        <div className="mt-3">
          <SubStatStrip
            items={[
              { label: "Total", value: String(entries.length) },
              { label: "Added by you", value: String(grouped.manual.length) },
              { label: "From chats", value: String(grouped.auto.length) },
            ]}
          />
        </div>
      </SubSection>

      <SubSection
        title="Teach Megsy"
        description="Add something you want Megsy to remember every time you chat."
      >
        <SubCard>
          {!addOpen ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border/70 text-[13px] font-medium text-foreground hover:bg-foreground/[0.05] transition"
            >
              <Plus className="w-4 h-4" />
              Add memory
            </button>
          ) : (
            <AddForm />
          )}
        </SubCard>
      </SubSection>

      {profile?.account_summary && (
        <SubSection
          title="Account summary"
          description="A rolling summary Megsy uses to catch up between sessions."
        >
          <SubCard>
            <p className="text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap">
              {profile.account_summary}
            </p>
          </SubCard>
        </SubSection>
      )}

      <SubSection
        title="Stored memories"
        description="Everything Megsy currently knows. Hover a row to delete it."
      >
        {entries.length === 0 ? (
          <SubCard className="text-center py-14">
            <p className="text-[14.5px] font-medium text-foreground">Nothing remembered yet</p>
            <p className="text-[12.5px] text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              Share durable facts in chat ("I'm a designer based in Cairo") and Megsy will save
              them automatically.
            </p>
          </SubCard>
        ) : (
          <div className="space-y-6">
            {grouped.manual.length > 0 && (
              <EntryGroup title="Added by you" items={grouped.manual} />
            )}
            {grouped.auto.length > 0 && (
              <EntryGroup title="Learned from chats" items={grouped.auto} />
            )}
          </div>
        )}
      </SubSection>

      {entries.length > 0 && (
        <SubSection
          title="Danger zone"
          description="Erase everything Megsy has learned about you. This can't be undone."
        >
          {!resetOpen ? (
            <DangerCallout
              title="Reset all memories"
              description="Megsy will forget every fact it learned about you."
              action={
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-rose-500/40 text-[12.5px] font-medium text-rose-300 hover:bg-rose-500/10 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              }
            />
          ) : (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5 space-y-4">
              <div>
                <p className="text-[14.5px] font-semibold text-rose-300">
                  Reset all memories?
                </p>
                <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">
                  Megsy will forget every fact it learned about you. This can't be undone.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setResetOpen(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium bg-rose-500 text-white disabled:opacity-50 hover:bg-rose-500/90 transition inline-flex items-center gap-2"
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Reset everything
                </button>
              </div>
            </div>
          )}
        </SubSection>
      )}
    </SubShell>
  );
};

export default MemoryPage;
