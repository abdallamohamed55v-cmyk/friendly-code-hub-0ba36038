/** @doc Compact Upgrade banner rendered inside the composer on the empty landing state (mobile). Hides after the first message and for paid users. */
import { Link } from "react-router-dom";
import { useUserPlan } from "@/hooks/useUserPlan";

export function ComposerUpgradeBanner() {
  const { isPaid, loading } = useUserPlan();
  if (loading || isPaid) return null;
  return (
    <div className="md:hidden px-4 pt-2 pb-1">
      <div className="flex items-center justify-between gap-3 h-8">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-1 h-1 rounded-full bg-white/40" aria-hidden />
          <span className="text-[13px] text-white/50 truncate font-normal tracking-tight">
            Get more with Megsy Pro
          </span>
        </div>
        <Link
          to="/pricing"
          aria-label="Upgrade to Megsy Pro"
          className="shrink-0 text-[13px] font-semibold text-white/90 hover:text-white transition-colors"
        >
          Upgrade →
        </Link>
      </div>
      <div className="mt-2 h-px w-full bg-white/[0.06]" />
    </div>
  );
}
