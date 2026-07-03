/** @doc 24/7 AI support center — searchable knowledge base and live ticketing. */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp,
  Square,
  Headphones,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Mail,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SEOHead from "@/components/common/SEOHead";
import ChatMessage from "@/components/chat/ChatMessage";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { buildSupportSystemPrompt } from "@/data/supportKnowledge";
import {
  INK,
  SURFACE,
  BORDER,
  TEXT,
  MUTED,
  PAGE_BG,
  YELLOW,
  MINT,
} from "@/pages/billing/ReferralsPage";
import { PEACH, LAVENDER, PINK } from "@/pages/billing/ReferralsPage";
import supportSticker from "@/assets/settings/support-sticker.png";

const SUPPORT_VERSION = "v6";
const STORAGE_KEY = `megsy_support_chat_${SUPPORT_VERSION}`;
const MAX_HISTORY = 40;

// The full knowledge base (plans, services, FAQs, routes, blog, comparisons,
// landings, troubleshooting, behaviour rules) is auto-assembled at request
// time from the SAME data files the website renders. See:
//   src/data/supportKnowledge.ts  ← assembler
//   src/data/pricingData.ts       ← plans / services / FAQs (single source)
//   src/data/blogPosts.ts · comparisons.ts · serviceLandings.ts
// When site data changes anywhere, the assistant updates automatically.

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "How do credits work?",
  "How do I earn free credits?",
  "I was charged but didn't receive credits",
  "How do I cancel my subscription?",
  "Which image model is best for realism?",
  "How do I generate a video?",
] as const;

const loadHistory = (): Message[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(-MAX_HISTORY) : [];
  } catch {
    return [];
  }
};

const saveHistory = (messages: Message[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    /* quota / private mode — ignore */
  }
};

const SupportPage = () => {
  const [messages, setMessages] = useState<Message[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMsgRef = useRef<string>("");
  const { credits, plan } = useCredits();

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Persist messages
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // Focus on mount and after sending
  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  const buildSystemPrompt = useCallback(async (): Promise<string> => {
    const ctx: string[] = [];
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        ctx.push(`Signed-in user: ${data.user.email}`);
      } else {
        ctx.push("User is not signed in (browsing as guest).");
      }
    } catch {
      /* ignore */
    }
    if (typeof credits === "number") ctx.push(`Current credit balance: ${credits} MC`);
    if (plan) ctx.push(`Current plan: ${plan}`);
    ctx.push(`Page: /support  •  Time: ${new Date().toISOString()}`);

    return `${buildSupportSystemPrompt()}\n\n## Live user context\n${ctx.join("\n")}`;
  }, [credits, plan]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      lastUserMsgRef.current = trimmed;
      setNetworkError(false);
      setEscalated(false);

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      const history = [...messages, userMsg]
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const customSystem = await buildSystemPrompt();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-alibaba`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: history,
            customSystem,
            model: "qwen-max",
            tier: "max",
            useTools: false,
          }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          throw new Error(`status_${resp.status}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullResponse += content;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    copy[copy.length - 1] = { ...last, content: last.content + content };
                  }
                  return copy;
                });
              }
            } catch {
              break;
            }
          }
        }

        // Handle escalation tag
        if (fullResponse.includes("[ESCALATE_FINANCIAL]")) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              copy[copy.length - 1] = {
                ...last,
                content: last.content.replace(/\[ESCALATE_FINANCIAL\]/g, "").trim(),
              };
            }
            return copy;
          });
          setEscalated(true);
          try {
            await supabase.functions.invoke("send-email", {
              body: {
                to: "support@megsyai.com",
                template: "support_escalation",
                type: "system",
                variables: {
                  user_message: trimmed,
                  ai_response: fullResponse.replace(/\[ESCALATE_FINANCIAL\]/g, ""),
                  timestamp: new Date().toISOString(),
                },
              },
            });
          } catch {
            /* silent — user already got reply */
          }
        }
      } catch (err: unknown) {
        const aborted =
          err instanceof Error && (err.name === "AbortError" || err.message === "cancelled");
        if (!aborted) {
          setNetworkError(true);
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant" && !last.content) {
              copy.pop();
            }
            return copy;
          });
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [buildSystemPrompt, isStreaming, messages],
  );

  const retry = useCallback(() => {
    if (lastUserMsgRef.current) void send(lastUserMsgRef.current);
  }, [send]);

  const newChat = useCallback(() => {
    if (isStreaming) abortRef.current?.abort();
    setMessages([]);
    setEscalated(false);
    setNetworkError(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    textareaRef.current?.focus();
  }, [isStreaming]);

  const copyEmail = useCallback(() => {
    navigator.clipboard?.writeText("support@megsyai.com").then(
      () => toast.success("support@megsyai.com copied"),
      () => toast.error("Couldn't copy — please copy manually"),
    );
  }, []);

  const topics = [
    { label: "Plans & yearly", q: "Compare monthly vs yearly plans and savings", tone: YELLOW },
    { label: "Credits (MC)", q: "How do Megsy Credits work and how do I top up?", tone: MINT },
    { label: "Image gen", q: "How do I generate high-quality images?", tone: PEACH },
    { label: "Video gen", q: "How do I generate videos and what does it cost?", tone: LAVENDER },
    { label: "Code Builder", q: "How does Megsy Code Builder work?", tone: PINK },
    { label: "Referrals", q: "How do referrals and free credits work?", tone: YELLOW },
    { label: "Refunds", q: "What's the refund policy?", tone: MINT },
    { label: "Enterprise", q: "I need enterprise / SSO / custom contract", tone: PEACH },
    { label: "Account", q: "How do I delete or export my account?", tone: LAVENDER },
  ];

  return (
    <div
      data-theme="dark"
      className="min-h-dvh flex flex-col"
      style={{
        backgroundColor: PAGE_BG,
        color: TEXT,
        fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
      }}
    >
      <SEOHead
        title="Support Chat — Megsy AI"
        description="24/7 AI support chat for Megsy AI. Get instant answers about features, pricing, billing, and account questions — escalates to a human for sensitive requests."
        path="/support"
      />
      <LandingNavbar />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-20 pb-4">
        {/* Cartoon header card */}
        <div
          className="mt-4 mb-4 flex items-center justify-between gap-3 rounded-[24px] px-4 py-3"
          style={{
            backgroundColor: MINT,
            border: `2.5px solid ${INK}`,
            boxShadow: `4px 4px 0 ${INK}`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="relative shrink-0 grid h-11 w-11 place-items-center rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.55)", border: `2px solid ${INK}` }}
            >
              <Headphones className="w-5 h-5" strokeWidth={2.5} style={{ color: INK }} />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{ backgroundColor: "#22c55e", border: `2px solid ${INK}` }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px]" style={{ color: INK, fontWeight: 900 }}>
                  Megsy Support
                </p>
                <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: INK }} />
              </div>
              <p className="text-[11px]" style={{ color: INK, opacity: 0.75, fontWeight: 700 }}>
                Online 24/7 · usually replies instantly
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyEmail}
              aria-label="Copy support email"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[11px] transition active:translate-x-[1px] active:translate-y-[1px]"
              style={{
                backgroundColor: "rgba(255,255,255,0.55)",
                color: INK,
                border: `2px solid ${INK}`,
                fontWeight: 800,
              }}
            >
              <Mail className="w-3.5 h-3.5" strokeWidth={2.5} /> Email us
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={newChat}
                aria-label="Start a new chat"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[11px] transition active:translate-x-[1px] active:translate-y-[1px]"
                style={{
                  backgroundColor: INK,
                  color: MINT,
                  border: `2px solid ${INK}`,
                  fontWeight: 800,
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} /> New
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center">
              {/* Hero sticker */}
              <div
                className="w-full rounded-[28px] p-7 flex flex-col items-center"
                style={{
                  backgroundColor: PEACH,
                  border: `2.5px solid ${INK}`,
                  boxShadow: `5px 5px 0 ${INK}`,
                }}
              >
                <img
                  src={supportSticker}
                  alt=""
                  width={140}
                  height={140}
                  className="h-32 w-32 object-contain mb-2"
                />
                <h1
                  className="text-[28px] md:text-[34px] leading-[1]"
                  style={{ color: INK, fontWeight: 900, letterSpacing: "-0.025em" }}
                >
                  How can we help?
                </h1>
                <p
                  className="mt-2 max-w-[320px] text-[13px]"
                  style={{ color: INK, fontWeight: 700, opacity: 0.8 }}
                >
                  Ask anything — features, billing, account. Replies in seconds.
                </p>
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mt-6">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="text-left text-[13px] px-4 py-3 rounded-2xl transition active:translate-x-[1px] active:translate-y-[1px]"
                    style={{
                      backgroundColor: SURFACE,
                      color: TEXT,
                      border: `2px solid ${BORDER}`,
                      fontWeight: 700,
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Topics */}
              <div className="mt-7 w-full max-w-lg">
                <p
                  className="text-[11px] uppercase tracking-[0.22em] mb-3"
                  style={{ color: MUTED, fontWeight: 900 }}
                >
                  Browse by topic
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {topics.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => void send(t.q)}
                      className="rounded-full px-3.5 py-2 text-[12px] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      style={{
                        backgroundColor: t.tone,
                        color: INK,
                        border: `2px solid ${INK}`,
                        boxShadow: `3px 3px 0 ${INK}`,
                        fontWeight: 800,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-[11.5px] max-w-lg"
                style={{
                  backgroundColor: SURFACE,
                  border: `2px solid ${BORDER}`,
                  color: MUTED,
                  fontWeight: 700,
                }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: YELLOW }} />
                <span>Billing, refunds, or account changes are escalated to our human team.</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={
                isStreaming &&
                msg.id === messages[messages.length - 1]?.id &&
                msg.role === "assistant"
              }
              isThinking={isStreaming && msg.role === "assistant" && !msg.content}
            />
          ))}

          {escalated && (
            <div
              className="mt-3 flex items-start gap-2.5 rounded-2xl px-4 py-3"
              style={{
                backgroundColor: MINT,
                border: `2.5px solid ${INK}`,
                boxShadow: `3px 3px 0 ${INK}`,
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: INK }} />
              <div className="text-[12.5px] leading-relaxed">
                <p style={{ color: INK, fontWeight: 900 }}>Forwarded to our human team</p>
                <p style={{ color: INK, opacity: 0.78, fontWeight: 600 }}>
                  A specialist will reply by email within 24 hours.
                </p>
              </div>
            </div>
          )}

          {networkError && (
            <div
              className="mt-3 flex items-start gap-2.5 rounded-2xl px-4 py-3"
              style={{
                backgroundColor: PINK,
                border: `2.5px solid ${INK}`,
                boxShadow: `3px 3px 0 ${INK}`,
              }}
            >
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" style={{ color: INK }} />
              <div className="flex-1 text-[12.5px] leading-relaxed">
                <p style={{ color: INK, fontWeight: 900 }}>Couldn't reach support</p>
                <p style={{ color: INK, opacity: 0.8, fontWeight: 600 }}>
                  Check your connection and try again, or email{" "}
                  <a
                    href="mailto:support@megsyai.com"
                    className="underline"
                    style={{ color: INK, fontWeight: 800 }}
                  >
                    support@megsyai.com
                  </a>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={retry}
                className="shrink-0 h-8 px-3 rounded-full text-[11px]"
                style={{
                  backgroundColor: INK,
                  color: PINK,
                  border: `2px solid ${INK}`,
                  fontWeight: 900,
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="pb-4 pt-3">
          <div
            className="relative flex items-end gap-2 rounded-[22px] px-3 py-2 transition-all"
            style={{ backgroundColor: SURFACE, border: `2.5px solid ${BORDER}` }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (typeof window === "undefined" || window.innerWidth >= 768)
                ) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask anything about Megsy — features, billing, account…"
              rows={1}
              aria-label="Message Megsy Support"
              className="flex-1 bg-transparent px-1.5 py-2 text-sm outline-none resize-none max-h-40 selectable placeholder:opacity-50"
              style={{ color: TEXT, fontWeight: 600 }}
            />
            <button
              type="button"
              onClick={isStreaming ? stop : () => void send(input)}
              disabled={!isStreaming && !input.trim()}
              aria-label={isStreaming ? "Stop generating" : "Send message"}
              className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: YELLOW,
                color: INK,
                border: `2.5px solid ${INK}`,
                boxShadow: `3px 3px 0 ${INK}`,
              }}
            >
              {isStreaming ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <ArrowUp className="w-4 h-4" strokeWidth={2.8} />
              )}
            </button>
          </div>
          <p className="text-[10.5px] text-center mt-2" style={{ color: MUTED, fontWeight: 600 }}>
            AI assistant · responses may be inaccurate · for urgent issues email{" "}
            <a
              href="mailto:support@megsyai.com"
              className="underline"
              style={{ color: YELLOW, fontWeight: 800 }}
            >
              support@megsyai.com
            </a>
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default SupportPage;
