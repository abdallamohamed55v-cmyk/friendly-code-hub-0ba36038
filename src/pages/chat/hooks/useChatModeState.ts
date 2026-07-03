import { useEffect, useState } from "react";
import type { ChatMode } from "../chatConstants";
import { DEFAULT_SLIDES_TEMPLATE } from "@/lib/slidesTemplates";
import type { MediaModelChoice } from "@/components/chat/media/MediaModelPickerSheet";

const CHAT_MODE_STORAGE_KEY = "megsy.chatMode";
const VALID_MODES: ChatMode[] = [
  "normal", "code", "deep-research", "learning", "shopping",
  "slides", "slides-images", "images", "video", "operator",
];

function readStoredMode(): ChatMode {
  if (typeof window === "undefined") return "normal";
  try {
    const v = window.localStorage.getItem(CHAT_MODE_STORAGE_KEY);
    if (v && (VALID_MODES as string[]).includes(v)) return v as ChatMode;
  } catch {}
  return "normal";
}

/**
 * Encapsulates state for the chat mode selector (normal/slides/media/video/etc),
 * the slides template + picker, the selected media model, the operator-run id,
 * and the computer-use toggle. Extracted from ChatPage to reduce re-render surface.
 *
 * Persists `chatMode` in localStorage so returning to the chat page keeps the
 * user's last selected mode (e.g. Coder) instead of resetting to normal.
 */
export function useChatModeState() {
  const [chatMode, setChatMode] = useState<ChatMode>(() => readStoredMode());
  const [operatorRunId, setOperatorRunId] = useState<string | null>(null);
  const [slidesTemplate, setSlidesTemplate] = useState<string>(DEFAULT_SLIDES_TEMPLATE);
  const [slidesPickerOpen, setSlidesPickerOpen] = useState(false);
  const [mediaModel, setMediaModel] = useState<MediaModelChoice | null>(null);
  const [computerUseEnabled, setComputerUseEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(CHAT_MODE_STORAGE_KEY, chatMode); } catch {}
  }, [chatMode]);

  return {
    chatMode,
    setChatMode,
    operatorRunId,
    setOperatorRunId,
    slidesTemplate,
    setSlidesTemplate,
    slidesPickerOpen,
    setSlidesPickerOpen,
    mediaModel,
    setMediaModel,
    computerUseEnabled,
    setComputerUseEnabled,
  };
}
