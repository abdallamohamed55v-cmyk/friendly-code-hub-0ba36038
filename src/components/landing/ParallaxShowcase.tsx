import { motion } from "framer-motion";
import LazyVideo from "@/components/landing/LazyVideo";

const ParallaxShowcase = () => {
  return (
    <section className="relative scroll-mt-28 py-16 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[480px] -translate-y-1/2 bg-gradient-to-b from-fuchsia-500/[0.07] via-purple-500/[0.04] to-transparent blur-3xl" />

      <div className="mx-auto mb-10 max-w-7xl px-6 text-center md:mb-14">
        <motion.h2
          id="anchor-depth"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="font-display text-[10vw] font-black uppercase leading-[0.9] tracking-tighter text-foreground md:text-[6vw]"
        >
          DEPTH OF{" "}
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            CREATION
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-5 max-w-2xl text-base text-foreground/70 md:text-lg"
        >
          One canvas, every modality — explore how Megsy moves between chat, image, video and code
          without breaking your flow.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-6xl px-4 md:px-6"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 md:rounded-[28px]">
          <LazyVideo src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260416_101255_3099d3e4-d0cf-4e59-9666-97fbf521ac71.mp4" className="aspect-video w-full" />
        </div>

      </motion.div>
    </section>
  );
};

export default ParallaxShowcase;
