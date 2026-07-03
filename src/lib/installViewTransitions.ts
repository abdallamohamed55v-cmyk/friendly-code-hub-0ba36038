/**
 * @doc installViewTransitions — wraps every history.pushState / replaceState in
 * document.startViewTransition() so React Router navigations get a native soft
 * fade automatically, with no per-link changes. No-op on browsers without the
 * View Transitions API (Firefox, older Safari) and when the user prefers
 * reduced motion. Skips hash-only, replaceState, and rapid successive calls.
 */
type StartViewTransition = (cb: () => void) => { finished: Promise<void> };

let installed = false;

export function installViewTransitions() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const doc = document as unknown as { startViewTransition?: StartViewTransition };
  if (!doc.startViewTransition) return;

  const prefersReduced = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  const samePath = (nextUrl: unknown): boolean => {
    if (typeof nextUrl !== "string" && !(nextUrl instanceof URL)) return false;
    try {
      const next = new URL(String(nextUrl), window.location.href);
      return next.pathname === window.location.pathname;
    } catch {
      return false;
    }
  };

  history.pushState = function (data, unused, url) {
    if (prefersReduced() || samePath(url)) {
      return originalPush(data, unused, url as string | URL | null | undefined);
    }
    try {
      doc.startViewTransition!(() =>
        originalPush(data, unused, url as string | URL | null | undefined),
      );
    } catch {
      originalPush(data, unused, url as string | URL | null | undefined);
    }
  } as typeof history.pushState;

  // replaceState should never trigger transitions (used for query updates,
  // redirect fixes, scroll restoration).
  history.replaceState = originalReplace;
}
