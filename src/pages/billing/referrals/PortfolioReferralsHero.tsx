/** @doc Portfolio-style hero adapted to show real referral data on desktop. */
import {
  ArrowUpRight,
  Check,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Send,
  Share2,
  Link2,
  Globe,
  Github,
  Slack,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useReferrals, COMMISSION_PCT, MIN_PAYOUT } from "@/pages/billing/ReferralsPage";

const VIDEO_BACKGROUND =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_150203_44a5bd32-516a-47ce-a077-8acbf9aa8991.mp4";
const VIDEO_EARNINGS =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_154543_d5b83fc1-9cea-44f3-b5e8-8f325935211a.mp4";
const VIDEO_SHARE =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4";

const ICON_ROW_1 = [Twitter, Facebook, Linkedin, Instagram, Youtube, MessageCircle, Mail, Send];
const ICON_ROW_2 = [Share2, Link2, Globe, Github, Slack, Twitter, Mail, MessageCircle];

function SectionLabel({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${align === "center" ? "justify-center" : "justify-start"}`}
    >
      <span className="uppercase tracking-[0.22em] text-[11px] font-medium text-white">
        {children}
      </span>
    </div>
  );
}

function BgVideo({ src }: { src: string }) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      src={src}
    />
  );
}

function IconTile({ Icon }: { Icon: typeof Twitter }) {
  return (
    <div className="lg-liquid-glass h-14 w-14 md:h-16 md:w-16 rounded-xl shrink-0 flex items-center justify-center">
      <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" strokeWidth={1.8} />
    </div>
  );
}

function MarqueeRow({
  icons,
  direction,
}: {
  icons: readonly (typeof Twitter)[];
  direction: "left" | "right";
}) {
  const doubled = [...icons, ...icons];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex gap-3 w-max ${direction === "left" ? "pf-marquee-left" : "pf-marquee-right"}`}
      >
        {doubled.map((Icon, i) => (
          <IconTile key={i} Icon={Icon} />
        ))}
      </div>
    </div>
  );
}

export function PortfolioReferralsHero({ onShareClick }: { onShareClick?: () => void } = {}) {
  const {
    code,
    link,
    totalEarned,
    signups,
    refs,
    available,
    justCopied,
    copyLink,
    shareLink,
    tasks,
    userTasks,
    claimTask,
  } = useReferrals();
  const displayLink =
    link ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${code || "YOURCODE"}`
      : `/?ref=${code || "YOURCODE"}`);
  const shortLink = displayLink.replace(/^https?:\/\//, "");
  const pendingCount = refs.filter((r) => r.status !== "rewarded").length;
  const earnedDisplay = totalEarned >= 1 ? `$${totalEarned.toFixed(0)}` : "$0";


  return (
    <section
      className="w-full bg-[#0a0a0a] text-white antialiased lg:rounded-2xl overflow-hidden"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="px-3 sm:px-6 md:px-10 lg:px-14 py-4 sm:py-8 md:py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-5 mb-5 md:mb-8">
          <div className="max-w-3xl">
            <h1
              className="text-[22px] sm:text-3xl md:text-4xl lg:text-[44px] font-normal tracking-tight text-white"
              style={{ lineHeight: 1.15 }}
            >
              Invite friends, earn together.
            </h1>
            <p className="mt-2.5 text-[13px] sm:text-sm md:text-[15px] leading-[1.6] text-white/60 max-w-3xl">
              Share your personal link and earn real cash every time a new creator joins and
              upgrades. Track signups, payouts, and progress all in one place — the more you
              share, the more you make.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onShareClick) onShareClick();
              else void shareLink();
            }}
            className="lg-liquid-glass hidden lg:inline-flex self-start items-center gap-2 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold text-white whitespace-nowrap"
          >
            Share your link
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Grid — mobile 2-col bento for top row, single column below; desktop 3-col bento */}
        <div className="grid grid-cols-2 lg:grid-cols-3 lg:grid-rows-[auto_1fr] gap-3 sm:gap-4 md:gap-5">

          {/* Total earned — mobile top-left (order 1); desktop col 2 row 2 */}
          <div
            className="order-1 lg:order-none col-span-1 lg:col-span-1 lg:col-start-2 lg:row-start-2 relative overflow-hidden rounded-2xl bg-black min-h-[200px] sm:min-h-[220px] flex flex-col items-center justify-center p-3 sm:p-6"
            style={{ backgroundColor: "#000" }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: "#000" }} />
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <div className="text-3xl sm:text-6xl md:text-7xl lg:text-[88px] font-light tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
                {earnedDisplay}
              </div>
            </div>
            <div className="relative z-10 text-center text-[11px] sm:text-[13px] text-white/80 mt-2 sm:mt-4">
              Available balance
            </div>
            {totalEarned > 0 ? (
              <Link
                to="/settings/referrals/withdrawals"
                className="relative z-10 mt-3 sm:mt-4 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-sm font-medium text-black hover:bg-white/90 transition-colors"
              >
                Withdraw
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="No balance available to withdraw"
                className="relative z-10 mt-3 sm:mt-4 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-sm font-semibold text-black opacity-70 cursor-not-allowed"
              >
                Withdraw
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Your Program — mobile top-right (order 2); desktop col 1 spans both rows */}
          <div className="order-2 lg:order-none col-span-1 lg:col-span-1 lg:col-start-1 lg:row-span-2 relative overflow-hidden rounded-2xl bg-black min-h-[200px] lg:min-h-[520px] flex flex-col">
            <BgVideo src={VIDEO_BACKGROUND} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black/95" />
            <div className="relative z-10 p-3 sm:p-6">
              <SectionLabel align="start">Your Program</SectionLabel>
            </div>
            <div className="relative z-10 flex-1 flex flex-col lg:justify-end p-3 sm:p-6 pt-0 lg:pt-6">
              <div className="hidden lg:block mb-3 sm:mb-4">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-white/85">
                  Your code
                </div>
                <div className="mt-1 text-base sm:text-xl md:text-3xl font-light tracking-tight text-white truncate drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                  {code || "—"}
                </div>
              </div>
              {/* Mobile compact stats — pushed to bottom */}
              <div className="lg:hidden mt-auto grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-2 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                  <div className="text-[16px] font-bold text-white tabular-nums leading-none">{signups}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white mt-1.5">Joined</div>
                </div>
                <div className="rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-2 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                  <div className="text-[16px] font-bold text-white tabular-nums leading-none">{pendingCount}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white mt-1.5">Pending</div>
                </div>
                <div className="col-span-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-2 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                  <div className="text-[16px] font-bold text-white tabular-nums leading-none">${available.toFixed(0)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white mt-1.5">Available</div>
                </div>
              </div>
              {/* Desktop detailed stats */}
              <div className="hidden lg:grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2.5 text-[12.5px] text-white items-center">
                <span className="text-white/85">Signups</span>
                <span className="text-white/70 truncate">Total people joined</span>
                <span className="text-white text-right font-medium tabular-nums">{signups}</span>

                <span className="text-white/85">Pending</span>
                <span className="text-white/70 truncate">Awaiting first upgrade</span>
                <span className="text-white text-right font-medium tabular-nums">{pendingCount}</span>

                <span className="text-white/85">Available</span>
                <span className="text-white/70 truncate">Ready to withdraw</span>
                <span className="text-white text-right font-medium tabular-nums">${available.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Ways to share — mobile order 3 (full width); desktop col 3 row 1 */}
          {/* Mobile-only share button — placed below Earnings + Your Program */}
          <div className="order-3 lg:hidden col-span-2">
            <button
              type="button"
              onClick={() => {
                if (onShareClick) onShareClick();
                else void shareLink();
              }}
              className="lg-liquid-glass w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white whitespace-nowrap"
            >
              Share your link
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="order-4 lg:order-none col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 relative overflow-hidden rounded-2xl bg-black min-h-[200px] sm:min-h-[240px] flex flex-col">
            <BgVideo src={VIDEO_SHARE} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />
            <div className="relative z-10 p-5 md:p-6">
              <SectionLabel>Ways to share</SectionLabel>
            </div>
            <div className="relative z-10 mt-auto p-5 md:p-6 space-y-3">
              <MarqueeRow icons={ICON_ROW_1} direction="left" />
              <MarqueeRow icons={ICON_ROW_2} direction="right" />
            </div>

            {/* Mobile-only: How it works embedded below marquees */}
            <div className="lg:hidden relative z-10 border-t border-white/15 bg-black/55 backdrop-blur-sm p-5">
              <SectionLabel align="start">How it works</SectionLabel>
              <p className="mt-2.5 text-[12.5px] leading-[1.6] text-white/90">
                Earn <span className="font-semibold text-white">{COMMISSION_PCT}% cash</span> from
                every subscription paid through your link — for life.
              </p>
              <ol className="mt-3 space-y-2 text-[12.5px] leading-[1.55] text-white/90">
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 text-white/70 font-mono text-[11px] tabular-nums mt-0.5">01</span>
                  <span>Share your referral link.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 text-white/70 font-mono text-[11px] tabular-nums mt-0.5">02</span>
                  <span>They sign up and upgrade.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 text-white/70 font-mono text-[11px] tabular-nums mt-0.5">03</span>
                  <span>You earn <span className="font-semibold">{COMMISSION_PCT}%</span> credited to your balance.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 text-white/70 font-mono text-[11px] tabular-nums mt-0.5">04</span>
                  <span>Withdraw once you hit <span className="font-semibold">${MIN_PAYOUT}</span>.</span>
                </li>
              </ol>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg bg-white/95 px-1 py-1.5">
                  <div className="text-[13px] font-semibold text-black">{COMMISSION_PCT}%</div>
                  <div className="text-[9px] uppercase tracking-wider text-black/70 mt-0.5">Commission</div>
                </div>
                <div className="rounded-lg bg-white/95 px-1 py-1.5">
                  <div className="text-[13px] font-semibold text-black">${MIN_PAYOUT}</div>
                  <div className="text-[9px] uppercase tracking-wider text-black/70 mt-0.5">Min payout</div>
                </div>
                <div className="rounded-lg bg-white/95 px-1 py-1.5">
                  <div className="text-[13px] font-semibold text-black">∞</div>
                  <div className="text-[9px] uppercase tracking-wider text-black/70 mt-0.5">Lifetime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Your link — mobile order 4 (full width); desktop col 3 row 2 */}
          <div className="order-5 lg:order-none col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-2 pf-noise-overlay relative overflow-hidden rounded-2xl bg-[#324444] p-5 md:p-6">
            <SectionLabel align="start">Your link</SectionLabel>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 min-w-0 text-[14px] text-white whitespace-nowrap overflow-hidden text-ellipsis leading-[1.45]">
                {shortLink}
              </div>
              <button
                type="button"
                aria-label="Copy referral link"
                onClick={() => {
                  void copyLink();
                }}
                className="lg-liquid-glass shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white"
              >
                {justCopied ? (
                  <Check className="h-4 w-4" strokeWidth={2.2} />
                ) : (
                  <Copy className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>

            <p className="mt-5 hidden lg:block text-[12px] leading-[1.6] text-white">
              This is your personal referral link. Anyone who signs up through it is permanently linked to your account.
            </p>

            <ul className="mt-4 hidden lg:block space-y-2 text-[12px] leading-[1.55] text-white">
              <li className="flex gap-2"><span className="text-white">•</span><span>Share it anywhere — social media, chats, email, or your bio.</span></li>
              <li className="flex gap-2"><span className="text-white">•</span><span>You earn <span className="font-semibold text-white">{COMMISSION_PCT}% cash</span> on every paid subscription — for life.</span></li>
              <li className="flex gap-2"><span className="text-white">•</span><span>Track joins, pending and paid commissions from this dashboard.</span></li>
            </ul>

            <p className="mt-4 hidden lg:block text-[11px] leading-[1.5] text-white">
              Tip: tap the copy icon above, or use “Share your link” to open the QR code for quick in-person sharing.
            </p>


          </div>

          {/* How it works — desktop only (mobile version is inside Ways to share) */}
          <div className="hidden lg:block lg:col-start-2 lg:row-start-1 pf-noise-overlay relative overflow-hidden rounded-2xl bg-[#324444] p-4 md:p-6">
            <SectionLabel align="start">How it works</SectionLabel>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-white">
              Earn <span className="font-semibold text-white">{COMMISSION_PCT}% cash</span> from
              every subscription paid by anyone who joins through your link — for life.
            </p>
            <ol className="mt-4 space-y-3 text-[13px] sm:text-[13.5px] leading-[1.6] text-white">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 text-white/80 font-mono text-[12px] tabular-nums mt-0.5">01</span>
                <span>Share your referral link with friends and your audience.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 text-white/80 font-mono text-[12px] tabular-nums mt-0.5">02</span>
                <span>They sign up and upgrade to any paid plan.</span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 text-white/80 font-mono text-[12px] tabular-nums mt-0.5">03</span>
                <span>
                  You earn <span className="font-semibold">{COMMISSION_PCT}%</span> of every
                  payment, credited directly to your balance.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 text-white/80 font-mono text-[12px] tabular-nums mt-0.5">04</span>
                <span>
                  Withdraw your earnings once your balance reaches{" "}
                  <span className="font-semibold">${MIN_PAYOUT}</span> minimum.
                </span>
              </li>
            </ol>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-[15px] font-semibold text-black">{COMMISSION_PCT}%</div>
                <div className="text-[10px] uppercase tracking-wider text-black mt-0.5">Commission</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-[15px] font-semibold text-black">${MIN_PAYOUT}</div>
                <div className="text-[10px] uppercase tracking-wider text-black mt-0.5">Min payout</div>
              </div>
              <div className="rounded-lg bg-white p-2.5">
                <div className="text-[15px] font-semibold text-black">∞</div>
                <div className="text-[10px] uppercase tracking-wider text-black mt-0.5">Lifetime</div>
              </div>
            </div>
          </div>

        </div>

        <div style={{ backgroundColor: "#000" }} className="mt-3 sm:mt-4 md:mt-5 rounded-2xl p-4 sm:p-5 md:p-6 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <h2 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold tracking-tight text-white">
              Tasks &amp; Rewards
            </h2>
          </div>
          {tasks.length === 0 ? (
            <p className="rounded-xl bg-white/5 p-4 text-[14px] font-semibold text-white">
              No tasks available yet.
            </p>
          ) : (
            <>
              {/* Mobile: single CTA to tasks page */}
              <Link
                to="/settings/referrals/tasks"
                className="sm:hidden flex items-center justify-between gap-3 rounded-2xl bg-black text-white border border-white/20 px-4 py-4 active:scale-[0.99] transition-transform"
              >
                <span className="text-[14px] font-bold leading-tight">
                  Complete tasks &amp; earn coins
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0" strokeWidth={2} />
              </Link>


              {/* Desktop / tablet: grid (unchanged) */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3">
                {tasks.slice(0, 3).map((t) => {
                  const ut = userTasks.find((u) => u.task_id === t.id);
                  const done = !!ut?.completed_at;
                  const progress = ut?.progress ?? 0;
                  const pct = Math.min(100, Math.round((progress / Math.max(1, t.target_count)) * 100));
                  const title = (t.title || "").toLowerCase();
                  const Icon =
                    title.includes("telegram") ? Send
                    : title.includes("invite") || title.includes("friend") ? Share2
                    : title.includes("x") || title.includes("twitter") ? Twitter
                    : title.includes("youtube") ? Youtube
                    : title.includes("insta") ? Instagram
                    : title.includes("facebook") ? Facebook
                    : title.includes("mail") || title.includes("email") ? Mail
                    : Globe;
                  return (
                    <div
                      key={t.id}
                      style={{ backgroundColor: "#0a0a0a" }}
                      className="group relative overflow-hidden rounded-2xl p-4 flex flex-col gap-3 border border-white/10 hover:border-white/25 transition-colors"
                    >
                      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/[0.04] blur-xl pointer-events-none" />
                      <div className="flex items-start gap-3 relative">
                        <div
                          style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
                          className="shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center"
                        >
                          <Icon size={20} color="#ffffff" strokeWidth={2} style={{ display: "block" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div style={{ color: "#fff" }} className="text-[13.5px] font-bold leading-tight capitalize truncate">
                            {t.title}
                          </div>
                          <div
                            style={{ color: "rgba(255,255,255,0.6)" }}
                            className="mt-1 text-[11.5px] font-medium line-clamp-2"
                          >
                            {t.description ||
                              (title.includes("telegram") ? "Join our Telegram community for updates and tips."
                              : title.includes("invite") || title.includes("friend") ? "Invite friends with your referral link and earn rewards."
                              : title.includes("x") || title.includes("twitter") ? "Follow us on X to stay in the loop."
                              : title.includes("youtube") ? "Subscribe to our YouTube channel for tutorials."
                              : title.includes("insta") ? "Follow us on Instagram for behind-the-scenes."
                              : title.includes("facebook") ? "Like our Facebook page to get the latest news."
                              : "Complete this task to claim your reward.")}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={done}
                        onClick={() => {
                          void claimTask(t);
                        }}
                        style={{
                          backgroundColor: done ? "rgba(255,255,255,0.05)" : "#fff",
                          color: done ? "rgba(255,255,255,0.5)" : "#000",
                        }}
                        className="w-full text-[12.5px] font-bold rounded-full py-2 border border-white/15 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        {done ? "Claimed" : (
                          <>
                            <span>Claim</span>
                            <span className="opacity-70">+{t.reward_credits}</span>
                          </>
                        )}
                      </button>
                    </div>

                  );

                })}
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}

