/** @doc Billing dashboard — current plan, invoices, payment methods, MC usage. */
// Billing — editorial redesign using SubShell (matches account/workspaces settings).
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, Sparkles, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SubShell, SubSection, SubCard, SubStatStrip } from "@/components/settings/SubShell";
import KashierTopUp from "@/components/billing/KashierTopUp";

// Heuristic: show Kashier pay option to MENA/Arabic users.
const MENA_TIMEZONES = [
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Qatar",
  "Asia/Kuwait",
  "Asia/Baghdad",
  "Asia/Amman",
  "Asia/Beirut",
  "Asia/Damascus",
  "Africa/Casablanca",
  "Africa/Algiers",
  "Africa/Tunis",
  "Africa/Tripoli",
  "Africa/Khartoum",
  "Asia/Muscat",
  "Asia/Bahrain",
];
function isMenaUser(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (MENA_TIMEZONES.includes(tz)) return true;
    const lang = (navigator.language || "").toLowerCase();
    if (lang.startsWith("ar")) return true;
  } catch {
    /* noop */
  }
  return false;
}


const BillingPage = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("Free");
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, plan")
        .eq("id", user.id)
        .single();
      if (profile) {
        setCredits(Number(profile.credits) || 0);
        setPlan(profile.plan || "Free");
      }
      const { data: txns } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (txns) setTransactions(txns);
    };
    load();
  }, []);

  const EARNED_ACTIONS = new Set([
    "credit_addition",
    "admin_topup",
    "code_build_refund",
    "subscription_purchase",
    "referral_bonus",
    "reward",
  ]);
  const isEarnedTx = (t: any) => {
    const amt = Number(t.amount) || 0;
    if (amt < 0) return false;
    if (EARNED_ACTIONS.has(String(t.action_type || "").toLowerCase())) return true;
    const d = String(t.description || "").toLowerCase();
    return (
      d.startsWith("reward") ||
      d.includes("bonus") ||
      d.includes("refund") ||
      d.includes("top-up") ||
      d.includes("topup")
    );
  };
  const totalEarned = transactions
    .filter(isEarnedTx)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalSpent = transactions
    .filter((t) => !isEarnedTx(t))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const recentTransactions = transactions;

  return (
    <SubShell
      title="Billing"
      subtitle="Manage your MC balance, plan and transaction history."
      action={
        <button
          onClick={() => navigate("/pricing")}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:opacity-90 transition"
        >
          <Sparkles className="w-3.5 h-3.5" /> Top up
        </button>
      }
    >
      <SubSection title="Overview" description="Your current plan and MC balance.">
        <SubStatStrip
          items={[
            { label: "Plan", value: plan },
            { label: "Balance", value: credits.toLocaleString(), sub: "MC" },
            { label: "Spent", value: totalSpent.toLocaleString(), sub: "MC" },
            { label: "Earned", value: totalEarned.toLocaleString(), sub: "MC" },
          ]}
        />
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => navigate("/pricing")}
            className="inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Top up MC
          </button>
          <button
            onClick={() => navigate("/settings/referrals")}
            className="inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border/70 text-foreground text-[13px] font-medium hover:bg-foreground/[0.04] transition"
          >
            Earn MC <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </SubSection>

      {isMenaUser() && (
        <SubSection
          title="طرق دفع محلية"
          description="ادفع بالجنيه المصري أو ريال أو درهم عبر كاشير — يدعم كل البطاقات وفودافون كاش."
        >
          <KashierTopUp />
        </SubSection>
      )}



      <SubSection
        title="Recent activity"
        description={`${transactions.length} entries — every top-up, reward and deduction is logged.`}
      >
        {transactions.length === 0 ? (
          <SubCard className="text-center py-14">
            <Clock className="w-7 h-7 text-muted-foreground/50 mx-auto mb-3" strokeWidth={1.8} />
            <p className="text-[14px] font-medium text-foreground">No transactions yet</p>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              Your MC history will appear here.
            </p>
          </SubCard>
        ) : (
          <SubCard flush>
            <div className="divide-y divide-border/60">
              {recentTransactions.map((tx) => {
                const isDeduction = !isEarnedTx(tx);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg shrink-0 border ${
                        isDeduction
                          ? "border-border/70 bg-foreground/[0.04] text-foreground/70"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {isDeduction ? (
                        <TrendingDown className="w-4 h-4" strokeWidth={1.8} />
                      ) : (
                        <TrendingUp className="w-4 h-4" strokeWidth={1.8} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-foreground truncate">
                        {tx.description || tx.action_type}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-[13.5px] font-semibold tabular-nums ${
                        isDeduction ? "text-foreground" : "text-emerald-400"
                      }`}
                    >
                      {isDeduction ? "−" : "+"}
                      {Math.abs(tx.amount)}
                      <span className="text-muted-foreground font-normal ml-1 text-[11px]">MC</span>
                    </span>
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

export default BillingPage;
