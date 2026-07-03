import { Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { reportError } from "@/lib/errors";

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Errors that warrant a one-time reload (stale JS chunks after a deploy).
// DOM-mutation errors (insertBefore/removeChild/"not a child of this node")
// are recovered by React itself on the next render — reloading on them causes
// hard refreshes on every route change on mobile, so they're excluded here.
const TRANSIENT_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Loading CSS chunk/i,
];

const isTransient = (err: unknown): boolean => {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err ?? "");
  return TRANSIENT_PATTERNS.some((re) => re.test(msg));
};

const RELOAD_FLAG = "__megsy_eb_reloaded_at";

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    void reportError(error, {
      source: "react-error-boundary",
      context: { componentStack: info.componentStack?.slice(0, 1500) ?? null },
    });

    // Transient browser-translation / chunk-load errors: try to silently recover
    // instead of showing the error UI. We reload at most once per minute to
    // avoid an infinite reload loop if the error is actually persistent.
    if (isTransient(error)) {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
        const now = Date.now();
        if (now - last > 60_000) {
          sessionStorage.setItem(RELOAD_FLAG, String(now));
          // Reset state immediately so we never flash the fallback UI for
          // transient chunk errors before the reload kicks in.
          this.setState({ hasError: false, error: undefined });
          setTimeout(() => window.location.reload(), 60);
          return;
        }
      } catch {
        // sessionStorage may be unavailable — fall through to fallback UI.
      }
    }
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      const detail = this.state.error?.message
        ? this.state.error.message.slice(0, 160)
        : "The app recovered from an unexpected client error.";
      return (
        <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{detail}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
              }}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return <ErrorBoundary resetKey={loc.pathname}>{children}</ErrorBoundary>;
}
