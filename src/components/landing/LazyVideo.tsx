import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
}

const LazyVideo = ({ src, className = "", poster }: LazyVideoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    // Respect Save-Data / slow connections
    const conn = (navigator as any).connection;
    if (conn) {
      const update = () => {
        setSaveData(
          !!conn.saveData ||
            conn.effectiveType === "slow-2g" ||
            conn.effectiveType === "2g" ||
            conn.effectiveType === "3g",
        );
      };
      update();
      conn.addEventListener?.("change", update);
      return () => {
        mq.removeEventListener("change", handler);
        conn.removeEventListener?.("change", update);
      };
    }
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showPosterOnly = (isMobile || saveData) && !!poster;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {showPosterOnly ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : inView ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  );
};

export default LazyVideo;
