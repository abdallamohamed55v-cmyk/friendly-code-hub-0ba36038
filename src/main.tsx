import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./styles/claude-chat.css";
import "./styles/settings-amber.css";
import "./styles/pwa-safe-area.css";
import "./styles/pwa-responsive.css";
import "./styles/view-transitions.css";



// All fonts are loaded via Google Fonts <link> in index.html (Space Grotesk,
// DM Sans, Work Sans, Inter, Instrument Serif, Noto Serif Arabic, Cairo,
// Tajawal, Readex Pro). @fontsource imports were duplicating those payloads
// and Geist/Fraunces are not referenced anywhere in the app.

import { reportError, friendlyUserMessage, sanitizeErrorMessage } from "@/lib/errors";
import { toast as sonnerToast } from "sonner";
import { patchSupabaseAuth } from "@/integrations/supabase/patchAuth";
import { installGlobalLinkPrefetch } from "@/lib/globalLinkPrefetch";
import { installThemeColorSync } from "@/lib/themeColorSync";
import { installViewTransitions } from "@/lib/installViewTransitions";
import { registerAppServiceWorker } from "@/lib/registerSW";


// If Vercel ever serves the static 404 fallback before SPA rewrites apply,
// public/404.html redirects here with the original path encoded. Restore it
// before React Router mounts so deep links like /terms and /chat work normally.
(() => {
  try {
    const url = new URL(window.location.href);
    const spaPath = url.searchParams.get("__spa_path");
    if (!spaPath || !spaPath.startsWith("/") || spaPath.startsWith("//")) return;
    window.history.replaceState(window.history.state, "", spaPath);
  } catch {
    /* ignore */
  }
})();

patchSupabaseAuth();
installGlobalLinkPrefetch();
installThemeColorSync();
registerAppServiceWorker();

// Globally sanitize every toast message so we never leak provider names or
// the raw "Edge Function returned a non-2xx status code" string to users.
(() => {
  const cleanArg = (arg: unknown, isError = false): unknown => {
    if (arg == null) return arg;
    if (typeof arg === "string") {
      return isError ? friendlyUserMessage(arg, arg) : sanitizeErrorMessage(arg);
    }
    if (arg instanceof Error) {
      return isError ? friendlyUserMessage(arg) : sanitizeErrorMessage(arg);
    }
    return arg;
  };
  const wrap = <T extends (...a: any[]) => any>(fn: T, isError = false): T =>
    ((...args: any[]) => {
      args[0] = cleanArg(args[0], isError);
      if (args[1] && typeof args[1] === "object" && "description" in args[1]) {
        args[1] = { ...args[1], description: cleanArg(args[1].description, isError) };
      }
      return fn(...args);
    }) as T;
  const t = sonnerToast as any;
  t.error = wrap(t.error.bind(t), true);
  if (t.warning) t.warning = wrap(t.warning.bind(t), true);
  t.success = wrap(t.success.bind(t));
  if (t.info) t.info = wrap(t.info.bind(t));
  if (t.message) t.message = wrap(t.message.bind(t));
})();

// Prevent right-click context menu
// Prevent right-click context menu, except inside editable fields so users can copy/paste normally
document.addEventListener("contextmenu", (e) => {
  const t = e.target as HTMLElement | null;
  if (t && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))
    return;
  e.preventDefault();
});

// Report any unhandled error or promise rejection to the admin (best-effort).
let __lastReport = 0;
const __reportThrottled = (err: unknown, source: string) => {
  const now = Date.now();
  if (now - __lastReport < 2000) return; // throttle bursts
  __lastReport = now;
  void reportError(err, { source });
};

// Only reload on true stale-chunk / module-load failures. DOM-mutation errors
// (insertBefore / removeChild / "not a child of this node") are usually caused
// by browser translation or transient React reconcile races — they must NOT
// trigger a full page reload, or the user experiences a hard refresh on every
// route change on mobile.
const __TRANSIENT_RE =
  /(Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|ChunkLoadError|Loading CSS chunk)/i;
const __IGNORED_BROWSER_NOISE_RE = /ResizeObserver loop completed with undelivered notifications/i;
const __RELOAD_KEY = "__megsy_global_reloaded_at";
const __maybeReload = (err: unknown) => {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err ?? "");
  if (!__TRANSIENT_RE.test(msg)) return false;
  try {
    const last = Number(sessionStorage.getItem(__RELOAD_KEY) || 0);
    const now = Date.now();
    if (now - last < 60_000) return false;
    sessionStorage.setItem(__RELOAD_KEY, String(now));
    setTimeout(() => window.location.reload(), 60);
    return true;
  } catch {
    return false;
  }
};

window.addEventListener("error", (e) => {
  const err = e.error ?? e.message;
  if (__IGNORED_BROWSER_NOISE_RE.test(String(err ?? e.message ?? ""))) {
    e.preventDefault();
    return;
  }
  __reportThrottled(err, "window.onerror");
  __maybeReload(err);
});
window.addEventListener("unhandledrejection", (e) => {
  if (__IGNORED_BROWSER_NOISE_RE.test(String(e.reason ?? ""))) return;
  __reportThrottled(e.reason, "unhandledrejection");
  __maybeReload(e.reason);
});

// Apply saved user bubble color
const savedBubble = localStorage.getItem("userBubbleColor");
if (savedBubble) document.documentElement.style.setProperty("--user-bubble", savedBubble);

// Keep `position: fixed` elements pinned to the visual viewport on mobile
// (iOS Safari shifts fixed elements when the URL bar / keyboard show or hide).
// Components can read `--kb-offset` to translate themselves above the keyboard.
(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  let raf = 0;
  const apply = () => {
    raf = 0;
    // True keyboard height = layout viewport bottom - visual viewport bottom.
    // Includes offsetTop so the bar doesn't drift when the visual viewport
    // is scrolled (iOS scrolls focused inputs into view).
    const delta = window.innerHeight - vv.height - vv.offsetTop;
    const offset = delta > 120 ? Math.round(delta) : 0;
    document.documentElement.style.setProperty("--kb-offset", `${offset}px`);
  };
  const update = () => {
    if (raf) return;
    raf = requestAnimationFrame(apply);
  };
  update();
  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  window.addEventListener("orientationchange", update);
})();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
