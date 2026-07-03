import { motion } from "framer-motion";
import { useLandingContent } from "@/lib/landing/LandingContentContext";

const SETTINGS_LABELS: Record<
  string,
  {
    title: string;
    subtitle: string;
    items: Array<{ label: string; value: string }>;
  }
> = {
  ar: {
    title: "إعدادات الاستوديو",
    subtitle: "تحكم كامل في كل تفصيلة قبل وبعد التوليد.",
    items: [
      { label: "نسبة العرض", value: "1:1 · 16:9 · 9:16 · 4:5" },
      { label: "عدد النسخ", value: "1 — 4 صور لكل أمر" },
      { label: "الإضاءة والستايل", value: "سينمائي · استوديو · أنمي · واقعي" },
      { label: "أدوات إضافية", value: "تكبير الدقة · إزالة الخلفية · تبديل الوجوه" },
    ],
  },
  en: {
    title: "Studio settings",
    subtitle: "Full control over every detail before and after generation.",
    items: [
      { label: "Aspect ratio", value: "1:1 · 16:9 · 9:16 · 4:5" },
      { label: "Variations", value: "1 — 4 images per prompt" },
      { label: "Lighting & style", value: "Cinematic · Studio · Anime · Realistic" },
      { label: "Pro tools", value: "Upscale · Remove BG · Face swap" },
    ],
  },
};

const MegsyImageModelsSection = () => {
  const { content, locale } = useLandingContent();
  const { imageModels: c } = content;
  const settings = SETTINGS_LABELS[locale.code] ?? SETTINGS_LABELS.en;

  return (
    <section
      id="anchor-image-models-section"
      className="relative scroll-mt-28 overflow-hidden bg-red-900 py-20 md:py-28"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-red-950 via-red-900 to-red-950" />
      <div className="absolute right-1/3 top-1/3 -z-10 h-[600px] w-[600px] rounded-full bg-red-500/20 blur-[160px]" />

      <div className="mx-auto max-w-7xl px-6">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {c.items.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-6 transition-all hover:border-white/40 hover:bg-white/[0.1]"
            >
              <h3 className="text-lg font-bold text-white">{m.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{m.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Settings preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 rounded-3xl border border-white/15 bg-white/[0.05] p-6 md:p-10"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white md:text-xl">{settings.title}</h3>
            <p className="text-sm text-white/75">{settings.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {settings.items.map((it) => (
              <div
                key={it.label}
                className="rounded-2xl border border-white/15 bg-red-950/40 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                  {it.label}
                </p>
                <p className="mt-1 text-sm font-medium text-white">{it.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MegsyImageModelsSection;
