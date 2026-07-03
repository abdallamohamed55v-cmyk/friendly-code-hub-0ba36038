/** @doc Unified Settings sub-page shell — one calm editorial dark design across every internal settings page (desktop + mobile). */
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";

// ============================================================================
// SubShell — top-level wrapper for every settings sub-page.
// Desktop: reuses DesktopSettingsLayout (keeps left nav rail), renders an
// editorial header (title + subtitle + optional action) followed by children.
// Mobile: full-screen scroll, iOS-style top bar (back + centered title).
// ============================================================================
interface SubShellProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SubShell({ title, subtitle, backTo = "/settings", action, children }: SubShellProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const goBack = () =>
    window.history.length > 1 ? window.history.back() : navigate(backTo);

  if (!isMobile) {
    return (
      <DesktopSettingsLayout>
        <div className="relative z-10 max-w-3xl">
          <button
            onClick={goBack}
            className="mb-6 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Settings
          </button>
          <header className="flex items-start justify-between gap-6 pb-8 border-b border-border/60">
            <div className="min-w-0">
              <h1 className="text-[30px] leading-[1.1] font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-[14px] text-muted-foreground max-w-xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>
          <div className="mt-2 divide-y divide-border/60">{children}</div>
        </div>
      </DesktopSettingsLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-md mx-auto px-5 pt-4 pb-16">
        <div className="relative flex items-center justify-center h-11">
          <button
            onClick={goBack}
            aria-label="Back"
            className="absolute left-0 w-10 h-10 rounded-full bg-foreground/[0.06] border border-foreground/10 flex items-center justify-center active:scale-95 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight truncate max-w-[60%]">
            {title}
          </h1>
          <div className="absolute right-0">{action}</div>
        </div>
        {subtitle && (
          <p className="mt-3 text-[13.5px] text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="mt-6 space-y-7">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// SubSection — a titled section.
// Desktop: two columns (title/description on the left, content on the right).
// Mobile: single column stacked, with a subtle group heading.
// ============================================================================
interface SubSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SubSection({ title, description, children }: SubSectionProps) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <section>
        <div className="px-1 mb-2.5">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-[12.5px] text-muted-foreground/70 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {children}
      </section>
    );
  }
  return (
    <section className="grid grid-cols-12 gap-8 py-10">
      <div className="col-span-4">
        <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="col-span-8 min-w-0">{children}</div>
    </section>
  );
}

// ============================================================================
// SubCard — unified card surface. Optional padding.
// ============================================================================
export function SubCard({
  children,
  className,
  flush,
}: { children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card/40 overflow-hidden",
        !flush && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SubRowList — vertically-stacked grouped rows inside a single card surface.
// ============================================================================
export function SubRowList({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/60">
      {children}
    </div>
  );
}

// ============================================================================
// SubRow — a tappable row (label + optional hint + optional trailing content).
// ============================================================================
interface SubRowProps {
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  trailing?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function SubRow({ label, hint, icon: Icon, trailing, onClick, danger, disabled }: SubRowProps) {
  const isClickable = !!onClick && !disabled;
  const Comp: any = isClickable ? "button" : "div";
  return (
    <Comp
      onClick={isClickable ? onClick : undefined}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
        isClickable && "hover:bg-foreground/[0.03] active:bg-foreground/[0.06]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "w-[18px] h-[18px] shrink-0",
            danger ? "text-rose-400" : "text-foreground/70"
          )}
          strokeWidth={1.8}
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[14.5px] font-medium truncate",
            danger ? "text-rose-400" : "text-foreground"
          )}
        >
          {label}
        </p>
        {hint && (
          <p className="text-[12.5px] text-muted-foreground truncate mt-0.5">{hint}</p>
        )}
      </div>
      {trailing !== undefined ? (
        <div className="shrink-0 flex items-center gap-2 text-muted-foreground">
          {trailing}
        </div>
      ) : isClickable ? (
        <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
      ) : null}
    </Comp>
  );
}

// ============================================================================
// SubStat — small stat card used in identity/overview strips.
// ============================================================================
export function SubStatStrip({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-border/70 bg-card/30 px-4 py-3.5"
        >
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 font-medium">
            {it.label}
          </p>
          <p className="mt-1.5 text-[18px] font-semibold tabular-nums text-foreground leading-none">
            {it.value}
          </p>
          {it.sub && (
            <p className="mt-1 text-[11.5px] text-muted-foreground/80">{it.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// DangerCallout — highlighted danger area (delete etc).
// ============================================================================
export function DangerCallout({
  title,
  description,
  action,
}: { title: string; description?: string; action: ReactNode }) {
  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] p-5 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-semibold text-rose-300">{title}</p>
        {description && (
          <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 self-center">{action}</div>
    </div>
  );
}

export default SubShell;