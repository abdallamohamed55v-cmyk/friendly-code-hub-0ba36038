import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLandingContent } from "@/lib/landing/LandingContentContext";

const HERO_BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4";

const HeroSection = () => {
  const navigate = useNavigate();
  const { content } = useLandingContent();
  const { hero } = content;
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="relative w-full overflow-hidden min-h-[80vh] md:min-h-dvh bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.25),_transparent_60%),linear-gradient(135deg,#0a0a1a_0%,#1a1033_50%,#0a0a1a_100%)]">
      <video
        key={HERO_BG_VIDEO}
        src={HERO_BG_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />


      {/* Minimal overlay for text readability */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent"
        aria-hidden
      />

      {/* Motivational text + CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[7vw] uppercase leading-[1.05] tracking-tight text-foreground md:text-[3.6vw]"
        >
          <span>{hero.h1Pre}</span>
          <span className="inline-flex items-center bg-gradient-to-br from-primary via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            {hero.h1Highlight}
            <span
              id="anchor-hero-now"
              aria-hidden
              className="inline-block w-0 h-0 align-middle"
            />
          </span>
        </motion.h1>


        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-sm leading-snug text-foreground/80 md:text-lg"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate("/auth")}
            className="group relative rounded-full p-[2px] overflow-hidden transition-transform hover:scale-[1.03]"
            style={{
              background:
                "conic-gradient(from var(--angle, 0deg), #c0c0c0, #ffffff, #8a8a8a, #ffffff, #c0c0c0)",
              animation: "silver-spin 4s linear infinite",
            }}
          >
            <span className="relative block rounded-full bg-black px-8 py-3 text-sm font-semibold text-foreground md:px-10 md:py-4 md:text-base">
              {hero.ctaPrimary}
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
