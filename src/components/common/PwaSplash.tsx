import { useEffect, useState } from "react";
import megsyLogo from "@/assets/megsy-project-logo.png";

/**
 * @doc PwaSplash — full-screen splash shown ONLY when the app is launched as an
 * installed PWA (iOS/Android home-screen). Never shows in the browser.
 * Layout mirrors app splashes (Claude, ChatGPT): centered logo + wordmark,
 * "BY MEGSY LLC" pinned near the bottom safe-area.
 */
export default function PwaSplash() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return standalone;
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    const fadeT = window.setTimeout(() => setFading(true), 450);
    const hideT = window.setTimeout(() => setShow(false), 900);
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
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity 420ms ease-out",
        pointerEvents: fading ? "none" : "auto",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          animation: "megsy-splash-in 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <img
          src={megsyLogo}
          alt=""
          width={72}
          height={72}
          style={{ width: 72, height: 72, objectFit: "contain", display: "block" }}
        />
        <span
          style={{
            fontFamily: "'Instrument Serif', 'Times New Roman', serif",
            fontSize: 44,
            lineHeight: 1,
            color: "#fafafa",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          Megsy AI
        </span>
      </div>


      <div
        style={{
          paddingBottom: 28,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.42)",
        }}
      >
        BY MEGSY LLC
      </div>

      <style>{`
        @keyframes megsy-splash-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
