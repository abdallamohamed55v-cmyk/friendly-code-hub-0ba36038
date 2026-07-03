import { Suspense } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { runMediaPlan, regenerateScene } from "@/lib/mediaGeneration";
import { updateMessageMetadata } from "../services/conversationApi";
import { MediaPlanCard, MediaResultCard } from "../lazyComponents";
import type { Message } from "../chatConstants";

interface Props {
  msg: Message;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (v: string) => void;
}

export default function AssistantMediaBlock({ msg, setMessages, setInput }: Props) {
  if (!msg.mediaPlan) return null;
  const targetKey = msg.id ?? msg.clientId;
  const matches = (mm: Message) =>
    targetKey ? mm.id === targetKey || mm.clientId === targetKey : mm === msg;

  return (
    <div className="px-3 md:px-12 space-y-2">
      <Suspense fallback={null}>
        <MediaPlanCard
          plan={msg.mediaPlan}
          status={msg.mediaStatus ?? "awaiting"}
          currentSceneIndex={msg.mediaCurrentScene}
          onStart={async () => {
            if (msg.id) {
              void updateMessageMetadata(msg.id, { mediaStatus: "running" });
            }
            setMessages((prev) =>
              prev.map((mm) =>
                matches(mm) ? { ...mm, mediaStatus: "running", mediaCurrentScene: 1 } : mm,
              ),
            );
            const liveResults = [...(msg.mediaResults ?? [])];
            await runMediaPlan({
              plan: msg.mediaPlan!,
              onSceneStart: (idx) => {
                setMessages((prev) =>
                  prev.map((mm) =>
                    matches(mm)
                      ? {
                          ...mm,
                          mediaCurrentScene: idx,
                          mediaResults: (mm.mediaResults ?? []).map((r) =>
                            r.index === idx ? { ...r, status: "running" as const } : r,
                          ),
                        }
                      : mm,
                  ),
                );
              },
              onScenePartial: (idx, previewUrl, progress) => {
                setMessages((prev) =>
                  prev.map((mm) =>
                    matches(mm)
                      ? {
                          ...mm,
                          mediaResults: (mm.mediaResults ?? []).map((r) =>
                            r.index === idx ? { ...r, previewUrl, progress } : r,
                          ),
                        }
                      : mm,
                  ),
                );
              },
              onSceneDone: (res) => {
                const i = liveResults.findIndex((r) => r.index === res.index);
                if (i >= 0) liveResults[i] = res;
                else liveResults.push(res);
                setMessages((prev) =>
                  prev.map((mm) =>
                    matches(mm)
                      ? {
                          ...mm,
                          mediaResults: (mm.mediaResults ?? []).map((r) =>
                            r.index === res.index ? res : r,
                          ),
                        }
                      : mm,
                  ),
                );
                // Persist as each scene lands so refreshing mid-flight keeps results.
                if (msg.id) {
                  void updateMessageMetadata(msg.id, {
                    mediaResults: liveResults,
                  });
                }
              },
            });
            setMessages((prev) =>
              prev.map((mm) => (matches(mm) ? { ...mm, mediaStatus: "done" } : mm)),
            );
            if (msg.id) {
              void updateMessageMetadata(msg.id, {
                mediaStatus: "done",
                mediaResults: liveResults,
              });
            }
          }}
          onEditPrompt={() => {
            setInput(msg.mediaPlan?.summary || "");
            toast.message("Edit the prompt and send again");
          }}
        />
        {msg.mediaResults && msg.mediaResults.length > 0 && (
          <MediaResultCard
            results={msg.mediaResults}
            finalVideoUrl={msg.mediaFinalVideoUrl}
            mergeStatus={msg.mediaMergeStatus}
            mergeError={msg.mediaMergeError}
            onMergeVideos={async () => {
              const urls = (msg.mediaResults ?? [])
                .filter((r) => r.type === "video" && r.status === "done" && r.url)
                .map((r) => r.url!) as string[];
              if (urls.length < 2) {
                toast.error("Need at least 2 finished clips to merge");
                return;
              }
              setMessages((prev) =>
                prev.map((mm) =>
                  matches(mm)
                    ? { ...mm, mediaMergeStatus: "merging", mediaMergeError: undefined }
                    : mm,
                ),
              );
              try {
                const { mergeVideosInBrowser } = await import("@/lib/mergeVideosClient");
                const blob = await mergeVideosInBrowser(urls, (p) => {
                  if (p.stage === "encoding" && typeof p.progress === "number") {
                    // Optional: could surface progress; keep status as merging.
                  }
                });
                const objectUrl = URL.createObjectURL(blob);
                setMessages((prev) =>
                  prev.map((mm) =>
                    matches(mm)
                      ? {
                          ...mm,
                          mediaMergeStatus: "done",
                          mediaFinalVideoUrl: objectUrl,
                        }
                      : mm,
                  ),
                );
                toast.success("Final video ready");
              } catch (e) {
                const m = e instanceof Error ? e.message : "Merge failed";
                setMessages((prev) =>
                  prev.map((mm) =>
                    matches(mm) ? { ...mm, mediaMergeStatus: "error", mediaMergeError: m } : mm,
                  ),
                );
                toast.error(m);
              }
            }}
            onRetry={async (idx) => {
              setMessages((prev) =>
                prev.map((mm) =>
                  matches(mm)
                    ? {
                        ...mm,
                        mediaResults: (mm.mediaResults ?? []).map((r) =>
                          r.index === idx
                            ? { ...r, status: "running" as const, error: undefined }
                            : r,
                        ),
                      }
                    : mm,
                ),
              );
              const res = await regenerateScene(msg.mediaPlan!, idx, (i, previewUrl, progress) => {
                setMessages((prev) =>
                  prev.map((mm) =>
                    matches(mm)
                      ? {
                          ...mm,
                          mediaResults: (mm.mediaResults ?? []).map((r) =>
                            r.index === i ? { ...r, previewUrl, progress } : r,
                          ),
                        }
                      : mm,
                  ),
                );
              });
              const merged = (msg.mediaResults ?? []).map((r) => (r.index === idx ? res : r));
              setMessages((prev) =>
                prev.map((mm) =>
                  matches(mm)
                    ? {
                        ...mm,
                        mediaResults: merged,
                      }
                    : mm,
                ),
              );
              if (msg.id) {
                void updateMessageMetadata(msg.id, { mediaResults: merged });
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
