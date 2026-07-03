import { useEffect, useState } from "react";

/**
 * Animated splash screen shown on first paint when the app is launched
 * as a PWA (installed on iOS/Android home screen). In regular browsers it
 * stays invisible so it doesn't flash on every page load.
 *
 * Pure CSS so it paints before any React lazy chunk loads.
 * Loader design: Uiverse.io "push" by Shoh2008 — two white circles pushing
 * upward in sequence on a black backdrop.
 */
export default function PwaSplash() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    return standalone;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    // Fade out as soon as React has mounted — no artificial minimum delay.
    const fadeT = window.setTimeout(() => setFading(true), 250);
    const hideT = window.setTimeout(() => setShow(false), 650);
    return () => {
      window.clearTimeout(fadeT);
      window.clearTimeout(hideT);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity 480ms ease-out",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <style>{`
        .megsy-pwa-loader {
          display: block;
          width: 84px;
          height: 84px;
          position: relative;
        }
        .megsy-pwa-loader::before,
        .megsy-pwa-loader::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #FFF;
          transform: translate(-50%, -100%) scale(0);
          animation: megsy-pwa-push 2s infinite linear;
        }
        .megsy-pwa-loader::after { animation-delay: 1s; }
        @keyframes megsy-pwa-push {
          0%, 50% { transform: translate(-50%, 0%) scale(1); }
          100%    { transform: translate(-50%, -100%) scale(0); }
        }
      `}</style>
      <span className="megsy-pwa-loader" />
    </div>
  );
}
