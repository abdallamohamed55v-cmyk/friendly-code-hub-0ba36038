import { motion } from "framer-motion";
import { useMemo } from "react";

interface DesktopGreetingProps {
  userName: string | null | undefined;
  isFirstVisit: boolean;
  returningGreetingIdx: number;
}

/**
 * Desktop empty-state greeting — ChatGPT-clean composition with the
 * Referral landing's ambient glow + grid backdrop. Mobile untouched.
 */
export const DesktopGreeting = ({
  userName,
  isFirstVisit,
  returningGreetingIdx,
}: DesktopGreetingProps) => {
  const raw = userName || "there";
  const dname = raw.charAt(0).toUpperCase() + raw.slice(1);

  const h = new Date().getHours();
  const part =
    h < 5
      ? "Still up"
      : h < 12
        ? "Good morning"
        : h < 17
          ? "Good afternoon"
          : h < 21
            ? "Good evening"
            : "Late one";

  const { lead, tail } = useMemo(() => {
    const variants = [
      { lead: part, tail: dname },
      { lead: "What's on your mind", tail: dname },
      { lead: "Where to today", tail: dname },
      { lead: "Ready when you are", tail: dname },
    ];
    return isFirstVisit ? variants[0] : variants[returningGreetingIdx % variants.length];
  }, [part, dname, isFirstVisit, returningGreetingIdx]);

  // Match the Referral landing (mobile) palette exactly:
  // dark ink page, plain parchment heading, blue accent on the highlighted word
  // — no yellow sticker, no offset shadow. Referral hero "Invite friends!"
  // uses the same pattern: solid parchment H1 + inline blue accent text.
  const INK = "hsl(var(--brand-parchment))";
  const PARCHMENT = "hsl(var(--brand-parchment))";
  const MINT = "hsl(var(--brand-mint))";
  const BLUSH = "hsl(var(--brand-blush))";
  const BLUE = "#5B8DEF"; // referral primary accent
  const LAVENDER = "#C9A8FF";

  return (
    <div className="relative z-10 hidden md:flex items-center justify-center px-6 py-2 overflow-visible w-full">
      {/* Soft pastel sticker glows on a white page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(45% 35% at 22% 18%, ${LAVENDER}26 0%, transparent 70%), radial-gradient(40% 32% at 80% 22%, ${MINT}26 0%, transparent 70%), radial-gradient(50% 35% at 50% 95%, ${BLUSH}1f 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <h1
          data-greeting
          className="text-[32px] sm:text-[44px] leading-[0.95] tracking-tight"
          style={{
            fontFamily: "'Archivo Black', 'Bebas Neue', Impact, sans-serif",
            letterSpacing: "-0.02em",
            color: INK,
          }}
        >
          {lead}, <span style={{ color: BLUE }}>{tail}</span>
        </h1>
      </motion.div>
    </div>
  );
};

export default DesktopGreeting;
