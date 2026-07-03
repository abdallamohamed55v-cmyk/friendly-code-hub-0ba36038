import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Search, Sparkles, PenLine, Check } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  subscribeToResearchJob,
  approveResearchPlan,
  updateResearchPlan,
  tickResearchJob,
  type ResearchJob,
} from "@/lib/deepResearchJob";
import ResearchPlanCard from "@/components/research/ResearchPlanCard";
import DeepResearchCard from "@/components/chat/DeepResearchCard";
import { saveResearch } from "@/lib/researchPersistence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  jobId: string;
  conversationId?: string | null;
  /** Index of this card in the conversation (for sessionKey). */
  turnIndex?: number;
  onRunningChange?: (jobId: string, running: boolean) => void;
}

const ResearchJobBubble = ({ jobId, conversationId, turnIndex = 0, onRunningChange }: Props) => {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    const unsub = subscribeToResearchJob(jobId, (j) => setJob(j));
    return () => unsub();
  }, [jobId]);

  useEffect(() => {
    if (!job) return;
    const running =
      job.awaiting_approval ||
      ["queued", "planning", "awaiting_approval", "searching", "synthesizing"].includes(job.status);
    onRunningChange?.(jobId, running);
    if (!running || job.awaiting_approval || job.status === "awaiting_approval") return;
    let stopped = false;
    const runTick = () => {
      const lastUpdate = new Date(job.updated_at).getTime();
      if (!stopped && !Number.isNaN(lastUpdate) && Date.now() - lastUpdate >= 20_000) {
        tickResearchJob(jobId).catch(() => {});
      }
    };
    runTick();
    const id = window.setInterval(runTick, 20_000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [job, jobId, onRunningChange]);

  // Persist final report to research_reports so the preview page can open it via sessionKey.
  useEffect(() => {
    if (!job || persisted) return;
    if (job.status !== "succeeded" || !job.report) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid || !conversationId) {
        setPersisted(true);
        return;
      }
      const sessionKey = `conv_${conversationId}_${turnIndex}`;
      await saveResearch(uid, {
        session_key: sessionKey,
        query: job.query,
        report: job.report ?? "",
        images: job.images || [],
        steps: job.steps || [],
      });
      // Persist used/unused/thinking too via direct update.
      const usedUrls = (job.sources || []).map((s) => s.url);
      await supabase
        .from("research_reports")
        .update({
          used_sources: usedUrls.map((u) => ({ url: u })) as any,
          unused_sources: (job.unused_sources || []) as any,
          thinking: job.thinking,
          plan: job.plan as any,
        })
        .eq("user_id", uid)
        .eq("session_key", sessionKey);
      setPersisted(true);
    })();
  }, [job, conversationId, turnIndex, persisted]);

  if (!job) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading research…
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground/90">
        <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
        <div>{job.error || "Research failed."}</div>
      </div>
    );
  }

  if (job.status === "succeeded" && job.report) {
    const sessionKey = conversationId ? `conv_${conversationId}_${turnIndex}` : undefined;
    return (
      <DeepResearchCard
        query={job.query}
        report={job.report}
        images={job.images || []}
        sessionKey={sessionKey}
        createdAt={job.finished_at || job.created_at}
      />
    );
  }

  // Planning / awaiting approval
  if (
    job.status === "planning" ||
    job.awaiting_approval ||
    job.status === ("awaiting_approval" as any)
  ) {
    const intro = job.plan_intro || "Drafting a research plan…";
    const ready = job.plan_ready || undefined;
    const planSteps = (job.plan as unknown as string[]) || [];

    const handleStart = async (editedSteps?: string[]) => {
      setBusy(true);
      try {
        await approveResearchPlan(jobId, editedSteps);
      } catch (e: any) {
        toast.error(e?.message || "Failed to start");
      } finally {
        setBusy(false);
      }
    };
    const handleSubmitEdit = async () => {
      if (!feedback.trim()) return;
      setBusy(true);
      try {
        await updateResearchPlan(jobId, feedback.trim());
        setEditing(false);
        setFeedback("");
      } catch (e: any) {
        toast.error(e?.message || "Failed to update plan");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="space-y-3">
        {!ready && planSteps.length === 0 && (
          <p className="text-sm text-foreground/80 leading-relaxed">{intro}</p>
        )}
        {(ready || planSteps.length > 0) && (
          <ResearchPlanCard
            plan={{ goal: job.plan_goal || job.query, steps: planSteps }}
            intro={intro}
            ready={ready}
            awaitingApproval={job.awaiting_approval}
            onStart={handleStart}
            onEdit={() => setEditing(true)}
            loading={busy}
            editing={editing}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onSubmitEdit={handleSubmitEdit}
            onCancelEdit={() => {
              setEditing(false);
              setFeedback("");
            }}
          />
        )}
      </div>
    );
  }

  // Running (searching / synthesizing)
  const title = (job.plan_goal || job.query || "").trim();
  const isRtl = /[\u0600-\u06FF\u0750-\u077F]/.test(title);
  const sourcesCount = Array.isArray(job.sources) ? job.sources.length : 0;

  // Determine current phase from stage text
  const stageText = (job.stage || "").toLowerCase();
  let phase: 0 | 1 | 2 = 0;
  if (/(writ|report|compos|synthes|assembl|final|تقرير|إنشاء|كتاب)/i.test(stageText)) phase = 2;
  else if (/(analy|reason|think|reflect|outline|تحليل|نتائج)/i.test(stageText)) phase = 1;
  else phase = 0;

  const phases = [
    {
      icon: Search,
      label: isRtl ? `يبحث في ${sourcesCount} مصدر` : `Searching ${sourcesCount} sources`,
    },
    { icon: Sparkles, label: isRtl ? "يحلل النتائج" : "Analyzing results" },
    { icon: PenLine, label: isRtl ? "يكتب التقرير الكامل" : "Writing the full report" },
  ];

  const progress = Math.max(0, Math.min(100, Number(job.progress) || 0));
  const stageLabel = job.stage || phases[phase].label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[440px] rounded-3xl border border-border/40 bg-card/70 backdrop-blur-md p-5 shadow-sm overflow-hidden relative"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Ambient shimmer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 120px at 50% 0%, hsl(var(--primary) / 0.10), transparent 70%)",
        }}
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {title && (
        <h3 className="relative text-base font-semibold text-foreground leading-snug mb-4">
          {title}
        </h3>
      )}

      <ul className="relative space-y-2.5">
        {phases.map((p, i) => {
          const active = i === phase;
          const done = i < phase;
          const Icon = done ? Check : p.icon;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 text-[13.5px] leading-relaxed transition-colors ${
                active ? "text-foreground" : done ? "text-foreground/50" : "text-foreground/35"
              }`}
            >
              <span
                className={`relative inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                  active
                    ? "border-primary/40 bg-primary/10"
                    : done
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-foreground/10 bg-transparent"
                }`}
              >
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/40"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <Icon
                  className={`h-3.5 w-3.5 ${active ? "text-primary" : done ? "text-foreground/60" : "text-foreground/40"} ${active && Icon !== Check ? "animate-pulse" : ""}`}
                  strokeWidth={2.2}
                />
              </span>
              <span className="flex-1 min-w-0">
                {active ? (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={stageLabel}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className="bg-clip-text text-transparent"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg, hsl(var(--foreground) / 0.55), hsl(var(--foreground)) 40%, hsl(var(--foreground) / 0.55) 80%)",
                          backgroundSize: "200% 100%",
                          animation: "researchShimmer 2.2s linear infinite",
                        }}
                      >
                        {stageLabel}
                      </span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="text-foreground/60"
                      >
                        …
                      </motion.span>
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <span>{p.label}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Progress bar */}
      <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(6, progress)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), transparent)",
          }}
          animate={{ x: ["-40%", "140%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <style>{`@keyframes researchShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </motion.div>
  );
};

export default ResearchJobBubble;
