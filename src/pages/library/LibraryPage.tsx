/** @doc Library — all images, videos, and documents generated across the user's conversations, in one place. */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUserSafe } from "@/lib/authSafe";
import AppSidebar from "@/components/layout/AppSidebar";
import { MobileSidebarButton } from "@/components/shared/MobileSidebarButton";

type MediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  conversationId: string;
  conversationTitle: string;
  createdAt: string;
};

type DocItem = {
  id: string;
  artifactId: string;
  title: string;
  docType: string;
  conversationId: string;
  conversationTitle: string;
  createdAt: string;
};

type Tab = "images" | "videos" | "docs";

const PAGE_BG = "#000000";
const SURFACE = "hsl(var(--surface-1))";
const BORDER = "hsl(var(--surface-4))";
const TEXT = "hsl(var(--brand-parchment))";
const MUTED = "hsl(var(--brand-muted))";
const INK = "hsl(var(--brand-ink))";
const YELLOW = "hsl(var(--brand-action))";

const cartoonFont = '"Space Grotesk", "Inter", system-ui, sans-serif';

const tabs: { key: Tab; label: string }[] = [
  { key: "images", label: "Images" },
  { key: "videos", label: "Videos" },
  { key: "docs", label: "Docs" },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("images");
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const user = await getUserSafe();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      // 1) get the user's conversations (title lookup + ownership filter)
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, title")
        .eq("user_id", user.id);

      const convIds = (convs || []).map((c: any) => c.id);
      const titleMap = new Map<string, string>(
        (convs || []).map((c: any) => [c.id, c.title || "Untitled conversation"]),
      );
      if (convIds.length === 0) {
        if (!cancelled) {
          setImages([]);
          setVideos([]);
          setDocs([]);
          setLoading(false);
        }
        return;
      }

      // 2) pull all messages in those conversations that may carry media
      const { data: rows } = await supabase
        .from("messages")
        .select("id, conversation_id, created_at, images, metadata")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
        .limit(1000);

      const imgs: MediaItem[] = [];
      const vids: MediaItem[] = [];
      const documents: DocItem[] = [];

      for (const r of rows || []) {
        const convTitle = titleMap.get(r.conversation_id) || "Conversation";
        const meta = (r.metadata || {}) as any;

        if (Array.isArray(r.images)) {
          r.images.forEach((u: string, i: number) => {
            if (typeof u === "string" && u) {
              imgs.push({
                id: `${r.id}:i:${i}`,
                url: u,
                type: "image",
                conversationId: r.conversation_id,
                conversationTitle: convTitle,
                createdAt: r.created_at,
              });
            }
          });
        }

        if (Array.isArray(meta.videos)) {
          meta.videos.forEach((u: string, i: number) => {
            if (typeof u === "string" && u) {
              vids.push({
                id: `${r.id}:v:${i}`,
                url: u,
                type: "video",
                conversationId: r.conversation_id,
                conversationTitle: convTitle,
                createdAt: r.created_at,
              });
            }
          });
        }
        if (typeof meta.mediaFinalVideoUrl === "string" && meta.mediaFinalVideoUrl) {
          vids.push({
            id: `${r.id}:vf`,
            url: meta.mediaFinalVideoUrl,
            type: "video",
            conversationId: r.conversation_id,
            conversationTitle: convTitle,
            createdAt: r.created_at,
          });
        }

        if (meta.docsArtifact?.artifactId) {
          documents.push({
            id: `${r.id}:d`,
            artifactId: meta.docsArtifact.artifactId,
            title: meta.docsArtifact.title || "Document",
            docType: meta.docsArtifact.docType || "document",
            conversationId: r.conversation_id,
            conversationTitle: convTitle,
            createdAt: r.created_at,
          });
        }
      }

      if (!cancelled) {
        setImages(imgs);
        setVideos(vids);
        setDocs(documents);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({ images: images.length, videos: videos.length, docs: docs.length }),
    [images, videos, docs],
  );

  const openConversation = (id: string) => navigate(`/chat?c=${id}`);

  return (
    <>
      <div className="md:hidden">
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={() => navigate("/")}
          currentMode="chat"
        />
      </div>

      <div
        dir="ltr"
        className="min-h-[100dvh] w-full"
        style={{ background: PAGE_BG, color: TEXT, fontFamily: cartoonFont }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-30 backdrop-blur-2xl"
          style={{ background: "rgba(0,0,0,0.6)", borderBottom: `2px solid ${BORDER}` }}
        >
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 safe-top">
            <MobileSidebarButton onClick={() => setSidebarOpen(true)} />
            <h1 className="text-[18px]" style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
              Library
            </h1>
          </div>

          {/* Tabs */}
          <div className="mx-auto max-w-5xl px-3 pb-3">
            <div
              className="flex gap-1 rounded-full p-1"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `2px solid ${BORDER}`,
              }}
            >
              {tabs.map(({ key, label }) => {
                const active = tab === key;
                const n = counts[key];
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm transition active:scale-95"
                    style={
                      active
                        ? { background: YELLOW, color: INK, fontWeight: 900 }
                        : { background: "transparent", color: TEXT, fontWeight: 700 }
                    }
                  >
                    <span>{label}</span>
                    <span
                      className="rounded-full px-2 py-[1px] text-[11px]"
                      style={{
                        background: active ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.08)",
                        color: active ? INK : MUTED,
                        fontWeight: 800,
                      }}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 safe-bottom">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              ))}
            </div>
          ) : tab === "images" ? (
            <MediaGrid items={images} kind="image" onOpenChat={openConversation} />
          ) : tab === "videos" ? (
            <MediaGrid items={videos} kind="video" onOpenChat={openConversation} />
          ) : (
            <DocsList items={docs} onOpenChat={openConversation} />
          )}
        </main>
      </div>
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="mx-auto mt-10 max-w-md rounded-3xl p-8 text-center backdrop-blur-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: `2px solid ${BORDER}`, color: MUTED }}
    >
      <p className="text-sm">{label}</p>
    </div>
  );
}

function MediaGrid({
  items,
  kind,
  onOpenChat,
}: {
  items: MediaItem[];
  kind: "image" | "video";
  onOpenChat: (id: string) => void;
}) {
  if (items.length === 0) {
    return <EmptyState label={kind === "image" ? "No images yet." : "No videos yet."} />;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.id}
          className="group relative overflow-hidden rounded-2xl backdrop-blur-2xl"
          style={{ background: "rgba(0,0,0,0.3)", border: `2px solid ${BORDER}` }}
        >
          <div className="relative aspect-square w-full bg-black/40">
            {kind === "image" ? (
              <img
                src={it.url}
                alt={it.conversationTitle}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={it.url}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
                controls
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 p-2">
            <button
              onClick={() => onOpenChat(it.conversationId)}
              className="min-w-0 flex-1 truncate text-left text-[12px]"
              style={{ color: TEXT, fontWeight: 700 }}
              title={it.conversationTitle}
            >
              {it.conversationTitle}
            </button>
            <a
              href={it.url}
              target="_blank"
              rel="noreferrer"
              download
              className="grid h-7 w-7 place-items-center rounded-full"
              style={{ background: YELLOW, color: INK }}
              aria-label="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocsList({
  items,
  onOpenChat,
}: {
  items: DocItem[];
  onOpenChat: (id: string) => void;
}) {
  if (items.length === 0) return <EmptyState label="No documents yet." />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-3 rounded-2xl p-3 backdrop-blur-2xl"
          style={{ background: "rgba(0,0,0,0.3)", border: `2px solid ${BORDER}` }}
        >
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
            style={{ background: "hsl(var(--brand-mint) / 0.22)", color: TEXT }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm" style={{ color: TEXT, fontWeight: 800 }}>
              {d.title}
            </div>
            <button
              onClick={() => onOpenChat(d.conversationId)}
              className="truncate text-xs"
              style={{ color: MUTED }}
              title={d.conversationTitle}
            >
              {d.conversationTitle}
            </button>
          </div>
          <button
            onClick={() => onOpenChat(d.conversationId)}
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: YELLOW, color: INK }}
            aria-label="Open in chat"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}