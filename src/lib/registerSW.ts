/** @doc Cache kill-switch. Unregisters any existing app service worker and
 *  clears stale Cache Storage + localStorage build markers so returning
 *  users pick up the newest build immediately without a manual hard reload. */

const CACHE_BUSTER_KEY = "__megsy_cache_buster_v4";

async function unregisterAllServiceWorkers(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  let hadAny = false;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      hadAny = true;
      try {
        await r.update();
      } catch {
        /* ignore */
      }
      try {
        await r.unregister();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  return hadAny;
}

async function clearAppCaches(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  let cleared = false;
  try {
    const names = await caches.keys();
    await Promise.allSettled(
      names.map((n) => {
        cleared = true;
        return caches.delete(n);
      }),
    );
  } catch {
    /* ignore */
  }
  return cleared;
}

export function registerAppServiceWorker(): void {
  if (typeof window === "undefined") return;

  // Run cleanup lazily during idle time so it NEVER blocks first paint.
  // No forced reload — the SW is already unregistered, and any stale assets
  // will be replaced on the next natural navigation. The old reload here
  // caused a long black screen (paint → reload → paint again) for returning
  // users on mobile.
  const run = async () => {
    try {
      await unregisterAllServiceWorkers();
      const marker = window.localStorage.getItem(CACHE_BUSTER_KEY);
      if (marker !== "1") {
        await clearAppCaches();
        window.localStorage.setItem(CACHE_BUSTER_KEY, "1");
      }
    } catch {
      /* ignore */
    }
  };

  const schedule = () => {
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout?: number }) => number)
      | undefined;
    if (ric) ric(() => void run(), { timeout: 3000 });
    else window.setTimeout(() => void run(), 1500);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}
