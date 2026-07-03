## هدف الخطة
نجعل وضع التعليم في Megsy الأفضل بالعالم — أكثر ذكاءً، أنعم تفاعلاً، أوضح تعليمياً، وأشمل لكل الأعمار والمجالات — بدون تغيير أي منطق تجاري خارج وضع التعليم.

## 1) Audit سريع للوضع الحالي (اللي طلعت فيه ثغرات)

**نقاط قوة موجودة:** 17 نوع بطاقة (mcq, multi, truefalse, fill, match, checkin, mermaid, roadmap, exam, photo_solve, onboarding, flashcard, ordering, summary_write, scenario…)، tone system، RTL awareness، i18n EN/AR، `LEARNING_PROMPT` مطوّر بـ UDL + Bloom + domain rules.

**ثغرات فعلية رصدناها:**
- **لا يوجد تتبع تقدم**: streak/XP/Bloom rung ما بيتحفظش، فالـ AI ما بيقدرش يكيّف حقيقة (adaptive بس نظرياً في الـ prompt).
- **لا يوجد HUD**: المستخدم مش شايف مستواه، وقته، عدد الأسئلة الصح متتالياً، ولا الموضوع الحالي.
- **لا فيدباك حسي متسق**: haptic بس على flashcard، مفيش صوت اختياري ولا confetti على streak.
- **Hints غير متدرجة**: الإجابة بتظهر فوراً أو مش بتظهر، مفيش سلم (nudge → hint → reveal).
- **Explain بيظهر ثابت**: مش بيتوسّع بأنيميشن ولا بيتلوّن حسب صح/غلط.
- **Parser مسامحته محدودة**: لو الـ AI بعت `answer` بدل `correct`، أو `question_text` بدل `question`، بيسقط. مفيش fallback مرئي لما JSON يتكسر (البلوك بيختفي بصمت).
- **مفيش أنواع مطلوبة للعالمية**: `audio_listen` (لغات)، `hotspot` (تشريح/خرائط)، `code_run` (برمجة)، `poll` (فصول)، `drawing` (أطفال/رياضيات).
- **Exam runner ما بيحفظش الإجابات محلياً** → لو reload الطالب يخسر كل حاجة.
- **مفيش Focus Mode** يخفي الشات ويسيب البطاقة بس.
- **`LEARNING_PROMPT` طويل بس مش بيتلقى إشارات تقدم حقيقية** من الفرونت (streak, level) عشان يكيّف صح.
- **A11y**: keyboard كامل بس لـ MCQ. flashcard/ordering/scenario محتاجين arrow-key + space/enter.
- **`prefers-reduced-motion`**: مش محترم في spring animations.
- **Mobile targets**: بعض الأزرار الفرعية (skip/report) أصغر من 44px.

## 2) خطة التنفيذ (7 خطوات، مرتبة حسب الأثر)

### الخطوة 1 — نظام تقدم حقيقي (Persistence Layer)
**ملف جديد:** `src/lib/studyProgress.ts`
- `getProgress(topic)` / `saveProgress(topic, {streak, xp, bloomRung, correctInRow, lastSeenAt, cardsAnswered})`
- تخزين في `localStorage` تحت `megsy:study:v1`
- API لتصدير آخر جلسة (`getRecentSessions`) لعرضها في HUD.
- helpers: `bumpXP`, `bumpStreak`, `resetStreak`, `promoteBloom`, `demoteBloom`.

### الخطوة 2 — StudyHUD ثابت أعلى وضع التعليم
**ملف جديد:** `src/components/learn/StudyHUD.tsx`
- شريط علوي رفيع (يظهر بس لما `mode === "learning"`)، بيعرض:
  - الموضوع الحالي (يُستنتج من آخر checkin/onboarding).
  - Streak 🔥 + XP ⭐ + Bloom rung (Remember → Create).
  - Timer (Pomodoro مدمج من `InChatTimerCard`).
  - زر Focus Mode (يخفي السايدبار ويكبّر البطاقة).
  - زر "استراحة 5د" (يبدأ Pomodoro break تلقائي).
- Mount من `ChatMessagesList` أو `ChatPage` جنب المود لما يكون Learning.
- respects `prefers-reduced-motion`.

### الخطوة 3 — تلميع LearnCard.tsx (Micro-interactions + A11y)
- **Haptic feedback موحد**: كل tap صح → `navigator.vibrate(8)`، غلط → `[8,40,8]`.
- **Confetti spring على streak ≥ 3**: مكوّن خفيف بدون مكتبة (particles CSS).
- **Explain animation**: `height: auto` spring + لون حسب صح/غلط.
- **Hints laddered**: زر 💡 يفتح 3 مستويات: nudge → hint → answer path (بيقلّل XP لو استُخدم).
- **Skip / Bookmark / Report**: أزرار مدمجة أسفل كل بطاقة (44px+).
- **Keyboard كامل**: arrow keys لـ flashcard/ordering/scenario، space=flip، enter=submit.
- **`prefers-reduced-motion`**: يوقف spring، يستبدل بـ fade خفيف.
- **RTL sweep**: استبدال أي `ml-/mr-/left-/right-` بـ `ms-/me-/start-/end-`.

### الخطوة 4 — Parser أقوى + أنواع جديدة
**ملف:** `src/lib/learnCardParser.ts`
- تسامح أوسع: يقبل `answer|correct_answer|correctIndex|correct_option` كـ `correct`، و `question_text|prompt|q` كـ `question`.
- Fallback مرئي: لو JSON مكسور، بدل ما البلوك يختفي، يظهر بطاقة "⚠️ سؤال ما وصلش صح — تخطى" مع زر retry.
- إضافة الأنواع الجديدة:
  - `hotspot` — صورة/دياجرام + نقاط قابلة للضغط (تشريح، خرائط، UI).
  - `audio_listen` — رابط صوت + سؤال (تعلّم لغات، music theory).
  - `code_run` — بلوك كود صغير + expected output (يستخدم sandbox موجود).
  - `poll` — تصويت جماعي بسيط (للفصول والاستطلاعات).
- زوّد `learnCardI18n.ts` بنصوص EN/AR للأنواع دي.

### الخطوة 5 — Exam Runner محترف
- حفظ الإجابات في `localStorage` لحظة بلحظة (key = examId).
- Mini-map جانبي: كل سؤال دائرة (فارغ/متجاوَب/متعلّم عليه).
- مراجعة نهائية قبل التسليم.
- Post-exam: توزيع علامات على Bloom levels + توصية "راجع X" + زر "أنشئ خطة مراجعة" يبعت prompt جاهز للـ AI.

### الخطوة 6 — LEARNING_PROMPT الأذكى بالعالم
**ملف:** `src/lib/modelSystemPrompts.ts`
- إضافة قوالب JSON للأنواع الجديدة (hotspot/audio/code/poll).
- **تنوع مقصود**: قاعدة صريحة "لا تكرّر نفس النوع 3 مرات متتالية".
- **قراءة إشارات التقدم**: الفرونت هيبعت للـ AI header hidden بـ `[LEARN_STATE] streak=3 xp=120 rung=Apply topic="React hooks"` — نضيف قاعدة في الـ prompt يقرأها ويكيّف.
- **قواعد فئات عمرية أوضح** (preschool/school/university/pro) + templates لكل واحدة.
- **قواعد مجالات أعمق**: طب (safety disclaimer إجباري)، قانون (jurisdiction disclaimer)، برمجة (read→predict→write)، لغات (i+1 input)، رياضيات (concrete→visual→symbolic)، دين (respect + sources)، فنون (create+critique).
- **افتتاح إجباري بـ `onboarding` أو `checkin`**، إغلاق إجباري بـ `summary_write` + خطة اليوم التالي.
- **Growth mindset language**: قاعدة صريحة (praise process، ممنوع "أنت ذكي").

### الخطوة 7 — Focus Mode + Session Shell
- زر Focus في HUD → يخفي `sidebar` + `composer` الجانبي، يعرض البطاقة full-height مع swipe للتالي.
- Pomodoro مدمج (25/5) مع toggle sound.
- Auto-save session state كل 10 ثواني.

## 3) التحقق (Verify)
- `bunx tsgo --noEmit` + build.
- Playwright screenshot لكل نوع بطاقة (mcq, multi, match, exam, flashcard, ordering, summary, scenario, hotspot, audio, code, poll) على mobile + desktop، LTR + RTL.
- اختبار keyboard-only لكل نوع.
- اختبار `prefers-reduced-motion` (DevTools emulation).
- اختبار reload أثناء exam → الإجابات محفوظة.

## الملفات (تفاصيل تقنية)

**جديد:**
- `src/lib/studyProgress.ts` — persistence layer
- `src/components/learn/StudyHUD.tsx` — شريط علوي
- `src/components/learn/FocusMode.tsx` — full-screen wrapper
- `src/components/learn/ConfettiBurst.tsx` — CSS particles خفيف

**تعديل:**
- `src/lib/learnCardParser.ts` — أنواع جديدة + normalize أقوى + fallback
- `src/lib/learnCardI18n.ts` — نصوص للأنواع الجديدة
- `src/components/learn/LearnCard.tsx` — micro-interactions + a11y + hints + hotspot/audio/code/poll renderers
- `src/components/learn/InChatTimerCard.tsx` — pause/resume/sound toggle
- `src/lib/modelSystemPrompts.ts` — LEARNING_PROMPT مطوّر + قراءة LEARN_STATE
- `src/pages/chat/hooks/useStudyMode.ts` — يستهلك `studyProgress` ويحقن `LEARN_STATE` في الرسائل
- `src/pages/chat/components/ChatMessagesList.tsx` — mount StudyHUD في learning mode
- `src/pages/chat/services/runChatStreamTurn.ts` — حقن `[LEARN_STATE]` header

## نطاق الأمان
- كل التعديلات داخل وضع التعليم فقط.
- ما نلمسش auth/billing/backend business logic.
- ما نضيفش dependencies جديدة (بنستخدم framer-motion الموجود + CSS particles بدل canvas-confetti).

هل نبدأ التنفيذ بالخطوة 1 → 7 بالترتيب؟