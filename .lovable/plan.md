# Learn Mode — Final Pass to "Best in the World"

Building on what's already live (StudyHUD, laddered hints, confetti, Bloom ladder, `[LEARN_STATE]` injection), this plan closes the remaining pedagogy, memory, and creative-polish gaps. Frontend only.

## 1. Durable Long-Term Memory (no more forgotten context)

Today `studyProgress.ts` only tracks streak/XP/Bloom for the current session. The tutor forgets *what* the learner studied, *which items they missed*, and *when to review*.

New `src/lib/learnMemory.ts` (localStorage, per-user):
- `topics[]` — every topic ever studied, with mastery %, last-seen, total time.
- `itemLog[]` — every card answered: `{ id, topicId, type, correct, hintLevel, ts, promptHash }`.
- `mistakes[]` — wrong answers with the exact question, correct answer, and learner's answer (for "Review Mistakes" deck).
- `dueQueue[]` — SM-2-lite spaced-repetition schedule (intervals: 10min → 1d → 3d → 7d → 21d).
- `misconceptions{}` — recurring wrong-answer patterns per topic (tutor uses these to pre-empt).

Extend `formatStudyStateForPrompt()` to emit a compact block:
```
[LEARN_STATE] streak=X rung=Apply topic="Krebs cycle" mastery=62%
[DUE_REVIEW] 3 items overdue: mitochondrion role, NADH count, acetyl-CoA source
[RECENT_MISSES] confused NADH↔FADH2 (2x), reversed substrate/product (1x)
```
So the AI *actually* remembers and pre-empts.

## 2. Context-Safety Sweep

- `LearnCard` mount de-dupe by stable `card.id` hash → no double-recorded answers on React re-renders / stream resumes.
- `recordAnswer` becomes idempotent per `(cardId, attemptIndex)`.
- `setStudyTopic` only overwrites when confidence is high (explicit onboarding answer or 3+ cards on same topic), so a stray off-topic card can't wipe the tracked subject.
- Add a `sessionId` so switching threads/conversations starts a fresh session but keeps long-term memory intact.
- StudyHUD reads through a single `useSyncExternalStore` subscription — removes the race where HUD lags behind the tutor's `[LEARN_STATE]`.

## 3. Spaced Repetition + "Review Mistakes" Deck

- New in-chat card type `review_batch` — tutor can call it and we auto-fill from `dueQueue` + `mistakes[]`.
- `/review` slash command surfaces overdue items even mid-conversation.
- StudyHUD gains a small "🔁 3 due" chip that opens the review deck inline.

## 4. New Card Types (creative range)

Add to `learnCardParser.ts` + `LearnCard.tsx` + i18n:
- `hotspot` — click regions on an image (anatomy, maps, code screenshots).
- `order` — drag to sort steps (already-partial; finish it with keyboard + touch).
- `match` — pair items (term↔definition).
- `fill_blank_multi` — cloze with multiple blanks.
- `code_predict` — read code, predict output, then reveal.
- `audio_listen` — TTS prompt (uses existing readAloud), learner types answer.
- `scenario` — mini case study with 2–3 chained decisions.

Each ships with an example in the system prompt so the model actually uses them.

## 5. Focus Mode

New `src/components/learn/FocusMode.tsx`:
- Full-screen distraction-free card wrapper (blurs chat, hides sidebar).
- Pomodoro 25/5 with gentle chime (Web Audio, respects mute).
- Auto-save every 10s to `localStorage`.
- Exit → session summary: cards done, accuracy, XP, mastery delta, "next up" preview.
- Trigger: HUD button + slash command `/focus`.

## 6. Exam / Multi-Card Sessions

New `src/lib/examSession.ts`:
- Persists exam-in-progress: `{ items[], answers[], currentIndex, startedAt }`.
- Survives reload, thread switch, and network drop.
- Result screen with per-item review, Bloom breakdown, weakest sub-topic, and a generated "study plan for tomorrow".

## 7. Deeper Adaptive Tutor Prompt

Rewrite the Learn block in `modelSystemPrompts.ts`:
- **Onboarding contract**: first turn must call `onboarding` card (age band, goal, current level, time budget, language). Never skip.
- **Age bands with concrete rules**: preschool (pictures + one-word answers), K-6 (stories + analogies), teen (examples they care about), university (rigor + citations expected), pro (case studies, edge cases, tradeoffs).
- **Domain packs**: Medicine (safety disclaimer + differential thinking), Law (jurisdiction-first), Math (concrete→symbolic→proof), Code (read→predict→write→refactor), Language (input → recognition → production), History (cause→event→consequence).
- **Anti-repetition law**: never repeat a card the learner already answered correctly this week (checked against `itemLog`).
- **Difficulty calibration**: explicit table mapping `[LEARN_STATE]` → next action (streak≥5 → transfer; accuracy<50% → drop rung + re-teach; hintsUsed high → change modality).
- **End-of-turn contract**: every tutor turn ends with either a card, a summary_write, or an explicit "what next?" — never a dead-end.
- **Multilingual**: mirror learner's language automatically; keep terminology bilingual on request.

## 8. Micro-polish (the "infinite creative touches")

- Streak flame color escalates: orange (3) → red (5) → violet (10) → gold (20).
- XP counter animates with easing; level-up ring pulse.
- Correct answer: soft haptic + tiny sparkle behind the option, not just confetti.
- Wrong answer: gentle shake + one-line "why this is tempting" from the tutor.
- HUD collapses to a floating pill on scroll; taps to expand.
- Reduced-motion path everywhere (no shake, no confetti, no pulse).
- Optional sound pack (correct/wrong/level-up), off by default, toggle in HUD.
- RTL sweep: every new UI string wired through `learnCardI18n.ts` with Arabic parity.

## 9. Testing & Verification

- Add `src/test/learnMemory.test.ts` — memory idempotency, SM-2 scheduling, mistake dedupe.
- Add `src/test/learnCardParser.test.ts` — every new card type round-trips.
- Manual QA script covering: onboarding → 10 cards → refresh → exam → focus mode → review deck → mistake retry → language switch (EN↔AR) → reduced-motion.
- `bunx tsgo --noEmit` clean before finishing.

## Technical Details

**New files:** `src/lib/learnMemory.ts`, `src/components/learn/FocusMode.tsx`, `src/components/learn/ReviewDeck.tsx`, `src/lib/examSession.ts`, `src/test/learnMemory.test.ts`, `src/test/learnCardParser.test.ts`.

**Edited files:** `src/lib/studyProgress.ts` (delegates long-term memory to `learnMemory.ts`), `src/lib/modelSystemPrompts.ts` (deep rewrite of Learn block), `src/lib/learnCardParser.ts` (new card types), `src/components/learn/LearnCard.tsx` (new renderers + de-dupe + micro-polish), `src/components/learn/StudyHUD.tsx` (due-chip, focus button, sound toggle), `src/lib/learnCardI18n.ts` (EN + AR strings for everything new).

**Guarantees:** frontend-only; no schema/backend/auth changes; every new file starts with `/** @doc ... */`; ships with EN + AR; passes typecheck.

## Order of execution

1 (memory) → 2 (safety sweep) → 7 (deep prompt) → 3 (review deck) → 6 (exam persistence) → 4 (card types) → 5 (Focus Mode) → 8 (polish) → 9 (tests).
