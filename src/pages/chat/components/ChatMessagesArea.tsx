import { AnimatePresence } from "framer-motion";
import { forwardRef, type ReactNode, type RefObject } from "react";
import { DesktopGreeting } from "./DesktopGreeting";
import { MobileChatLandingMount } from "./MobileChatLandingMount";
import { ChatMessagesList } from "./ChatMessagesList";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import type { Message, ChatMode } from "../chatConstants";

interface ChatMessagesAreaProps {
  // Loading + transcript
  loadingMessages: boolean;
  messages: Message[];
  messagesContainerRef: RefObject<HTMLDivElement>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  // Scroll-to-bottom button
  showScrollBtn: boolean;
  newMessagesCount: number;
  scrollToBottom: () => void;
  // Greeting
  userName: string | null;
  isFirstVisit: boolean;
  returningGreetingIdx: number;
  // Mobile landing props (passthrough)
  mobileLandingProps: Record<string, any>;
  // Plus menu overlay
  plusMenuOpen: boolean;
  renderPlusMenu: () => ReactNode;
  // Messages list props (passthrough)
  messagesListProps: Record<string, any>;
  // Optional slot rendered after the transcript (used for inline Coder runs)
  slotAfterMessages?: ReactNode;
}

/**
 * The scrollable middle column of the chat page. Renders one of three states:
 *   1. Loading skeleton (initial conversation fetch)
 *   2. Empty/welcome layout with mobile landing + desktop greeting + DarkVeil
 *   3. The actual ChatMessagesList transcript
 * Also hosts the floating ScrollToBottomButton.
 */
export const ChatMessagesArea = forwardRef<HTMLDivElement, ChatMessagesAreaProps>(
  function ChatMessagesArea(props, messagesEndRef) {
    const {
      loadingMessages,
      messages,
      messagesContainerRef,
      handleScroll,
      showScrollBtn,
      newMessagesCount,
      scrollToBottom,
      userName,
      isFirstVisit,
      returningGreetingIdx,
      mobileLandingProps,
      plusMenuOpen,
      renderPlusMenu,
      messagesListProps,
      slotAfterMessages,
    } = props;

    const isEmpty = !loadingMessages && messages.length === 0;
    return (
      <div
        className={`flex-1 min-h-0 relative max-md:bg-black md:bg-transparent ${isEmpty ? "overflow-hidden" : "overflow-y-auto"}`}
        ref={messagesContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
      >
        {loadingMessages && messages.length === 0 ? (
          <div className="relative z-[1] max-w-3xl mx-auto pt-20 pb-44 md:pb-52 px-4 md:px-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div
                  className={`h-12 rounded-2xl bg-muted/60 animate-pulse ${i % 2 === 0 ? "w-2/3" : "w-3/4"}`}
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="absolute inset-0 z-[1] md:flex md:items-start md:justify-center md:px-6 md:pt-[14vh] md:pb-[190px]">
            <MobileChatLandingMount {...(mobileLandingProps as any)} />
            {/* Desktop greeting moved into the composer dock (above input) so it
                sits flush against the prompt box per product direction. */}
          </div>

        ) : (
          <div className="relative z-[1]">
            <ChatMessagesList ref={messagesEndRef} {...(messagesListProps as any)} />
            {slotAfterMessages ? (
              <div className="max-w-3xl mx-auto px-4 md:px-6 pb-6">{slotAfterMessages}</div>
            ) : null}
          </div>
        )}

        <ScrollToBottomButton
          visible={(showScrollBtn || newMessagesCount > 0) && messages.length > 0}
          newMessagesCount={newMessagesCount}
          onClick={scrollToBottom}
        />
      </div>
    );
  },
);
