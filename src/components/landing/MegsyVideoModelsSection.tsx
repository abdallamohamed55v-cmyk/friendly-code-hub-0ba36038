import { motion } from "framer-motion";
import { useLandingContent } from "@/lib/landing/LandingContentContext";

type VideoCopy = {
  kicker: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  items: Array<{ name: string; cost: string; description: string }>;
  settings: {
    title: string;
    subtitle: string;
    items: Array<{ label: string; value: string }>;
  };
};

const COPY: Record<string, VideoCopy> = {
  ar: {
    kicker: "نماذج الفيديو",
    title: "فيديوهات",
    titleHighlight: "سينمائية بنقرة.",
    subtitle: "أفضل نماذج توليد الفيديو في العالم — حركة سلسة، إضاءة سينمائية، وأصوات أصلية.",
    items: [
      {
        name: "Seedance 2",
        cost: "",
        description: "نموذج فيديو متطور بحركة سلسة وتفاصيل دقيقة.",
      },
      {
        name: "Seedance 2.5",
        cost: "",
        description: "أحدث إصدار من Seedance بجودة سينمائية وتحكم أعمق.",
      },
      {
        name: "Veo 3.1",
        cost: "",
        description: "أفضل نموذج فيديو من Google بصوت أصلي وحركة طبيعية.",
      },
      {
        name: "Kling 3 Pro",
        cost: "",
        description: "حركة دقيقة وثبات للشخصيات بمقاطع طويلة بدقة 1080p.",
      },
      {
        name: "Runway Gen-4",
        cost: "",
        description: "تحكم سينمائي في الكاميرا والإضاءة والإيقاع.",
      },
      {
        name: "Hunyuan Video",
        cost: "",
        description: "نموذج مفتوح بأسلوب فني واقعي وحركة قوية.",
      },
      {
        name: "Sora Turbo",
        cost: "",
        description: "مشاهد معقدة من OpenAI بإخراج واقعي مذهل.",
      },
    ],
    settings: {
      title: "إعدادات الفيديو",
      subtitle: "اضبط كل تفصيلة قبل الإخراج — كأنك في غرفة تحكم حقيقية.",
      items: [
        { label: "المدة", value: "4 · 8 · 12 ثانية" },
        { label: "نسبة العرض", value: "16:9 · 9:16 · 1:1" },
        { label: "حركة الكاميرا", value: "تتبع · تقريب · بانوراما · ثابت" },
        { label: "الصوت ومزامنة الشفاه", value: "موسيقى · مؤثرات · Lip Sync" },
      ],
    },
  },
  en: {
    kicker: "Video models",
    title: "Cinematic video,",
    titleHighlight: "one click away.",
    subtitle:
      "The best video models in the world — smooth motion, cinematic lighting, native audio.",
    items: [
      {
        name: "Seedance 2",
        cost: "",
        description: "Advanced video model with smooth motion and crisp detail.",
      },
      {
        name: "Seedance 2.5",
        cost: "",
        description: "Latest Seedance release with cinematic quality and deeper control.",
      },
      {
        name: "Veo 3.1",
        cost: "",
        description: "Google's flagship with native audio and natural motion.",
      },
      {
        name: "Kling 3 Pro",
        cost: "",
        description: "Precise motion and character consistency at 1080p.",
      },
      {
        name: "Runway Gen-4",
        cost: "",
        description: "Cinematic control over camera, lighting and pacing.",
      },
      {
        name: "Hunyuan Video",
        cost: "",
        description: "Open-source model with strong realistic motion.",
      },
      {
        name: "Sora Turbo",
        cost: "",
        description: "Complex scenes from OpenAI with stunning realism.",
      },
    ],
    settings: {
      title: "Video settings",
      subtitle: "Tune every detail before render — like a real control room.",
      items: [
        { label: "Duration", value: "4 · 8 · 12 seconds" },
        { label: "Aspect ratio", value: "16:9 · 9:16 · 1:1" },
        { label: "Camera motion", value: "Track · Zoom · Pan · Static" },
        { label: "Audio & Lip Sync", value: "Music · SFX · Lip Sync" },
      ],
    },
  },
};

const MegsyVideoModelsSection = () => {
  const { locale } = useLandingContent();
  const c = COPY[locale.code] ?? COPY.en;

  return (
    <section
      id="anchor-video-models-section"
      className="relative scroll-mt-28 overflow-hidden py-20 md:py-28"
    >
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-black/20" aria-hidden />


      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <h2 className="font-display text-[10vw] font-black uppercase leading-[0.9] tracking-tighter text-foreground md:text-[6vw]">
            {c.title}{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">
              {c.titleHighlight}
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-foreground/75 md:text-lg">
            {c.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {c.items.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 transition-all hover:border-cyan-400/40"
            >
              <h3 className="text-lg font-bold text-foreground">{m.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{m.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 md:p-10"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground md:text-xl">{c.settings.title}</h3>
            <p className="text-sm text-foreground/70">{c.settings.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.settings.items.map((it) => (
              <div
                key={it.label}
                className="rounded-2xl border border-white/10 bg-background/40 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  {it.label}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{it.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MegsyVideoModelsSection;
