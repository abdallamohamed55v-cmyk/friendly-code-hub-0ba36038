import { m as motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Download, Film, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

/**
 * Honest running label for media tiles:
 *  - Videos: show live elapsed time (m:ss). Providers don't expose numeric
 *    progress, so we don't fake a percentage. If a real percent shows up
 *    (rare), it's shown next to the elapsed timer.
 *  - Images: show real percent when available, otherwise the original copy.
 */
function VideoRunningLabel({ result }: { result: MediaSceneResult }) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  const elapsedStr = `${mm}:${ss}`;
  const hasPct = Number.isFinite(result.progress as number);
  const pct = hasPct ? `${Math.round((result.progress as number) * 100)}%` : null;

  if (result.type === "video") {
    return (
      <span className="text-[11px] font-medium tracking-wide whitespace-nowrap bg-background/40 backdrop-blur px-2 py-0.5 rounded-full">
        {pct ? `Rendering video… ${pct} · ${elapsedStr}` : `Rendering video… ${elapsedStr}`}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium tracking-wide whitespace-nowrap bg-background/40 backdrop-blur px-2 py-0.5 rounded-full">
      {result.previewUrl
        ? `Refining… ${pct ?? ""}`.trim()
        : pct
          ? `Painting pixels… ${pct}`
          : "Painting pixels…"}
    </span>
  );
}

async function forceDownload(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    // Fallback: open in new tab if cross-origin fetch blocked
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.message("Opened in a new tab — long-press the video to save it.");
  }
}

export interface MediaSceneResult {
  index: number;
  title: string;
  status: "pending" | "running" | "done" | "error";
  url?: string;
  /** Progressive low-quality preview rendered during streaming (ChatGPT-style). */
  previewUrl?: string;
  /** Approximate completion 0..1 for the streaming preview. */
  progress?: number;
  error?: string;
  type: "image" | "video";
}

interface Props {
  results: MediaSceneResult[];
  onRetry: (index: number) => void;
  /** Triggered when the user presses "Merge into one video". Only shown for video
   * results once 2+ scenes have finished successfully. */
  onMergeVideos?: () => void;
  mergeStatus?: "idle" | "merging" | "done" | "error" | "unavailable";
  mergeError?: string;
  finalVideoUrl?: string;
}

export default function MediaResultCard({
  results,
  onRetry,
  onMergeVideos,
  mergeStatus = "idle",
  mergeError,
  finalVideoUrl,
}: Props) {
  // Show running tiles too so users see live progress
  const visibleResults = results.filter(
    (r) => r.status === "running" || r.status === "done" || r.status === "error",
  );
  if (!visibleResults.length) return null;

  const isSingle = visibleResults.length === 1;
  const videoDone = results.filter((r) => r.type === "video" && r.status === "done" && r.url);
  const allVideos = results.length > 0 && results.every((r) => r.type === "video");
  const allTerminal = results.every((r) => r.status === "done" || r.status === "error");
  const canMerge = allVideos && allTerminal && videoDone.length >= 2 && !!onMergeVideos;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-2 grid max-w-[640px] gap-2 ${
        isSingle ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
      <AnimatePresence initial={false}>
        {visibleResults.map((r) => (
          <motion.div
            key={r.index}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur overflow-hidden"
          >
            <div
              className={`w-full relative flex items-center justify-center overflow-hidden bg-[hsl(var(--muted))]/30 ${
                r.type === "video" ? "aspect-[9/16]" : "aspect-square"
              }`}
            >
              {r.status === "done" && r.url ? (
                r.type === "video" ? (
                  <motion.video
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={r.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <motion.img
                    initial={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.45 }}
                    src={r.url}
                    alt={r.title}
                    className="w-full h-full object-cover"
                  />
                )
              ) : r.status === "running" ? (
                <>
                  {/* ChatGPT-style progressive preview: show partial image with
                      decreasing blur as more frames arrive, then sharpen on done. */}
                  {r.previewUrl && r.type === "image" ? (
                    <motion.img
                      key={r.previewUrl}
                      src={r.previewUrl}
                      alt={r.title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        filter: `blur(${Math.max(2, 22 - (r.progress ?? 0) * 22)}px) saturate(1.05)`,
                        transform: "scale(1.04)",
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--muted))]/50 via-[hsl(var(--muted))]/30 to-[hsl(var(--muted))]/60" />
                  )}
                  {/* Smooth shimmer sweep */}
                  <motion.div
                    className="absolute inset-y-0 -inset-x-1/2 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
                    animate={{ x: ["-50%", "150%"] }}
                    transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
                  />
                  {/* Soft pulsing aura */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background:
                        "radial-gradient(60% 60% at 50% 50%, hsl(var(--primary) / 0.10), transparent 70%)",
                    }}
                    animate={{ opacity: [0.35, 0.7, 0.35] }}
                    transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3 px-3 text-foreground/85">
                    {!r.previewUrl && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
                        className="w-9 h-9 rounded-full border-[2.5px] border-foreground/10 border-t-primary"
                      />
                    )}
                     <VideoRunningLabel result={r} />
                  </div>
                  {/* Bottom progress bar — determinate when we have progress, else indeterminate */}
                  <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-foreground/5">
                    {Number.isFinite(r.progress as number) ? (
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/80"
                        animate={{ width: `${Math.min(100, Math.max(4, (r.progress as number) * 100))}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    ) : (
                      <motion.div
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                      />
                    )}
                  </div>
                </>
              ) : r.status === "error" ? (
                <div className="flex flex-col items-center gap-1.5 text-destructive p-3 text-center">
                  <AlertCircle className="w-5 h-5" />
                  <span className="line-clamp-2 text-[11px]">{r.error || "Generation failed"}</span>
                </div>
              ) : null}

            </div>
            <div className="p-2 flex items-center justify-between gap-1 bg-black">
              <span className="text-[11px] font-medium truncate flex-1 min-w-0">{r.title}</span>
              {r.status === "done" && r.url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] gap-1"
                  onClick={() =>
                    forceDownload(
                      r.url!,
                      `${r.title.replace(/[^\w-]+/g, "_") || `scene-${r.index}`}.${r.type === "video" ? "mp4" : "png"}`,
                    )
                  }
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              )}
              {r.status === "error" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => onRetry(r.index)}
                >
                  <RotateCw className="w-3 h-3 me-1" />
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Merge into one video ───────────────────────────────────── */}
      {(canMerge || mergeStatus !== "idle" || finalVideoUrl) && (
        <div className="sm:col-span-2 mt-1 rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-3 space-y-2">
          {finalVideoUrl ? (
            <>
              <div className="flex items-center gap-2 text-[12px] font-medium">
                <Film className="w-4 h-4 text-primary" />
                <span>Final stitched video</span>
                <Button
                  size="sm"
                  variant="default"
                  className="ms-auto h-8 gap-1.5"
                  onClick={() => forceDownload(finalVideoUrl, "final-video.mp4")}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
              <video
                src={finalVideoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-xl bg-black"
              />
            </>
          ) : mergeStatus === "merging" ? (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Stitching {videoDone.length} clips into one video… this can take a minute.
            </div>
          ) : mergeStatus === "unavailable" ? (
            <div className="flex items-start gap-2 text-[12px] text-muted-foreground py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {mergeError ||
                  "Server-side clip merging is not available. Download the clips and merge them locally."}
              </span>
            </div>
          ) : mergeStatus === "error" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-destructive">
                <AlertCircle className="w-4 h-4" />
                {mergeError || "Merge failed"}
              </div>
              <Button size="sm" variant="outline" onClick={onMergeVideos}>
                <RotateCw className="w-3.5 h-3.5 me-1" />
                Try merge again
              </Button>
            </div>

          ) : (
            <Button size="sm" onClick={onMergeVideos} className="w-full sm:w-auto">
              <Film className="w-3.5 h-3.5 me-1.5" />
              Merge {videoDone.length} clips into one video
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
