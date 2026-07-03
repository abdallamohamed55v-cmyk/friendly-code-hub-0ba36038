import { Check, Gift, Lock } from "lucide-react";
import referralTasks from "@/assets/referral-tasks.png";
import iconX from "@/assets/task-icons/x.png";
import iconInstagram from "@/assets/task-icons/instagram.png";
import iconFacebook from "@/assets/task-icons/facebook.png";
import iconLinkedin from "@/assets/task-icons/linkedin.png";
import iconTelegram from "@/assets/task-icons/telegram.png";
import iconInvite3 from "@/assets/task-icons/invite-3.png";
import iconInvite10 from "@/assets/task-icons/invite-10.png";
import {
  EmptyState,
  RewardTask,
  useReferrals,
  INK,
  YELLOW,
  PINK,
  MINT,
  LAVENDER,
  PEACH,
  SURFACE,
  BORDER,
  TEXT,
  MUTED,
} from "../ReferralsPage";

const TONES = [LAVENDER, PINK, MINT, YELLOW, PEACH];

const resolveTaskIconSrc = (task: {
  task_key?: string;
  action_url?: string | null;
  action_type?: string;
}): string | null => {
  const k = (task.task_key || "").toLowerCase();
  const url = (task.action_url || "").toLowerCase();
  const hay = `${k} ${url}`;
  if (/twitter|x\.com|follow_x/.test(hay)) return iconX;
  if (/instagram/.test(hay)) return iconInstagram;
  if (/facebook|\bfb\b/.test(hay)) return iconFacebook;
  if (/linkedin/.test(hay)) return iconLinkedin;
  if (/telegram|t\.me/.test(hay)) return iconTelegram;
  if (task.action_type === "invite_friends") {
    if (/10|big|mega/.test(k)) return iconInvite10;
    return iconInvite3;
  }
  return null;
};

const TaskIcon = ({
  task,
}: {
  task: { task_key?: string; action_url?: string | null; action_type?: string };
}) => {
  const src = resolveTaskIconSrc(task);
  if (!src) return <Gift className="h-5 w-5" strokeWidth={2.5} />;
  return (
    <img
      src={src}
      alt=""
      width={512}
      height={512}
      loading="lazy"
      className="h-10 w-10 object-contain"
    />
  );
};

export default function TasksTab() {
  const { tasks, userTasks, refs, claimTask } = useReferrals();
  const completed = userTasks.filter((u) => u.completed_at).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  if (tasks.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState title="No tasks available" hint="Check back soon for new tasks." />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5" style={{ color: TEXT }}>
      {/* Lavender hero with mascot + progress */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5"
        style={{
          backgroundColor: LAVENDER,
          border: `2.5px solid ${INK}`,
          boxShadow: `4px 4px 0 ${LAVENDER}30`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="max-w-[60%]">
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-wider"
              style={{ backgroundColor: INK, color: LAVENDER, fontWeight: 800 }}
            >
              Free credits
            </span>
            <h1
              className="mt-3 text-[26px] leading-[1.05]"
              style={{ fontWeight: 900, letterSpacing: "-0.02em", color: INK }}
            >
              Tap, do, claim!
            </h1>
            <p
              className="mt-1.5 text-[13px]"
              style={{ fontWeight: 600, color: INK, opacity: 0.75 }}
            >
              Finish quick tasks to earn bonus credits.
            </p>
          </div>
          <img
            src={referralTasks}
            alt=""
            width={1024}
            height={768}
            loading="lazy"
            className="pointer-events-none h-32 w-32 shrink-0 object-contain"
          />
        </div>

        {/* Progress bar */}
        <div className="mt-4" style={{ color: INK }}>
          <div
            className="flex items-center justify-between text-[12px]"
            style={{ fontWeight: 800 }}
          >
            <span>Progress</span>
            <span className="tabular-nums">
              {completed} / {tasks.length}
            </span>
          </div>
          <div
            className="mt-2 h-4 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "#FFFFFF", border: `2px solid ${INK}` }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: YELLOW,
                borderRight: pct > 0 && pct < 100 ? `2px solid ${INK}` : "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <ul className="space-y-3">
        {tasks.map((t: RewardTask, i) => {
          const ut = userTasks.find((u) => u.task_id === t.id);
          const isDone = !!ut?.completed_at;
          const progress =
            t.action_type === "invite_friends"
              ? Math.min(refs.length, t.target_count)
              : (ut?.progress ?? 0);
          const locked = t.action_type === "invite_friends" && progress < t.target_count && !isDone;
          const tone = TONES[i % TONES.length];

          return (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-[22px] p-3.5"
              style={{
                backgroundColor: SURFACE,
                border: `1.5px solid ${isDone ? MINT : BORDER}`,
                opacity: isDone ? 0.7 : 1,
              }}
            >
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                style={{
                  backgroundColor: isDone ? MINT : tone,
                  border: `2px solid ${INK}`,
                  color: INK,
                }}
              >
                {isDone ? <Check className="h-5 w-5" strokeWidth={3} /> : <TaskIcon task={t} />}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[14.5px] leading-tight"
                  style={{ fontWeight: 800, color: TEXT }}
                >
                  {t.title}
                </p>
                <p
                  className="mt-1 inline-flex items-center gap-1 text-[12px]"
                  style={{ fontWeight: 700, color: MUTED }}
                >
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: YELLOW,
                      border: `1.5px solid ${INK}`,
                      fontWeight: 900,
                      color: INK,
                    }}
                  >
                    +{t.reward_credits}
                  </span>
                  <span>credits</span>
                  {t.action_type === "invite_friends" && (
                    <span>
                      · {progress}/{t.target_count}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => claimTask(t)}
                disabled={isDone || locked}
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] transition active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
                style={{
                  backgroundColor: isDone ? MINT : locked ? "hsl(var(--surface-4))" : YELLOW,
                  color: isDone ? INK : locked ? MUTED : INK,
                  fontWeight: 800,
                  border: `2px solid ${isDone || !locked ? INK : BORDER}`,
                  boxShadow: isDone || locked ? "none" : `2px 2px 0 ${INK}`,
                  cursor: isDone || locked ? "default" : "pointer",
                }}
              >
                {isDone ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
                  </span>
                ) : locked ? (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" strokeWidth={3} /> Locked
                  </span>
                ) : t.action_type === "invite_friends" ? (
                  "Claim"
                ) : (
                  "Go"
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
