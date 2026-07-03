/** @doc Plans, yearly toggle, MC top-up packs and the official pricing FAQ — cinematic redesign. */
import { useState, useEffect, useRef } from "react";
import { m as motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowLeft, Check, Loader2, ChevronDown, Menu, X, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/supabaseFunction";
import { goBackOr } from "@/lib/navigation";
import { WORKSPACE_PRODUCT_MAP } from "@/lib/workspacePlans";
import SEOHead from "@/components/common/SEOHead";
import LandingFooter from "@/components/landing/LandingFooter";
import MegsyStar from "@/components/branding/MegsyStar";
import { usePromoCountdown } from "@/hooks/usePromoCountdown";

import {
  PLANS as RAW_PLANS,
  FAQS as RAW_FAQS,
  type PlanTier,
} from "@/data/pricingData";
import { brandText, getZoneBrand } from "@/lib/zoneBrand";

const PRODUCT_MAP: Record<PlanTier, { monthly: string; yearly: string }> = WORKSPACE_PRODUCT_MAP;
const pad2 = (n: number) => String(n).padStart(2, "0");

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4";

const NAV_LINKS = [
  { label: "Plans", href: "#plans-grid" },
  { label: "FAQ", href: "#pricing-faq" },
  { label: "Support", href: "mailto:support@megsyai.com" },
];

/* ----------------------------- StaggeredFade ----------------------------- */
function StaggeredFade({
  text,
  className,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  startDelay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const chars = Array.from(text);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: startDelay + i * 0.07, ease: "easeOut" }}
          style={{ display: "inline-block", whiteSpace: c === " " ? "pre" : "normal" }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}

/* ------------------------------- CountUp -------------------------------- */
function CountUp({
  value,
  duration = 0.8,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState<string>(() =>
    Math.round(value).toLocaleString("en-US")
  );
  const prev = useRef(value);
  const mounted = useRef(false);

  useEffect(() => {
    const unsub = mv.on("change", (v) => {
      setDisplay(Math.round(v).toLocaleString("en-US"));
    });
    return unsub;
  }, [mv]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      mv.set(value);
      prev.current = value;
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      from: prev.current,
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}


/* ============================== Pricing Page ============================== */
const PricingPage = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const BRAND = getZoneBrand();
  const promo = usePromoCountdown();
  const PLANS = brandText(RAW_PLANS);
  const FAQS = brandText(RAW_FAQS);

  // Load Garamond + Geist webfonts once
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const add = (href: string, rel = "stylesheet") => {
      const l = document.createElement("link");
      l.rel = rel;
      l.href = href;
      l.crossOrigin = "anonymous";
      document.head.appendChild(l);
      links.push(l);
    };
    add("https://fonts.googleapis.com", "preconnect");
    add("https://fonts.gstatic.com", "preconnect");
    add("https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&display=swap");
    add("https://db.onlinewebfonts.com/c/2bf40ab72ea4897a3fd9b6e48b233a19?family=Garamond");
    return () => {
      links.forEach((l) => l.parentNode && l.parentNode.removeChild(l));
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("plan")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setCurrentPlan((ws as any)?.plan ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async (
    tier: PlanTier,
    opts: { trial?: boolean; interval?: "monthly" | "yearly" } = {},
  ) => {
    if (loadingTier) return;
    setLoadingTier(tier);
    const interval: "monthly" | "yearly" = opts.interval ?? (isYearly ? "yearly" : "monthly");

    let {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed.session;
    }
    if (!session?.access_token) {
      setLoadingTier(null);
      await supabase.auth.signOut().catch(() => {});
      toast.error("Please sign in again to continue.");
      navigate("/auth?redirect=/pricing");
      return;
    }

    try {
      const { data, error } = await invokeFunction("openrouter-media", {
        body: { kind: "checkout", tier, interval, trial: opts.trial === true },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) {
        const msg = (error as any)?.message?.toLowerCase?.() || "";
        if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("jwt")) {
          await supabase.auth.signOut().catch(() => {});
          toast.error("Your session expired. Please sign in again.");
          navigate("/auth?redirect=/pricing");
          return;
        }
        throw error;
      }
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.error || "Checkout failed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to open checkout. Please try again.");
      setLoadingTier(null);
    }
  };

  const scrollTo = (id: string) => {
    if (id.startsWith("#")) {
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = id;
    }
    setMobileOpen(false);
  };

  return (
    <div
      className="min-h-dvh w-full text-white"
      style={{
        background: "#000000",
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <SEOHead
        title={`Pricing — ${BRAND} AI Plans & Credits`}
        description={`Simple plans for ${BRAND} AI. Pay-as-you-go credits or monthly subscriptions for chat, images, video, slides and full-stack builds.`}
        path="/pricing"
      />

      <style>{`
        .font-garamond { font-family: 'Garamond', 'Times New Roman', serif; }

        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          transition: background .25s ease, transform .15s ease, box-shadow .25s ease;
        }
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .liquid-glass:hover {
          background: rgba(255, 255, 255, 0.04);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.15);
        }
        .liquid-glass:active { transform: scale(0.98); }

        .mobile-menu-glass {
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .pricing-card-glass {
          background: linear-gradient(160deg, rgba(220,60,70,0.34) 0%, rgba(140,24,32,0.44) 45%, rgba(50,8,12,0.6) 100%);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(255,170,170,0.24);
          box-shadow: none;
          transition: transform .4s ease, border-color .4s ease, background .4s ease;
          color: #ffffff;
        }
        .pricing-card-glass, .pricing-card-glass * { color: #ffffff !important; }
        .pricing-card-glass:hover {
          transform: translateY(-3px);
          border-color: rgba(255,200,200,0.45);
        }
        .pricing-card-elite {
          border: 1px solid rgba(255,200,200,0.42);
          background: linear-gradient(160deg, rgba(240,90,100,0.42) 0%, rgba(170,30,40,0.52) 45%, rgba(60,10,14,0.65) 100%);
          box-shadow: none;
        }

        .faq-glass {
          background: rgba(16, 16, 18, 0.6);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .hero-vignette {
          background:
            radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 55%, rgba(1,1,1,0.9) 100%),
            linear-gradient(180deg, rgba(1,1,1,0.55) 0%, rgba(1,1,1,0.05) 30%, rgba(1,1,1,0.1) 60%, #010101 100%);
        }
        .section-bg {
          background: #000000;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* ============================ HERO ============================ */}
      <section className="relative w-full overflow-hidden min-h-[68vh] md:min-h-[78vh] flex flex-col">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
          src={HERO_VIDEO}
        />
        <div className="absolute inset-0 hero-vignette pointer-events-none" />

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between md:justify-center md:gap-12 px-5 sm:px-8 pt-6 sm:pt-8">
          <button
            onClick={() => goBackOr(navigate, "/")}
            className="md:absolute md:left-8 text-white hover:text-white transition-colors flex items-center gap-2"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span
              className="text-xs uppercase font-light hidden sm:inline"
              style={{ letterSpacing: "0.25em" }}
            >
              Back
            </span>
          </button>



        </nav>


        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-5 sm:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
          <h1
            className="font-garamond font-normal text-white tracking-tight mb-4 sm:mb-6 text-4xl sm:text-6xl md:text-8xl lg:text-9xl"
            style={{ lineHeight: 1.08 }}
          >
            <StaggeredFade text="CHOOSE YOUR" className="block" />
            <StaggeredFade text="CREATIVE EDGE" className="block" startDelay={0.4} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-white/70 font-light leading-relaxed max-w-xs sm:max-w-md text-sm sm:text-base md:text-lg"
          >
            Simple plans for the entire {BRAND} ecosystem,<br className="hidden sm:inline" />
            {" "}built for creators, teams and enterprises.
          </motion.p>






          {/* Promo */}
          {promo.active && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.2 }}
              className="mt-6 sm:mt-8 inline-flex flex-col md:flex-row items-center gap-5 md:gap-7 px-7 py-4 rounded-2xl mobile-menu-glass"

            >
              <div className="text-left">
                <p
                  className="text-white text-xs uppercase font-light"
                  style={{ letterSpacing: "0.25em" }}
                >
                  Limited Launch Offer
                </p>
                <p className="text-xs text-white/85 mt-1">
                  Unlock everything — 50% OFF your first month
                </p>
              </div>
              <div
                className="h-px w-full md:w-px md:h-10"
                style={{ background: "rgba(255,255,255,0.12)" }}
              />
              <div className="flex gap-4 font-garamond tabular-nums">
                {[
                  { v: pad2(promo.days), l: "Days" },
                  { v: pad2(promo.hours), l: "Hrs" },
                  { v: pad2(promo.minutes), l: "Min" },
                  { v: pad2(promo.seconds), l: "Sec" },
                ].map((t) => (
                  <div key={t.l} className="flex flex-col items-center min-w-[2.25rem]">
                    <span className="text-2xl text-white leading-none">{t.v}</span>
                    <span
                      className="text-[9px] uppercase mt-1 text-white/80"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      {t.l}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============================ PLANS ============================ */}
      <section
        id="plans-grid"
        className="section-bg relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 scroll-mt-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h2
            className="font-garamond text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1 }}
          >
            The Plans
          </h2>
          <p
            className="mt-3 text-white/85 text-xs sm:text-sm uppercase font-light"
            style={{ letterSpacing: "0.3em" }}
          >
            Unlock your creative power — start today
          </p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-4">
            <span
              className={`text-xs uppercase transition-colors ${isYearly ? "text-white/80" : "text-white"}`}
              style={{ letterSpacing: "0.2em" }}
            >
              Monthly
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isYearly}
              onClick={() => setIsYearly((v) => !v)}
              className="relative w-14 h-7 rounded-full border border-white/40 backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.18)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 16px rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="absolute top-1/2 left-1 w-5 h-5 rounded-full transition-transform duration-300"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 2px 8px rgba(255,255,255,0.4), inset 0 1px 0 rgba(255,255,255,0.9)",
                  transform: `translateY(-50%) translateX(${isYearly ? "26px" : "0px"})`,
                }}
              />
            </button>
            <span
              className={`text-xs uppercase flex items-center gap-2 transition-colors ${isYearly ? "text-white" : "text-white/80"}`}
              style={{ letterSpacing: "0.2em" }}
            >
              Yearly
              <span
                className="text-[9px] px-2 py-0.5 rounded-full border border-white/25 text-white/85 font-normal"
                style={{ letterSpacing: "0.15em" }}
              >
                −20%
              </span>
            </span>
          </div>
        </motion.div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((p, i) => {
            const price = isYearly ? p.yearlyPrice : p.monthlyPrice;
            const credits = isYearly ? p.yearlyCredits : p.monthlyCredits;
            const isElite = p.tier === "elite";
            const isBusiness = p.tier === "business";

            const order: PlanTier[] = ["starter", "pro", "elite", "business"];
            const cur = (currentPlan ?? "starter").toLowerCase() as PlanTier;
            const curIdx = order.indexOf(cur);
            const thisIdx = order.indexOf(p.tier);
            const isCurrent = curIdx === thisIdx;
            const isLower = thisIdx < curIdx;
            const ctaLabel = isCurrent
              ? "Current plan"
              : isLower
                ? `Downgrade to ${p.name}`
                : `Get ${p.name}`;

            return (
              <motion.div
                key={p.tier}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`pricing-card-glass relative rounded-3xl flex flex-col ${isElite ? "pricing-card-elite md:scale-[1.03] z-10" : ""}`}
              >
                {isElite && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div
                      className="px-4 py-1 rounded-full text-[10px] uppercase font-light text-white border border-white/30"
                      style={{
                        letterSpacing: "0.28em",
                        background: "rgba(10,10,10,0.7)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="relative z-10 p-7 sm:p-8 flex flex-col flex-1">
                  <h3
                    className="font-garamond text-3xl text-white mb-4"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    {p.name}
                  </h3>

                  <div className="flex items-baseline gap-1.5">
                    <span className="font-garamond text-2xl text-white">$</span>
                    <CountUp
                      value={price}
                      className="font-garamond text-6xl leading-none text-white tabular-nums"
                    />
                    <span className="text-white text-xs ml-1 uppercase" style={{ letterSpacing: "0.2em" }}>
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-white/85 line-through tabular-nums">
                      $<CountUp value={price * 2} />
                    </span>
                    <span
                      className="text-[10px] uppercase px-2 py-0.5 rounded-full border border-white/40 text-white font-light"
                      style={{ letterSpacing: "0.18em" }}
                    >
                      50% Off
                    </span>
                  </div>

                  {credits && (
                    <p
                      className="text-white text-[11px] mt-5 uppercase font-light"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      {credits}
                    </p>
                  )}

                  <div
                    className="h-px w-full my-7"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                    }}
                  />

                  {p.tier !== "starter" && (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(p.tier)}
                      disabled={loadingTier !== null || isCurrent}
                      className={`liquid-glass w-full py-3.5 rounded-full text-xs uppercase font-normal text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${isElite ? "bg-white/[0.04]" : ""}`}
                      style={{ letterSpacing: "0.2em" }}
                    >
                      {loadingTier === p.tier ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        ctaLabel
                      )}
                    </button>
                  )}

                  {(() => {
                    const list =
                      (isYearly ? p.yearlyFeatures : p.monthlyFeatures) ?? p.features;
                    const periodKey = isYearly ? "y" : "m";
                    return (
                      <motion.ul
                        key={`${p.tier}-${periodKey}`}
                        className="mt-7 space-y-3 flex-1"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: {},
                          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
                        }}
                      >
                        {list.map((f, idx) => {
                          const isUnlimited = /unlimited/i.test(f);
                          const isSave = /^save\s|\bbonus\b|\blocked-?in\b|2 months free/i.test(f);
                          return (
                            <motion.li
                              key={`${f}-${idx}`}
                              className="flex items-start gap-3 text-[13px] leading-snug"
                              style={{
                                color: "#ffffff",
                                fontWeight: isUnlimited || isSave ? 500 : 400,
                              }}
                              variants={{
                                hidden: { opacity: 0, x: -18, filter: "blur(6px)" },
                                visible: {
                                  opacity: 1,
                                  x: 0,
                                  filter: "blur(0px)",
                                  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                                },
                              }}
                            >
                              <motion.span
                                className="shrink-0 mt-[3px] inline-flex items-center justify-center"
                                variants={{
                                  hidden: { scale: 0.4, rotate: -90, opacity: 0 },
                                  visible: {
                                    scale: 1,
                                    rotate: 0,
                                    opacity: 1,
                                    transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
                                  },
                                }}
                              >
                                {isUnlimited ? (
                                  <MegsyStar className="w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                                )}
                              </motion.span>
                              <span className="flex-1">{f}</span>
                            </motion.li>
                          );
                        })}
                      </motion.ul>

                    );
                  })()}

                </div>
              </motion.div>
            );
          })}
        </div>

      </section>

      {/* ============================ FAQ ============================ */}
      <section id="pricing-faq" className="relative overflow-hidden bg-black py-16 md:py-28 scroll-mt-8">
        {/* Massive FAQS headline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="px-4"
        >
          <h2 className="font-display text-[24vw] md:text-[28vw] font-black uppercase leading-[0.8] tracking-tighter text-violet-500 text-center select-none">
            FAQS
          </h2>
        </motion.div>

        {/* Question list */}
        <div className="mx-auto mt-16 max-w-6xl px-6">
          <ul className="border-t border-white/10">
            {FAQS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <li key={item.q} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-7 text-left transition-colors hover:text-white/90"
                  >
                    <span className="font-display text-lg font-bold text-white md:text-2xl">
                      {item.q}
                    </span>
                    <span className="shrink-0 text-violet-400">
                      {isOpen ? (
                        <Minus className="h-7 w-7" strokeWidth={2.5} />
                      ) : (
                        <Plus className="h-7 w-7" strokeWidth={2.5} />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-7 pr-12 text-base leading-relaxed text-white/60 md:text-lg">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs uppercase font-light text-white/70" style={{ letterSpacing: "0.18em" }}>
            <a href="mailto:support@megsyai.com" className="hover:text-white transition-colors">
              support@megsyai.com
            </a>
            <span className="hidden sm:inline text-white/20">·</span>
            <a href="tel:+201098821812" className="hover:text-white transition-colors">
              +20 109 882 1812
            </a>
            <span className="hidden sm:inline text-white/20">·</span>
            <button
              onClick={() => navigate("/refund")}
              className="hover:text-white transition-colors"
            >
              Refund Policy
            </button>
          </div>
        </div>
      </section>


      {/* ============================ FOOTER ============================ */}
      <LandingFooter />
    </div>
  );
};

export default PricingPage;
