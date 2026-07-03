import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import ChatMessage from "@/components/chat/ChatMessage";
import ResearchJobBubble from "@/components/research/ResearchJobBubble";
import {
  SlidesDeckCard,
  StandardSlidesCard,
  ImageSlidesCard,
  OperatorInlineBubbleLazy,
  DocsArtifactCard,
} from "../lazyComponents";
import AssistantMediaBlock from "./AssistantMediaBlock";
const SiteBuildCard = lazy(() => import("@/components/chat/site/SiteBuildCard"));
const UpgradeRequiredCard = lazy(() => import("@/components/chat/UpgradeRequiredCard"));
import AssistantDocsClarifyBlock from "./AssistantDocsClarifyBlock";
import { type Message, EMPTY_READERS, EMPTY_REACTIONS } from "../chatConstants";

interface SharedHandlers {
  messages: Message[];
  chatUserId: string | null;
  conversationId: string | null;
  conversationTitle: string;
  isLoading: boolean;
  isThinking: boolean;
  searchStatus: unknown;
  toolActivity: unknown;
  parallelTasks: unknown;
  narrations: unknown;
  hasMembers: boolean;
  messageReactions: Record<string, unknown>;
  readersByMessageId: Record<string, unknown>;
  showReadersIdx: number | null;
  lastMessageIdx: number;
  handleLikeMessage: (index: number, liked: boolean | null) => void;
  handleStructuredAction: (text: string) => void;
  handleEditUserMessageAt: (...args: any[]) => void;
  handleResearchRunningChange: (...args: any[]) => void;
  dismissOperatorRun: (...args: any[]) => void;
  colorForUser: (userId?: string | null) => { bg: string; text: string } | null | undefined;
  toggleReaction: (...args: unknown[]) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (v: string) => void;
  setIsLoading: (v: boolean) => void;
  setIsThinking: (v: boolean) => void;
  setSearchStatus: (v: unknown) => void;
  setChatMode: (...args: any[]) => void;
  resetToolUi: () => void;
  startDocsStatusFallback: () => void;
  stopDocsStatusFallback: () => void;
  saveMessage: (...args: unknown[]) => Promise<unknown>;
  handleSendWithText: (text?: string) => Promise<void>;
}

interface ChatMessageItemProps extends SharedHandlers {
  msg: Message;
  i: number;
}

export const ChatMessageItem = ({
  msg,
  i,
  messages,
  chatUserId,
  conversationId,
  conversationTitle,
  isLoading,
  isThinking,
  searchStatus,
  toolActivity,
  parallelTasks,
  narrations,
  hasMembers,
  messageReactions,
  readersByMessageId,
  showReadersIdx,
  lastMessageIdx,
  handleLikeMessage,
  handleStructuredAction,
  handleEditUserMessageAt,
  handleResearchRunningChange,
  dismissOperatorRun,
  colorForUser,
  toggleReaction,
  setMessages,
  setInput,
  setIsLoading,
  setIsThinking,
  setSearchStatus,
  setChatMode,
  resetToolUi,
  startDocsStatusFallback,
  stopDocsStatusFallback,
  saveMessage,
  handleSendWithText,
}: ChatMessageItemProps) => {
  const isOther =
    msg.role === "user" && !!msg.user_id && !!chatUserId && msg.user_id !== chatUserId;
  const isLast = i === lastMessageIdx;
  const isLastAssistant = isLast && msg.role === "assistant";
  const isStreamingThis = isLoading && isLastAssistant;
  return (
    <motion.div
      key={msg.clientId || msg.id || `idx-${i}`}
      initial={isStreamingThis ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {msg.role === "assistant" && msg.operatorRunId ? (
        <Suspense fallback={null}>
          <OperatorInlineBubbleLazy runId={msg.operatorRunId} onDismiss={dismissOperatorRun} />
        </Suspense>
      ) : (
        <ChatMessage
          messageIndex={i}
          role={msg.role}
          content={msg.content}
          images={msg.images}
          videos={msg.videos}
          audios={msg.audios}
          products={msg.products}
          attachedImages={msg.attachedImages}
          attachedFiles={msg.attachedFiles}
          isStreaming={isStreamingThis}
          isThinking={isThinking && isLastAssistant && !msg.content}
          searchStatus={isLastAssistant ? (searchStatus as any) : undefined}
          toolActivity={isLastAssistant ? (toolActivity as any) : null}
          parallelTasks={isLastAssistant ? (parallelTasks as any) : undefined}
          liked={msg.liked}
          onLikeMessage={handleLikeMessage}
          onShare={undefined}
          onStructuredAction={handleStructuredAction}
          onEditUserMessageAt={msg.role === "user" ? handleEditUserMessageAt : undefined}
          isDeepResearch={msg.mode === "deep-research" && msg.role === "assistant"}
          isSlidesMode={msg.mode === "slides" && msg.role === "assistant"}
          isLearningMode={msg.mode === "learning" && msg.role === "assistant"}
          researchQuery={
            msg.role === "assistant" && i > 0 && messages[i - 1]?.role === "user"
              ? messages[i - 1].content
              : undefined
          }
          researchSessionKey={
            msg.role === "assistant" && conversationId ? `conv_${conversationId}_${i}` : undefined
          }
          narrations={isLastAssistant ? (narrations as any) : undefined}
          senderName={hasMembers ? msg.senderName || undefined : undefined}
          senderAvatar={hasMembers ? msg.senderAvatar || undefined : undefined}
          isOtherMember={isOther}
          bubbleColor={isOther ? colorForUser(msg.user_id!) : null}
          messageId={msg.id}
          currentUserId={chatUserId || undefined}
          reactions={
            (msg.id ? messageReactions[msg.id] || EMPTY_REACTIONS : EMPTY_REACTIONS) as any
          }
          onToggleReaction={msg.id ? (toggleReaction as any) : undefined}
          readers={(msg.id ? readersByMessageId[msg.id] || EMPTY_READERS : EMPTY_READERS) as any}
          showReaders={
            hasMembers && msg.role === "user" && msg.user_id === chatUserId && i === showReadersIdx
          }
          bottomSlot={
            msg.role === "assistant" && msg.docsArtifact ? (
              <Suspense fallback={null}>
                <DocsArtifactCard
                  artifactId={msg.docsArtifact.artifactId}
                  title={msg.docsArtifact.title}
                  docType={msg.docsArtifact.docType}
                  html={msg.docsArtifact.html}
                />
              </Suspense>
            ) : undefined
          }
          hideActions={msg.role === "assistant" && !!msg.docsClarify}
        />
      )}
      {msg.role === "assistant" && msg.researchJobId && (
        <div className="px-3 md:px-12">
          <ResearchJobBubble
            jobId={msg.researchJobId}
            conversationId={conversationId}
            turnIndex={i}
            onRunningChange={handleResearchRunningChange}
          />
        </div>
      )}
      {msg.role === "assistant" && msg.slidesDeck && (
        <div className="px-3 md:px-12">
          <Suspense fallback={null}>
            <SlidesDeckCard deck={msg.slidesDeck} />
          </Suspense>
        </div>
      )}
      {msg.role === "assistant" && msg.standardSlides && (
        <div className="px-3 md:px-12">
          <Suspense fallback={null}>
            <StandardSlidesCard
              title={msg.standardSlides.title}
              templateName={msg.standardSlides.templateName}
              url={msg.standardSlides.url}
              colors={msg.standardSlides.colors}
              slides={msg.standardSlides.slides}
              chatName={conversationTitle}
            />
          </Suspense>
        </div>
      )}
      {msg.role === "assistant" && msg.imageSlides && (
        <div className="px-3 md:px-12">
          <Suspense fallback={null}>
            <ImageSlidesCard
              title={msg.imageSlides.title}
              url={msg.imageSlides.url}
              slideCount={msg.imageSlides.slideCount}
              chatName={conversationTitle}
            />
          </Suspense>
        </div>
      )}
      {msg.role === "assistant" && msg.siteBuild?.siteId && (
        <div className="px-3 md:px-12">
          <Suspense fallback={null}>
            <SiteBuildCard siteId={msg.siteBuild.siteId} />
          </Suspense>
        </div>
      )}
      {msg.role === "assistant" && msg.paywall && (
        <div className="px-3 md:px-12">
          <Suspense fallback={null}>
            <UpgradeRequiredCard feature={msg.paywall.feature} />
          </Suspense>
        </div>
      )}
      {msg.role === "assistant" && msg.mediaPlan && (
        <AssistantMediaBlock
          msg={msg as any}
          setMessages={setMessages as any}
          setInput={setInput}
        />
      )}
      {msg.role === "assistant" && msg.docsClarify && (
        <AssistantDocsClarifyBlock
          msg={msg as any}
          conversationId={conversationId}
          setMessages={setMessages as any}
          setIsLoading={setIsLoading}
          setIsThinking={setIsThinking}
          setSearchStatus={setSearchStatus as any}
          resetToolUi={resetToolUi}
          startDocsStatusFallback={startDocsStatusFallback}
          stopDocsStatusFallback={stopDocsStatusFallback}
          saveMessage={saveMessage as any}
        />
      )}
      {msg.role === "assistant" &&
        msg.mode === "slides" &&
        !msg.slidesDeck &&
        !msg.standardSlides &&
        !msg.slidesJobId &&
        !msg.content?.trim() &&
        !isLoading && (
          <div className="px-3 md:px-12 mt-3">
            <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 max-w-xl">
              <div className="text-[13px] font-medium text-foreground mb-1">
                Slides not available
              </div>
              <div className="text-[12px] text-muted-foreground mb-3">
                Slide generation was interrupted before completing. You can regenerate it.
              </div>
              <button
                onClick={() => {
                  const topic =
                    msg.slidesPendingTopic ||
                    (i > 0 && messages[i - 1]?.role === "user" ? messages[i - 1].content : "");
                  if (topic) {
                    setChatMode("slides");
                    handleSendWithText(topic);
                  }
                }}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-foreground text-background text-[12.5px] font-semibold hover:opacity-90 transition"
              >
                Regenerate slides
              </button>
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default ChatMessageItem;
