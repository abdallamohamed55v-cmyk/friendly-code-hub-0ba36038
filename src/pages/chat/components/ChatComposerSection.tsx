
import { useState, useEffect, type ReactNode } from "react";
import ComposerAttachments from "./ComposerAttachments";
import { RemoteAiBusyBanner } from "./RemoteAiBusyBanner";
import { MentionDropdown } from "./MentionDropdown";
import { ComposerMobileModeBar } from "./ComposerMobileModeBar";
import { ComposerAnimatedInput } from "./ComposerAnimatedInput";
import { MobileModeChips } from "./MobileModeChips";
import { ActiveServicePill } from "./ActiveServicePill";
import { ComposerUpgradeBanner } from "./ComposerUpgradeBanner";
import type { AttachedFile } from "../hooks/useAttachments";





interface ChatComposerSectionProps {
  sidebarCollapsed: boolean;
  loadingMessages: boolean;
  messagesLength: number;
  attachedFiles: AttachedFile[];
  removeAttachment: (i: number) => void;
  remoteAiBusy: { name: string } | null;
  plusMenuOpen: boolean;
  renderPlusMenu: () => ReactNode;
  mentionQuery: { q: string } | null;
  members: any[];
  onlineUsers: any;
  colorForUser: (id?: string | null) => any;
  insertMention: (name: string) => void;
  composerMobileModeBarProps: Record<string, any>;
  composerAnimatedInputProps: Record<string, any>;
  navigate: any;
  desktopModeChipsProps: Record<string, any>;
  /** Optional greeting node rendered just above the input on empty desktop state. */
  desktopGreeting?: ReactNode;
  /** Ref forwarded to the composer wrapper so the plus menu can anchor to it. */
  composerRef?: React.Ref<HTMLDivElement>;
}

/**
 * Floating bottom composer dock. Lifts to vertical-center on empty desktop
 * state, otherwise sticks to the bottom. Hosts attachments preview, busy
 * banner, plus-menu overlay, @mention dropdown, mobile mode bar, animated
 * input, desktop integrations strip, and the desktop mode chips row.
 */
export function ChatComposerSection(props: ChatComposerSectionProps) {
  const {
    sidebarCollapsed,
    loadingMessages,
    messagesLength,
    attachedFiles,
    removeAttachment,
    remoteAiBusy,
    plusMenuOpen,
    renderPlusMenu,
    mentionQuery,
    members,
    onlineUsers,
    colorForUser,
    insertMention,
    composerMobileModeBarProps,
    composerAnimatedInputProps,
    navigate,
    desktopModeChipsProps,
    desktopGreeting,
    composerRef,
  } = props;

  const isEmpty = messagesLength === 0 && !loadingMessages;
  // Chips/modes bar visibility: hidden when a service is active; shown on X / toggle.
  const [modesShown, setModesShown] = useState(true);
  const d = desktopModeChipsProps as any;
  const hasActiveService =
    d.selectedAgent?.id === "docs" ||
    (d.chatMode && d.chatMode !== "normal");

  // Auto-hide chips when a service becomes active.
  useEffect(() => {
    if (hasActiveService) {
      setModesShown(false);
    }
  }, [hasActiveService]);

  const effectiveModesShown = modesShown;



  return (
    <div
      style={{
        ["--sb-left" as any]: (sidebarCollapsed ? 56 : 260) + "px",
      }}
      className={`fixed left-0 md:left-[var(--sb-left)] right-0 bottom-[var(--kb-offset,0px)] z-30 px-2 md:px-6 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] md:pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 md:pt-6 pointer-events-none transition-[left,top,bottom] duration-200 ease-out bg-transparent ${
        isEmpty
          ? "md:bottom-auto md:top-[calc(50%-40px)] md:-translate-y-1/2 md:bg-transparent md:backdrop-blur-0 md:border-0"
          : "md:bg-transparent md:backdrop-blur-0 md:border-0"
      }`}
    >
      <div className="max-w-3xl mx-auto space-y-2 pointer-events-auto">
        <RemoteAiBusyBanner remoteAiBusy={remoteAiBusy} />

        <div className="relative mx-auto w-full max-w-3xl">

          <div data-tour="composer" className="relative">
            {mentionQuery && (
              <MentionDropdown
                members={members}
                query={mentionQuery.q}
                onlineUsers={onlineUsers}
                colorForUser={colorForUser}
                insertMention={insertMention}
              />
            )}

            <ComposerMobileModeBar
              {...(composerMobileModeBarProps as any)}
              forceHidden={!effectiveModesShown}
            />

            {/* Chips: always above on mobile; above on desktop during chat */}
            {effectiveModesShown ? (
              <div className={isEmpty ? 'md:hidden' : ''}>
                <MobileModeChips
                  chatMode={d.chatMode}
                  selectedAgent={d.selectedAgent}
                  handleModeChange={d.handleModeChange}
                  setChatMode={d.setChatMode}
                  setSelectedAgent={d.setSelectedAgent}
                  onAgentSelect={d.onAgentSelect}
                />
              </div>
            ) : null}

            

            {isEmpty && desktopGreeting ? (
              <div className="hidden md:flex justify-center mb-3">{desktopGreeting}</div>
            ) : null}

            <div ref={composerRef as any} className="relative md:p-[1px] md:rounded-[28px]">
              {plusMenuOpen ? renderPlusMenu() : null}
              <div className="md:rounded-[27px] md:overflow-hidden">

              <ComposerAnimatedInput
              {...(composerAnimatedInputProps as any)}
              modesToggleVisible
              modesShown={effectiveModesShown}
              onToggleModes={() => setModesShown((v) => !v)}
              chatContext
              activeServiceHeader={
                (isEmpty || attachedFiles.length > 0 || hasActiveService) ? (
                  <>
                    {isEmpty && !hasActiveService ? <ComposerUpgradeBanner /> : null}
                    <ComposerAttachments files={attachedFiles} onRemove={removeAttachment} />
                    {hasActiveService ? (
                      <ActiveServicePill
                        chatMode={d.chatMode}
                        selectedAgent={d.selectedAgent}
                        onClear={() => {
                          if (
                            d.selectedAgent?.id === "docs" ||
                            d.selectedAgent?.id === "music"
                          ) {
                            d.setSelectedAgent(null);
                          } else {
                            d.handleModeChange("normal");
                          }
                          setModesShown(true);
                        }}
                      />
                    ) : null}
                  </>
                ) : null
              }

              />
              </div>
            </div>

            {/* Desktop landing: chips below input */}
            {effectiveModesShown ? (
              <div className={`hidden ${isEmpty ? 'md:block' : 'md:hidden'}`}>
                <MobileModeChips
                  chatMode={d.chatMode}
                  selectedAgent={d.selectedAgent}
                  handleModeChange={d.handleModeChange}
                  setChatMode={d.setChatMode}
                  setSelectedAgent={d.setSelectedAgent}
                  onAgentSelect={d.onAgentSelect}
                />
              </div>
            ) : null}


          </div>

          
        </div>
      </div>
    </div>
  );

}
