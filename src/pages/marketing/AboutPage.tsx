/** @doc About Megsy — team, mission, founders and timeline. */
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/common/SEOHead";
import {
  CartoonMarketingPage,
  CartoonHero,
  CartoonContainer,
  CartoonCard,
  PillButton,
  SectionEyebrow,
  SectionTitle,
  INK,
  MUTED,
  TEXT,
  BORDER,
  YELLOW,
  MINT,
} from "@/components/marketing/CartoonMarketingShell";
import { PEACH, LAVENDER, PINK, BLUE } from "@/pages/billing/ReferralsPage";
import founderHamza from "@/assets/about-founder-hamza.webp";
import founderAbdalla from "@/assets/about-founder-abdalla.webp";
import aboutSticker from "@/assets/settings/about-sticker.png";

const founders = [
  {
    name: "Hamza Hassan",
    role: "Co-Founder",
    img: founderAbdalla,
    bio: "Drives product, design and the obsessive details. Believes great AI should disappear into the work.",
  },
  {
    name: "Abdalla Mohamed",
    role: "Co-Founder",
    img: founderHamza,
    bio: "Leads engineering and infrastructure. Obsessed with making complex systems feel calm.",
  },
];

const features = [
  {
    n: "01",
    title: "AI Chat",
    sub: "Megsy 3.9",
    desc: "Conversational AI with web search, deep research and file upload — built on 36+ engines.",
    tone: MINT,
  },
  {
    n: "02",
    title: "Image Generation",
    sub: "Megsy Imagine",
    desc: "Text-to-image and image-to-image with multiple models, up to 4K.",
    tone: PEACH,
  },
  {
    n: "03",
    title: "Video Generation",
    sub: "Megsy Video",
    desc: "Text-to-video and image-to-video. 5–10s with audio support.",
    tone: LAVENDER,
  },
  {
    n: "04",
    title: "Code Builder",
    sub: "Apps & Web",
    desc: "Describe what you want — Megsy builds and deploys a working web app.",
    tone: YELLOW,
  },
  {
    n: "05",
    title: "File Analysis",
    sub: "Documents & Data",
    desc: "Upload PDFs, images, docs — Megsy reads, extracts and answers.",
    tone: PINK,
  },
  {
    n: "06",
    title: "Megsy OS",
    sub: "Autonomous agents",
    desc: "24/7 background agents that run multi-step tasks while you sleep.",
    tone: BLUE,
  },
];

const values = [
  {
    title: "Built for creators",
    desc: "Every tool is designed around people who actually ship — not benchmarks.",
    tone: MINT,
  },
  {
    title: "Honest by default",
    desc: "One transparent credit, clear pricing, no hidden lock-ins.",
    tone: YELLOW,
  },
  {
    title: "Made in Egypt",
    desc: "Designed and built in Cairo. Serving creators in any language they write in.",
    tone: PEACH,
  },
  {
    title: "Your work is yours",
    desc: "We never train on your private projects. Delete your data any time.",
    tone: LAVENDER,
  },
];

const stats = [
  { v: "36+", k: "AI engines unified" },
  { v: "25", k: "Languages auto-translated" },
  { v: "1", k: "Credit (MC) — one wallet" },
  { v: "24/7", k: "Human + AI support" },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <CartoonMarketingPage>
      <SEOHead
        title="About Megsy AI — One Workspace for Chat, Image, Video & Code"
        description="Megsy AI is an all-in-one creative platform unifying chat, image, video, code and file analysis behind one workspace and one credit. Built in Cairo by two founders."
        path="/about"
      />

      <CartoonHero
        sticker={aboutSticker}
        bg={LAVENDER}
        eyebrow="About Megsy AI"
        title={
          <>
            Two founders.{" "}
            <span style={{ color: "hsl(var(--brand-action))" }}>One creative workspace.</span>
          </>
        }
        subtitle="Chat, image, video, code and file analysis — built into a single workspace, priced in a single credit. Designed and built in Cairo."
        cta={
          <>
            <PillButton tone={YELLOW} onClick={() => navigate("/auth?mode=signup")}>
              Start using Megsy
            </PillButton>
            <PillButton tone={MINT} onClick={() => navigate("/contact")}>
              Talk to us
            </PillButton>
          </>
        }
      />

      {/* Stats band */}
      <CartoonContainer>
        <CartoonCard tone={YELLOW}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {stats.map((s) => (
              <div key={s.k} className="text-center">
                <p
                  className="text-[36px] md:text-[48px] leading-none"
                  style={{ color: INK, fontWeight: 900, letterSpacing: "-0.03em" }}
                >
                  {s.v}
                </p>
                <p
                  className="mt-2 text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: INK, fontWeight: 800, opacity: 0.75 }}
                >
                  {s.k}
                </p>
              </div>
            ))}
          </div>
        </CartoonCard>
      </CartoonContainer>

      {/* Why we built it */}
      <CartoonContainer>
        <SectionEyebrow>Why we built it</SectionEyebrow>
        <SectionTitle className="mb-5">Too many tabs. Too many subscriptions.</SectionTitle>
        <CartoonCard>
          <div
            className="space-y-4 text-[14.5px] leading-relaxed"
            style={{ color: TEXT, fontWeight: 500 }}
          >
            <p>
              Every new AI model arrives in its own tab, with its own pricing and its own quirks.
              Creators end up spending more time switching apps than actually making things.
            </p>
            <p>
              So we built Megsy: one workspace where chat, images, video, code and files all live
              together — running on the best engines available, priced in a single credit (MC).
            </p>
            <p>
              We're two founders, working from Cairo, building the tool we wished existed. Small
              enough to answer every email. Honest enough to tell you what each feature actually
              costs.
            </p>
          </div>
        </CartoonCard>
      </CartoonContainer>

      {/* Founders */}
      <CartoonContainer>
        <SectionEyebrow>The founders</SectionEyebrow>
        <SectionTitle className="mb-6">The two builders behind Megsy.</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          {founders.map((f) => (
            <div
              key={f.name}
              className="overflow-hidden rounded-[26px]"
              style={{
                border: `2.5px solid ${INK}`,
                boxShadow: `5px 5px 0 ${INK}`,
                backgroundColor: "hsl(var(--surface-1))",
              }}
            >
              <div
                className="relative aspect-[4/5] overflow-hidden"
                style={{ borderBottom: `2.5px solid ${INK}` }}
              >
                <img
                  src={f.img}
                  alt={f.name}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-5 md:p-6">
                <p
                  className="text-[20px]"
                  style={{ color: TEXT, fontWeight: 900, letterSpacing: "-0.02em" }}
                >
                  {f.name}
                </p>
                <p
                  className="mt-1 text-[10.5px] uppercase tracking-[0.2em]"
                  style={{ color: MUTED, fontWeight: 800 }}
                >
                  {f.role}
                </p>
                <p
                  className="mt-3 text-[13.5px] leading-relaxed"
                  style={{ color: TEXT, opacity: 0.85, fontWeight: 500 }}
                >
                  {f.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CartoonContainer>

      {/* Platform features */}
      <CartoonContainer>
        <SectionEyebrow>The platform</SectionEyebrow>
        <SectionTitle className="mb-6">Six tools. One workspace.</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-[22px] p-5"
              style={{
                backgroundColor: f.tone,
                border: `2.5px solid ${INK}`,
                boxShadow: `4px 4px 0 ${INK}`,
                color: INK,
              }}
            >
              <p className="text-[11px] tracking-[0.2em]" style={{ fontWeight: 900, opacity: 0.7 }}>
                {f.n}
              </p>
              <p className="mt-2 text-[16px]" style={{ fontWeight: 900 }}>
                {f.title}
              </p>
              <p
                className="text-[10.5px] uppercase tracking-[0.16em] mt-0.5"
                style={{ fontWeight: 800, opacity: 0.7 }}
              >
                {f.sub}
              </p>
              <p
                className="mt-3 text-[13px] leading-relaxed"
                style={{ fontWeight: 600, opacity: 0.82 }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </CartoonContainer>

      {/* Cairo / indie band */}
      <CartoonContainer>
        <CartoonCard tone={PEACH}>
          <SectionEyebrow>
            <span style={{ color: INK, opacity: 0.7 }}>Built in Cairo</span>
          </SectionEyebrow>
          <h2
            className="text-[26px] md:text-[40px] leading-[0.98]"
            style={{ color: INK, fontWeight: 900, letterSpacing: "-0.025em" }}
          >
            Independent. Indie. Honest.
          </h2>
          <p
            className="mt-4 max-w-xl text-[14px] leading-relaxed"
            style={{ color: INK, fontWeight: 600, opacity: 0.82 }}
          >
            We're not backed by a giant. We're two founders writing every line and answering every
            message — building the tool we needed ourselves.
          </p>
        </CartoonCard>
      </CartoonContainer>

      {/* Values */}
      <CartoonContainer>
        <SectionEyebrow>What we believe</SectionEyebrow>
        <SectionTitle className="mb-6">Four quiet principles.</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-[22px] p-5"
              style={{
                backgroundColor: v.tone,
                border: `2.5px solid ${INK}`,
                boxShadow: `4px 4px 0 ${INK}`,
                color: INK,
              }}
            >
              <p className="text-[16px]" style={{ fontWeight: 900 }}>
                {v.title}
              </p>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ fontWeight: 600, opacity: 0.82 }}
              >
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </CartoonContainer>

      {/* Final CTA */}
      <CartoonContainer>
        <CartoonCard tone={MINT} className="text-center">
          <h2
            className="text-[28px] md:text-[44px] leading-[0.98]"
            style={{ color: INK, fontWeight: 900, letterSpacing: "-0.03em" }}
          >
            Try Megsy for yourself.
          </h2>
          <p
            className="mt-3 mx-auto max-w-md text-[13.5px] leading-relaxed"
            style={{ color: INK, fontWeight: 600, opacity: 0.82 }}
          >
            One workspace. One credit. Six tools. Built in Cairo, made for the world.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <PillButton tone={YELLOW} onClick={() => navigate("/auth?mode=signup")}>
              Start free
            </PillButton>
            <PillButton tone={INK} onClick={() => navigate("/pricing")}>
              <span style={{ color: MINT }}>See pricing</span>
            </PillButton>
          </div>
        </CartoonCard>
      </CartoonContainer>
    </CartoonMarketingPage>
  );
};

export default AboutPage;
