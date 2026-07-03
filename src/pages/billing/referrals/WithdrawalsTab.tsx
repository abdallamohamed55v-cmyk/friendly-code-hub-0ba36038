import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import referralPiggy from "@/assets/referral-piggy.png";
import {
  EmptyState,
  MIN_PAYOUT,
  fmtDate,
  statusLabel,
  useReferrals,
  INK,
  YELLOW,
  PINK,
  MINT,
  SURFACE,
  SURFACE_2,
  BORDER,
  TEXT,
  MUTED,
} from "../ReferralsPage";

export default function WithdrawalsTab() {
  const navigate = useNavigate();
  const { available, canWithdraw, wds } = useReferrals();
  const pct = Math.min(100, Math.round((available / MIN_PAYOUT) * 100));

  return (
    <div className="mt-6 space-y-5" style={{ color: TEXT }}>
      {/* Pink piggy hero */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5"
        style={{
          backgroundColor: PINK,
          border: `2.5px solid ${INK}`,
          boxShadow: `4px 4px 0 ${PINK}30`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="max-w-[60%]">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-wider"
              style={{ backgroundColor: INK, color: PINK, fontWeight: 800 }}
            >
              Cash out
            </span>
            <p
              className="mt-3 text-[12px] uppercase tracking-wider"
              style={{ fontWeight: 800, color: INK, opacity: 0.7 }}
            >
              Ready to withdraw
            </p>
            <div className="mt-1 flex items-baseline gap-1" style={{ color: INK }}>
              <span className="text-[20px]" style={{ fontWeight: 800 }}>
                $
              </span>
              <span
                className="text-[44px] leading-none tabular-nums"
                style={{ fontWeight: 900, letterSpacing: "-0.03em" }}
              >
                {available.toFixed(2)}
              </span>
            </div>
          </div>
          <img
            src={referralPiggy}
            alt=""
            width={1024}
            height={768}
            loading="lazy"
            className="pointer-events-none h-32 w-32 shrink-0 object-contain"
          />
        </div>

        {/* Progress to minimum */}
        <div className="mt-4" style={{ color: INK }}>
          <div
            className="flex items-center justify-between text-[12px]"
            style={{ fontWeight: 800 }}
          >
            <span>Minimum payout</span>
            <span className="tabular-nums">
              ${available.toFixed(0)} / ${MIN_PAYOUT}
            </span>
          </div>
          <div
            className="mt-2 h-4 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "#FFFFFF", border: `2px solid ${INK}` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: YELLOW,
                borderRight: pct > 0 && pct < 100 ? `2px solid ${INK}` : "none",
              }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate("/settings/withdraw")}
          disabled={!canWithdraw}
          className="mt-4 w-full rounded-full px-5 py-3.5 text-[15px] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: INK,
            color: YELLOW,
            fontWeight: 800,
            border: `2px solid ${INK}`,
            boxShadow: `3px 3px 0 ${INK}`,
          }}
        >
          {canWithdraw ? "Request withdrawal" : `Earn $${(MIN_PAYOUT - available).toFixed(2)} more`}
        </button>
      </div>

      {/* Payout history */}
      <div>
        <h2
          className="px-1 text-[18px]"
          style={{ fontWeight: 900, letterSpacing: "-0.02em", color: TEXT }}
        >
          Payout history
        </h2>
        <div
          className="mt-3 rounded-[22px] px-4"
          style={{ backgroundColor: SURFACE, border: `1.5px solid ${BORDER}` }}
        >
          {wds.length === 0 ? (
            <EmptyState
              title="No payouts yet"
              hint={`Request a withdrawal once you reach $${MIN_PAYOUT}.`}
            />
          ) : (
            <ul className="divide-y" style={{ borderColor: BORDER }}>
              {wds.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between py-3"
                  style={{ borderColor: BORDER }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-2xl"
                      style={{ backgroundColor: MINT, border: `2px solid ${INK}`, color: INK }}
                    >
                      <Wallet className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <div>
                      <p
                        className="text-[14.5px] tabular-nums"
                        style={{ fontWeight: 900, color: TEXT }}
                      >
                        ${Number(w.amount).toFixed(2)}
                      </p>
                      <p className="text-[11px]" style={{ color: MUTED, fontWeight: 600 }}>
                        {w.method} · {fmtDate(w.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px]"
                    style={{
                      backgroundColor: SURFACE_2,
                      border: `1.5px solid ${BORDER}`,
                      fontWeight: 800,
                      color: TEXT,
                    }}
                  >
                    {statusLabel(w.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
