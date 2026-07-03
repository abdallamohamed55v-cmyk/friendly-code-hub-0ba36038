# خطة إكمال وضع التعليم — الأفضل في العالم

الأساس (التتبع + HUD + تكيّف الذكاء الحيّ) تم بناؤه. باقي الطبقات الإبداعية التي ستقفل الملف نهائياً:

## 1. اللمسات التفاعلية (LearnCard.tsx)
- **Laddered Hints**: 3 مستويات (تلميح خفيف → تلميح أقوى → كشف جزئي) قبل إظهار الإجابة، مع خصم XP تدريجي.
- **Confetti + streak celebration**: انفجار CSS خفيف عند streak ≥ 3، وشارة "🔥 3 in a row!" متحركة.
- **Haptic موحّد**: نبضة قصيرة للصح، مزدوجة للخطأ، ثلاثية لترقية Bloom.
- **Skip / Bookmark / Report**: أزرار صغيرة أعلى كل بطاقة (bookmark يحفظ في localStorage للمراجعة).
- **Keyboard shortcuts**: أرقام 1-4 للـ MCQ، Enter للتأكيد، H للتلميح، S للتخطي.
- **`prefers-reduced-motion`**: احترام الإعداد في كل spring/framer-motion.
- **RTL sweep**: مراجعة كل padding/margin/flex-direction للعربية.

## 2. بطاقات جديدة عالمية (learnCardParser.ts + LearnCard.tsx + i18n)
- `hotspot`: صورة + نقاط قابلة للنقر (تشريح، خرائط، مخططات).
- `audio_listen`: تشغيل مقطع + سؤال (لغات، موسيقى، طب سمع).
- `code_run`: قصاصة كود + توقّع الناتج (برمجة).
- `poll`: استطلاع بلا "إجابة صحيحة" لبناء الحدس قبل الشرح.
- `drawing`: canvas صغير للرسم (رياضيات، هندسة، أطفال).

## 3. Focus Mode (ملف جديد `src/components/learn/FocusMode.tsx`)
- Wrapper يخفي الشات ويعرض البطاقة ملء الشاشة.
- Pomodoro مدمج (25/5) مع صوت خفيف اختياري.
- Auto-save كل 10 ثواني.
- زر خروج واضح + ملخّص جلسة عند الإغلاق (XP اكتُسب، Bloom, دقّة).

## 4. Exam / Session Persistence (useStudyMode.ts + جديد `examSession.ts`)
- حفظ إجابات الامتحان في localStorage (يعود بعد reload).
- Mini-map للتنقّل بين الأسئلة.
- شاشة نتائج نهائية: Bloom breakdown + خطة مراجعة مخصصة ("راجع 3 بطاقات على Apply").

## 5. تعميق ذكاء الردود (modelSystemPrompts.ts)
- قواعد صارمة ضد التكرار (لا 3 بطاقات من نفس النوع متتالية).
- تفصيل حسب الفئة العمرية: حضانة (رموز + صور) / مدرسة (أمثلة ملموسة) / جامعة (برهان) / محترف (case studies).
- قواعد عميقة لكل مجال: طب (تحذيرات سلامة)، قانون (اختصاص قضائي)، برمجة (اقرأ→توقّع→اكتب)، رياضيات (ملموس→رمزي)، لغات (استماع→تكرار→إنتاج).
- تدفّق إجباري: `onboarding` → 3-5 بطاقات → `summary_write` (Feynman) → `exam` قصير.
- قراءة `[LEARN_STATE]` بدقّة: streak عالٍ = صعّب، accuracy < 50% = انزل رتبة Bloom + اشرح من جديد.
- lang lock: التزم بلهجة المستخدم بالضبط (مصري → مصري، MSA → MSA).

## 6. Micro-polish
- ConfettiBurst مكوّن مشترك (`src/components/common/ConfettiBurst.tsx`).
- StudyHUD: زر reset بتأكيد، عرض topic كـ chip قابل للتعديل.
- InChatTimerCard: مزامنة مع Pomodoro في Focus Mode.
- Sounds اختياريّة (toggle في HUD): tick, correct, wrong, level-up (استخدام Web Audio بلا ملفات).

## Details التقنية
- كل ملف جديد يبدأ بـ `/** @doc ... */`.
- typecheck: `bunx tsgo --noEmit` بعد كل خطوة.
- لا تغيير في backend/auth/DB — كل شيء frontend + localStorage.
- Framer Motion موجود؛ Confetti: CSS keyframes خفيفة بلا مكتبة جديدة.
- Web Audio API للأصوات (بلا assets إضافية).

**الترتيب المقترح:** 1 → 6 → 3 → 2 → 4 → 5 (اللمسات أولاً لأنها الأكثر شعوراً، ثم البطاقات الجديدة، ثم تعميق البرومبت).

هل أبدأ التنفيذ بالترتيب أعلاه؟
