# خطة تطبيق Code Splitting بمستوى Facebook على كل صفحات الموقع

## الهدف
تقليل حجم أول تحميل (initial JS) لكل صفحة من ~1-4MB إلى أقل من ~150KB، عبر تقسيم الكود على 3 مستويات: **route → component → interaction**.

---

## المرحلة 1 — البنية التحتية (ملفات مشتركة جديدة)

1. **`src/lib/lazyOnIntent.ts`** — helper يحمّل مكون فقط عند أول hover/focus/touch على زر معين (بدل ما يتحمّل مع الصفحة).
2. **`src/lib/lazyOnVisible.ts`** — helper يحمّل مكون عند دخوله viewport عبر IntersectionObserver (للفيديوهات، الصور الثقيلة، الأقسام السفلية).
3. **`src/lib/lazyOnIdle.ts`** — helper يحمّل chunks الثانوية أثناء `requestIdleCallback` (analytics, prefetch, service worker).
4. توسيع `globalLinkPrefetch.ts` الحالي ليدعم prefetch للـ **component chunks** مش الـ routes بس (عبر `<button data-prefetch="EmojiPicker">`).

---

## المرحلة 2 — ChatPage (الأولوية القصوى، 2010 سطر / 227KB)

تقسيم `src/pages/chat/ChatPage.tsx` وأولاده الثقال:

| المكون | الوضع الحالي | بعد التعديل |
|---|---|---|
| `framer-motion` (motion) | eager | lazy عبر wrapper خفيف |
| `EmojiPicker` / mention dropdown | eager | `lazyOnIntent` عند ضغط الأيقونة |
| Background `<video>` سطح المكتب | eager في DOM | `lazyOnVisible` + `loading="lazy"` |
| `ComposerAttachments` (upload/paste) | eager | lazy عند إضافة أول ملف |
| `DraggablePlusSheet` / `PlusContent` | eager | `lazyOnIntent` |
| `SlidesTemplateButton` sheet | eager | lazyOnIntent |
| `StudyTimersOverlay` | eager | lazy عند فتح المؤقت |
| `MegsyOsIntro` / `DesktopGreeting` | eager | lazy فقط لأول رسالة |
| `react-markdown` + `syntax-highlighter` | يدخل في bundle الشات | يُحمَّل فقط عند وصول أول رسالة تحوي code fence |
| `hls.js` / video player | eager | `lazyOnVisible` |
| كل مكون في `lazyComponents.ts` | ✓ | نضيف preload on hover |

---

## المرحلة 3 — LandingPage

- بالفعل يستخدم `React.lazy` لكل قسم — نضيف:
  - `IntersectionObserver` لكل `<Suspense>` (بدل ما تتحمّل كل sections الـ 14 مع أول scroll).
  - Prefetch لـ `HeroSection` صور فوق الطي فقط.
  - تأجيل `Lenis`, `FlyingMegsyStar`, `StatsMarquee` لـ `requestIdleCallback`.
  - تحويل `framer-motion` في مكونات landing لـ `motion/mini` أو CSS transitions.

---

## المرحلة 4 — Settings / Billing / Workspace / Auth

- كل tab داخل SettingsPage → route lazy منفصل + prefetch on hover على الـ sidebar item.
- BillingPage: `Stripe.js` / `@stripe/react-stripe-js` → lazyOnIntent عند فتح checkout modal فقط.
- ReferralsPage tabs (Dashboard/Program/Tasks/Withdrawals) → lazy per tab.
- WorkspacesPage: قوائم المستخدمين → virtualize + lazy pagination.
- AuthPage: OAuth providers icons → lazy chunks منفصلة.

---

## المرحلة 5 — Vendor chunks (vite.config.ts)

تحديث `manualChunks` الحالي:
- فصل `framer-motion` إلى `motion-core` + `motion-features` (features on-demand فقط).
- فصل `@lobehub` لكل provider في chunk مستقل (openai, anthropic, google, …).
- فصل `react-markdown/rehype/remark` عن `syntax-highlighter` (chunks منفصلة تماماً).
- `@radix-ui` → chunk واحد لكل primitive شائع، وباقي primitives تُحمَّل مع مستخدميها.
- إضافة `assetsInlineLimit: 2048` لتقليل requests للأيقونات الصغيرة.

---

## المرحلة 6 — تفعيل Interaction-based Prefetching

- إضافة `data-prefetch-chunk` attribute + observer عالمي يقرأه ويستدعي `import()`.
- كل زر ثقيل في الـ composer/sidebar/settings يحصل على prefetch on `mouseenter` + `touchstart`.
- استخدام `<link rel="modulepreload">` ديناميكياً عند hover على link مهم (بدل modulePreload: false الحالي، لكن مضبوط).

---

## المرحلة 7 — التحقق

1. `bun run build` + مقارنة أحجام chunks قبل/بعد (`scripts/perf-audit.mjs` موجود).
2. اختبار visual للصفحات الأساسية عبر Playwright (لقطات قبل/بعد).
3. `bunx vitest run` للتأكد إن مفيش اختبار كسر.
4. فتح `/chat` و `/` و `/settings` وتسجيل أحجام الشبكة في DevTools.

---

## المدة المتوقعة والمخاطر

- **المدة**: عمل ضخم فعلياً (~15-25 تعديل ملف كبير). سيتم على دفعات ضمن هذه الجلسة، مع build بعد كل مرحلة.
- **المخاطر**:
  - كسر بعض التفاعلات إذا lazy component احتاج state قبل ما يتحمّل → نحل بـ Suspense fallback خفيف + prefetch on intent.
  - hydration flicker في landing → نستخدم skeleton بنفس الأبعاد.
  - تأخير أول ضغطة على زر ثقيل بعد أول hover ~50ms → مقبول ومطابق لسلوك FB.

## القسم التقني (تفاصيل للمطور)

- Vite 5 `build.rollupOptions.output.manualChunks` — تقسيم دقيق.
- استخدام `React.lazy` + `Suspense` boundaries متعددة (واحد لكل قسم، مش واحد للصفحة كاملة).
- `dynamic import()` ثابت المسار (بدون template strings) عشان Rollup يقدر يحلّله.
- `IntersectionObserver` بـ `rootMargin: "300px"` عشان prefetch قبل الوصول للـ viewport.
- `requestIdleCallback` مع fallback `setTimeout(cb, 200)` لسفاري.
