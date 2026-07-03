import { Check, CreditCard, Link2, UserPlus, Wallet, Zap } from "lucide-react";
import referralCoin from "@/assets/referral-coin.png";
import {
  CREDITS_PER_SIGNUP,
  COMMISSION_PCT,
  INK,
  YELLOW,
  PINK,
  MINT,
  LAVENDER,
  PEACH,
  SURFACE,
  BORDER,
  TEXT,
  MUTED,
} from "../ReferralsPage";

const STEP_TONES = [PINK, MINT, LAVENDER, YELLOW];

export default function ProgramTab() {
  const steps = [
    {
      icon: <Link2 className="h-5 w-5" strokeWidth={2.5} />,
      t: "Share your link",
      d: "One link, two rewards",
    },
    {
      icon: <UserPlus className="h-5 w-5" strokeWidth={2.5} />,
      t: "Friend joins Megsy AI",
      d: `They get ${CREDITS_PER_SIGNUP} free credits`,
    },
    {
      icon: <CreditCard className="h-5 w-5" strokeWidth={2.5} />,
      t: "They subscribe",
      d: "Any plan or top-up",
    },
    {
      icon: <Zap className="h-5 w-5" strokeWidth={2.5} />,
      t: `You earn ${COMMISSION_PCT}% cash + ${CREDITS_PER_SIGNUP} credits`,
      d: "Lifetime, every payment",
    },
  ];

  const perks = [
    { label: `${CREDITS_PER_SIGNUP} credits`, sub: "Per signup", tone: PINK },
    { label: `${COMMISSION_PCT}% cash`, sub: "Lifetime", tone: MINT },
  ];

  return (
    <section className="mt-6 space-y-5" style={{ color: TEXT }}>
      {/* Hero coin sticker — bright on dark */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5"
        style={{
          backgroundColor: YELLOW,
          border: `2.5px solid ${INK}`,
          boxShadow: `4px 4px 0 ${YELLOW}40`,
        }}
      >
        <div className="relative z-10 max-w-[62%]">
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-wider"
            style={{ backgroundColor: INK, color: YELLOW, fontWeight: 800 }}
          >
            Partner Program
          </span>
          <h1
            className="mt-3 text-[26px] leading-[1.05] tracking-tight"
            style={{ fontWeight: 900, letterSpacing: "-0.02em", color: INK }}
          >
            {COMMISSION_PCT}% cash + {CREDITS_PER_SIGNUP} credits
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: INK, fontWeight: 600, opacity: 0.7 }}>
            For every friend you invite.
          </p>
        </div>
        <img
          src={referralCoin}
          alt=""
          width={1024}
          height={768}
          loading="lazy"
          className="pointer-events-none absolute -right-4 -bottom-4 h-40 w-40 object-contain"
        />
      </div>

      {/* Combined rewards strip */}
      <div className="grid grid-cols-2 gap-3">
        {perks.map((p) => (
          <div
            key={p.label}
            className="rounded-[22px] p-4"
            style={{
              backgroundColor: p.tone,
              border: `2px solid ${INK}`,
              boxShadow: `3px 3px 0 ${p.tone}30`,
              color: INK,
            }}
          >
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4" strokeWidth={3} />
              <span className="text-[18px]" style={{ fontWeight: 900 }}>
                {p.label}
              </span>
            </div>
            <div className="mt-1 text-[12px]" style={{ fontWeight: 700, opacity: 0.7 }}>
              {p.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Section title */}
      <h2
        className="px-1 text-[20px]"
        style={{ fontWeight: 900, letterSpacing: "-0.02em", color: TEXT }}
      >
        How it works
      </h2>

      {/* Steps */}
      <ul className="space-y-3">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-[22px] p-4"
            style={{
              backgroundColor: SURFACE,
              border: `1.5px solid ${BORDER}`,
            }}
          >
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
              style={{
                backgroundColor: STEP_TONES[i % STEP_TONES.length],
                border: `2px solid ${INK}`,
                color: INK,
              }}
            >
              {s.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] leading-tight" style={{ fontWeight: 800, color: TEXT }}>
                {s.t}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: MUTED, fontWeight: 500 }}>
                {s.d}
              </p>
            </div>
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px]"
              style={{
                backgroundColor: YELLOW,
                color: INK,
                fontWeight: 900,
                border: `1.5px solid ${INK}`,
              }}
            >
              {i + 1}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
