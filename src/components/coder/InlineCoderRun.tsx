/** @doc Megsy Coder inline run — renders todo/files/terminal/integration cards INSIDE the chat feed (not modal). */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check, Loader2, FileCode, Terminal, ListTodo, X, Github, Database,
  ExternalLink, Eye, ChevronDown,
} from "lucide-react";
import { runKimiCoder, type KimiEvent, type KimiFile, type KimiTodo } from "@/lib/kimiCoder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { publishProject } from "@/lib/publishProject";
import { toast } from "sonner";

type BashLog = { command: string; output: string; ok: boolean };
type IntegrationReq = { kind: "github" | "supabase"; reason: string; state: "pending" | "connected" | "skipped" };

interface Props {
  prompt: string;
  onClose: () => void;
  onFinish?: (files: KimiFile[], summary?: string) => void;
}

export default function InlineCoderRun({ prompt, onClose, onFinish }: Props) {
  const [todos, setTodos] = useState<KimiTodo[]>([]);
  const [files, setFiles] = useState<Map<string, string>>(new Map());
  const [bash, setBash] = useState<BashLog[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationReq[]>([]);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [tab, setTab] = useState<"plan" | "files" | "logs">("plan");
  const [collapsed, setCollapsed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const started = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ac = new AbortController();
    abortRef.current = ac;
    runKimiCoder({
      prompt,
      signal: ac.signal,
      onEvent: (ev: KimiEvent) => {
        if (ev.type === "todo") setTodos(ev.todos);
        else if (ev.type === "file") {
          setFiles((prev) => {
            const next = new Map(prev);
            next.set(ev.path, ev.content);
            return next;
          });
          setSelectedFile((cur) => cur ?? ev.path);
        } else if (ev.type === "bash")
          setBash((prev) => [...prev, { command: ev.command, output: ev.output, ok: ev.ok }]);
        else if (ev.type === "integration") {
          setIntegrations((prev) =>
            prev.find((p) => p.kind === ev.kind)
              ? prev
              : [...prev, { kind: ev.kind, reason: ev.reason, state: "pending" }],
          );
        } else if (ev.type === "done") {
          setStatus("done");
          onFinish?.(ev.files, ev.summary);
        } else if (ev.type === "error") {
          setStatus("error");
          setError(ev.error);
        }
      },
    }).catch((e) => {
      setStatus("error");
      setError(e?.message || "network error");
    });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = todos.filter((t) => t.done).length;
  const fileList = useMemo(() => Array.from(files.keys()).sort(), [files]);

  const handlePreview = async () => {
    if (files.size === 0) {
      toast.error("لا توجد ملفات بعد");
      return;
    }
    setPublishing(true);
    try {
      const arr = Array.from(files.entries()).map(([path, content]) => ({
        path,
        content,
        lang: (path.split(".").pop() || "text").toLowerCase(),
      }));
      const { url } = await publishProject(arr, { title: prompt.slice(0, 60), prompt });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const updateIntegration = (kind: "github" | "supabase", state: "connected" | "skipped") => {
    setIntegrations((prev) => prev.map((p) => (p.kind === kind ? { ...p, state } : p)));
  };

  return (
    <div className="my-4 w-full rounded-2xl border border-white/10 bg-neutral-950/80 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          {status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : status === "done" ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">Megsy Coder</div>
          <div className="truncate text-[11px] text-white/60">
            {status === "running"
              ? `Building… ${doneCount}/${todos.length || "?"} · ${files.size} files`
              : status === "done"
                ? `Done · ${files.size} files`
                : `Error: ${error}`}
          </div>
        </div>
        {status === "done" && files.size > 0 && (
          <Button size="sm" variant="secondary" onClick={handlePreview} disabled={publishing} className="h-7 text-xs">
            <Eye className="h-3.5 w-3.5 mr-1" />
            {publishing ? "..." : "Preview"}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed((c) => !c)}>
          <ChevronDown className={cn("h-4 w-4 text-white/70 transition-transform", collapsed && "-rotate-90")} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4 text-white/70" />
        </Button>
      </div>

      {collapsed ? null : (
        <>
          {/* Integration prompts */}
          {integrations.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
              {integrations.map((ig) => (
                <div
                  key={ig.kind}
                  className="flex min-w-[240px] flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  {ig.kind === "github" ? (
                    <Github className="h-5 w-5 text-white/80" />
                  ) : (
                    <Database className="h-5 w-5 text-emerald-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white capitalize">
                      اربط {ig.kind === "github" ? "GitHub" : "Supabase"}
                    </div>
                    <div className="text-[10px] text-white/60 truncate">{ig.reason}</div>
                  </div>
                  {ig.state === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          updateIntegration(ig.kind, "connected");
                          const url =
                            ig.kind === "github"
                              ? "/integrations/github"
                              : "https://supabase.com/dashboard";
                          window.open(url, "_blank");
                        }}
                      >
                        اربط <ExternalLink className="h-3 w-3 mr-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-white/70"
                        onClick={() => updateIntegration(ig.kind, "skipped")}
                      >
                        تخطي
                      </Button>
                    </>
                  ) : (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full",
                        ig.state === "connected"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/50",
                      )}
                    >
                      {ig.state === "connected" ? "✓ متصل" : "تم التخطي"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
            {(
              [
                { id: "plan", icon: ListTodo, label: "الخطة", count: todos.length },
                { id: "files", icon: FileCode, label: "الملفات", count: files.size },
                { id: "logs", icon: Terminal, label: "السجل", count: bash.length },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tab === t.id
                    ? "bg-primary/20 text-white"
                    : "text-white/60 hover:bg-white/5",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="max-h-[420px] min-h-[180px] overflow-hidden">
            {tab === "plan" && (
              <div className="h-full max-h-[420px] overflow-y-auto p-4">
                {todos.length === 0 ? (
                  <div className="text-sm text-white/50">
                    {status === "running" ? "Preparing plan…" : "No plan"}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {todos.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded",
                            t.done ? "bg-emerald-500 text-white" : "border border-white/30",
                          )}
                        >
                          {t.done && <Check className="h-3 w-3" />}
                        </span>
                        <span className={cn("text-sm text-white", t.done && "text-white/40 line-through")}>
                          {t.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "files" && (
              <div className="flex h-full max-h-[420px]">
                <div className="w-52 shrink-0 overflow-y-auto border-r border-white/10 p-2">
                  {fileList.length === 0 && (
                    <div className="p-2 text-xs text-white/50">No files yet…</div>
                  )}
                  {fileList.map((path) => (
                    <button
                      key={path}
                      onClick={() => setSelectedFile(path)}
                      className={cn(
                        "block w-full truncate rounded px-2 py-1 text-left text-xs",
                        selectedFile === path
                          ? "bg-primary/20 text-white"
                          : "text-white/70 hover:bg-white/5",
                      )}
                    >
                      {path}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-auto bg-black/40">
                  {selectedFile ? (
                    <pre className="p-3 text-xs leading-relaxed text-white/90">
                      <code>{files.get(selectedFile)}</code>
                    </pre>
                  ) : (
                    <div className="p-4 text-xs text-white/50">اختر ملف</div>
                  )}
                </div>
              </div>
            )}

            {tab === "logs" && (
              <div className="h-full max-h-[420px] overflow-y-auto bg-black p-3 font-mono text-xs text-emerald-300">
                {bash.length === 0 && <div className="text-white/40">No commands yet…</div>}
                {bash.map((b, i) => (
                  <div key={i} className="mb-2">
                    <div className={cn("font-semibold", b.ok ? "text-cyan-300" : "text-red-400")}>
                      $ {b.command}
                    </div>
                    <div className="whitespace-pre-wrap opacity-80">{b.output}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
