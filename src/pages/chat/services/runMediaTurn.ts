import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadMediaSettings } from "@/components/chat/mobile/MediaSettingsMenu";
import type { Message, ChatMode } from "../chatConstants";


export type MediaPlan = any;

export interface RunMediaTurnArgs {
  text: string;
  userMsg: Message;
  localTurnId: string;
  chatMode: ChatMode;
  mediaModel: any;
  videoStartEndMode: boolean;
  startFrameUrl: string | null;
  endFrameUrl: string | null;
  videoDurationSec: number;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (v: string) => void;
  setAttachedFiles: (v: any[]) => void;
  setPendingQuestions: (v: any[]) => void;
  setIsLoading: (v: boolean) => void;
  setIsThinking: (v: boolean) => void;
  createOrUpdateConversation: (title: string) => Promise<string | null>;
  saveMessage: (
    cid: string,
    role: string,
    content: string,
    modelId?: any,
    meta?: any,
  ) => Promise<string | undefined>;
  ownInsertedIdsRef: React.MutableRefObject<Set<string>>;
}

/**
 * Returns `true` if it handled the turn (caller should `return`),
 * or `false` if validation prevented work (caller still returns but
 * already cleared `isSubmittingRef`).
 */
export async function runMediaTurn(args: RunMediaTurnArgs): Promise<void> {
  const {
    text,
    userMsg,
    localTurnId,
    chatMode,
    mediaModel,
    videoStartEndMode,
    startFrameUrl,
    endFrameUrl,
    videoDurationSec,
    setMessages,
    setInput,
    setAttachedFiles,
    setPendingQuestions,
    setIsLoading,
    setIsThinking,
    createOrUpdateConversation,
    saveMessage,
    ownInsertedIdsRef,
  } = args;

  const isStartEnd = chatMode === "video" && videoStartEndMode;
  const assistantClientId = `assistant-${localTurnId}`;
  const modeLocal = chatMode;
  const modelLocal = mediaModel;

  setMessages((prev) => [
    ...prev,
    userMsg,
    {
      role: "assistant",
      content: "Analyzing your prompt…",
      clientId: assistantClientId,
      mode: modeLocal,
    },
  ]);
  setInput("");
  setAttachedFiles([]);
  setPendingQuestions([]);
  setIsLoading(true);
  setIsThinking(true);

  try {
    const cid = await createOrUpdateConversation(text || "Media");
    if (cid) {
      const userMessageId = await saveMessage(cid, "user", userMsg.content, undefined, {
        mode: modeLocal,
      });
      if (userMessageId) ownInsertedIdsRef.current.add(userMessageId);
    }
    let plan: MediaPlan;
    const settings = loadMediaSettings(modeLocal === "video" ? "video" : "images");
    const aspectRatio = settings.aspectRatio;
    if (isStartEnd) {
      plan = {
        mode: "video",
        modelSlug: modelLocal.slug,
        modelName: modelLocal.name,
        summary: text || "First → last frame interpolation",
        aspectRatio,
        scenes: [
          {
            index: 1,
            title: "First → Last frame",
            prompt: text || "Smooth motion interpolation between the two frames.",
            duration_seconds: videoDurationSec,
            first_frame_url: startFrameUrl!,
            last_frame_url: endFrameUrl!,
          },
        ],
      };
    } else {
      // Honor the "Prompt mode" toggle from MediaSettings. When the user
      // has disabled auto-prompt for video, skip the LLM planner entirely
      // and use their text verbatim as the single-scene prompt.
      const autoPrompt = settings.autoPrompt !== false; // default true
      const count = settings.count ?? 1;
      if (modeLocal === "video" && !autoPrompt) {
        const scenes = Array.from({ length: count }, (_, i) => ({
          index: i + 1,
          title: count > 1 ? `Clip ${i + 1}` : "Your prompt",
          prompt: text,
          duration_seconds: settings.duration ?? videoDurationSec,
        }));
        plan = {
          mode: "video",
          modelSlug: modelLocal.slug,
          modelName: modelLocal.name,
          summary: text,
          aspectRatio,
          scenes,
          estimatedTotalSeconds: (settings.duration ?? videoDurationSec) * count,
          notes: "Manual prompt — sent to the model exactly as written.",
        };
      } else {
        const { data, error } = await supabase.functions.invoke("media-plan", {
          body: {
            mode: modeLocal,
            prompt: text,
            model_slug: modelLocal.slug,
            model_name: modelLocal.name,
            scene_hint: count,
            aspect_ratio: aspectRatio,
            duration_seconds: modeLocal === "video" ? (settings.duration ?? videoDurationSec) : undefined,
          },
        });
        if (error || !data || !Array.isArray(data.scenes)) {
          throw new Error(error?.message || data?.message || "Planning failed");
        }
        plan = {
          mode: modeLocal,
          modelSlug: modelLocal.slug,
          modelName: modelLocal.name,
          summary: data.summary || "",
          aspectRatio,
          scenes: data.scenes,
          estimatedTotalSeconds: data.estimated_total_seconds,
          notes: data.notes,
        };
      }
    }

    const initialResults = plan.scenes.map((s: any) => ({
      index: s.index,
      title: s.title,
      status: "pending" as const,
      type: modeLocal === "video" ? ("video" as const) : ("image" as const),
    }));
    // Persist the assistant media message so it survives reloads.
    let assistantId: string | undefined;
    if (cid) {
      assistantId = await saveMessage(cid, "assistant", "", undefined, {
        kind: "mediaPlan",
        mediaPlan: plan,
        mediaStatus: "awaiting",
        mediaResults: initialResults,
        mode: modeLocal,
      });
      if (assistantId) ownInsertedIdsRef.current.add(assistantId);
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.clientId === assistantClientId
          ? {
              ...m,
              id: assistantId ?? m.id,
              content: "",
              mediaPlan: plan,
              mediaStatus: "awaiting",
              mediaResults: initialResults,
            }
          : m,
      ),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Planning failed";
    setMessages((prev) =>
      prev.map((m) => (m.clientId === assistantClientId ? { ...m, content: `Error: ${msg}` } : m)),
    );
    toast.error(msg);
  } finally {
    setIsLoading(false);
    setIsThinking(false);
  }
}
