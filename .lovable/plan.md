## مراجعة شاملة لوضع التعليم — الهدف: الأفضل بالعالم

### 1. Audit كامل (قبل أي تعديل)
- قراءة كل ملفات Learn: `LearnCard.tsx` (1366 سطر) بالكامل، `InChatTimerCard.tsx`, `learnCardParser.ts`, `learnCardI18n.ts`, `useStudyMode.ts`, `LEARNING_PROMPT` في `modelSystemPrompts.ts`.
- فحص التكامل: `ChatMessage.tsx`, `StudyTimersOverlay`, `ComposerAnimatedInput` لوضع التعليم.
- تسجيل: bugs, حالات ناقصة (empty/error/loading states)، مشاكل a11y (aria, keyboard, contrast)، RTL، mobile touch targets، أنيميشن مكسور، تكرار كود.

### 2. Parser & Robustness (فادح للجودة)
- دعم أنواع بطاقات جديدة يحتاجها التعليم العالمي:
  - `flashcard` (Spaced-Repetition flip)
  - `ordering` (رتّب الخطوات)
  - `hotspot` (اضغط على المنطقة الصحيحة في صورة/دياجرام)
  - `code_run` (شغّل كود صغير — للبرمجة)
  - `audio_listen` (استمع ثم أجب — للغات)
  - `drawing` (ارسم إجابتك — للأطفال والرياضيات)
  - `poll` (رأي جماعي — للفصول)
  - `summary_write` (لخّص بكلماتك — Bloom عالي)
- تحسين normalize: تسامح مع أخطاء الـ AI (options ككائنات، correct كنص، إلخ).
- fallback واضح لو JSON مكسور (بدل ما يختفي البلوك).

### 3. تلميع UI/UX داخل `LearnCard.tsx`
- **Micro-interactions**: haptic feedback (navigator.vibrate) عند الإجابة، صوت خفيف اختياري، confetti spring على إجابة صحيحة متتالية (streak).
- **Streak & XP HUD**: شريط صغير أعلى البطاقات يعرض streak حالية + XP + المستوى (Bloom rung).
- **Progress memory**: حفظ التقدم في `localStorage` لكل موضوع (لآخر جلسة).
- **Explain-after-answer**: توسعة تلقائية للـ explanation مع أنيميشن height spring.
- **Hints laddered**: زر "تلميح" يكشف 3 مستويات (nudge → hint → answer path).
- **Skip / Bookmark / Report**: أزرار سياقية لكل بطاقة.
- **Accessibility**: `role=radiogroup`, `aria-checked`, focus rings، keyboard كامل لكل نوع (ليس فقط MCQ)، احترام `prefers-reduced-motion`.
- **RTL**: مراجعة كل `ml-`/`mr-`/`left-`/`right-` واستبدال بـ `ms-`/`me-`/`start-`/`end-`.
- **Mobile**: تأكيد كل الأزرار ≥44px، منع misclicks بـ debounce صغير.

### 4. Timer & Exam
- `CircularTimer`: إضافة pause/resume، sound toggle، صيغة `mm:ss` واضحة.
- `Exam runner`: قفزة سريعة لأي سؤال (mini-map)، حفظ الإجابات محلياً ضد إعادة تحميل، مراجعة نهائية قبل التسليم.
- Post-exam: توزيع علامات لكل Bloom level + توصيات ("راجع Cell Biology")، وزر "أنشئ خطة مراجعة" يرسل prompt جاهز.

### 5. ترقية `LEARNING_PROMPT`
- إضافة قوالب لكل النوع الجديد (flashcard, ordering, hotspot, ...) مع أمثلة JSON محكمة.
- إلزام الـ AI باستخدام تنوع مقصود (لا 5 MCQ متتالية).
- قواعد لكل فئة عمرية: 
  - **حضانة/أطفال 3-6**: صور + رموز + صوت، جمل قصيرة، تشجيع دائم.
  - **مدرسة 7-14**: قصص + ألعاب + مكافآت.
  - **جامعة/كورسات**: عمق أكاديمي + مصادر + Bloom عالي.
  - **مهنيون/راشدون**: تطبيق مباشر + case studies.
- قواعد لكل مجال (طب/قانون/برمجة/لغات/رياضيات/فنون/دين) — لايبل: `[Domain: Medicine]`.
- إلزام: كل جلسة تفتح بـ `checkin` (مستوى الطالب) وتُقفل بـ `summary_write` + خطة اليوم التالي.

### 6. Study session shell (خارج البطاقات)
- شريط علوي ثابت في وضع التعليم يعرض: الموضوع الحالي، الوقت، streak، XP، زر "خذ استراحة".
- Pomodoro مدمج مع الـ `InChatTimerCard`.
- "Focus mode" — يخفي الشات الجانبي ويترك البطاقة فقط.

### 7. Verify
- `bunx tsgo --noEmit` + build.
- اختبار يدوي عبر Playwright screenshot لكل نوع بطاقة (mcq, multi, match, exam, flashcard, ordering).

### Files to edit
- `src/lib/learnCardParser.ts` — أنواع جديدة + normalize أقوى
- `src/lib/learnCardI18n.ts` — نصوص للأنواع الجديدة
- `src/components/learn/LearnCard.tsx` — رندر الأنواع الجديدة + micro-interactions + a11y + RTL
- `src/components/learn/InChatTimerCard.tsx` — pause/resume/sound
- `src/lib/modelSystemPrompts.ts` — LEARNING_PROMPT مطوّر
- `src/pages/chat/hooks/useStudyMode.ts` — streak/XP/localStorage
- (جديد) `src/components/learn/StudyHUD.tsx` — الشريط العلوي
- (جديد) `src/lib/studyProgress.ts` — تخزين التقدم

هل نبدأ من الـ Audit ونعرضلك القائمة الكاملة قبل أي تعديل، ولا نبدأ التنفيذ فوراً بالخطوات 2→7 بالترتيب؟