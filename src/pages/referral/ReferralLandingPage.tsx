/** @doc Public referral landing — explains how the program works. */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RefInfo {
  displayName: string;
  avatarUrl: string | null;
}

const ReferralLandingPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [info, setInfo] = useState<RefInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    const clean = code.trim().toUpperCase().slice(0, 64);
    (async () => {
      try {
        const { data: codeRow } = await supabase
          .from("referral_codes")
          .select("user_id")
          .ilike("code", clean)
          .maybeSingle();
        if (codeRow?.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", codeRow.user_id)
            .maybeSingle();
          setInfo({
            displayName: profile?.display_name || "A friend",
            avatarUrl: profile?.avatar_url || null,
          });
        } else {
          setInfo({ displayName: "A friend", avatarUrl: null });
        }
      } catch {
        setInfo({ displayName: "A friend", avatarUrl: null });
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const join = () => {
    if (code) navigate(`/ref/${code}`);
  };
  const initials = (info?.displayName || "A").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.25), transparent 70%), radial-gradient(50% 40% at 50% 100%, hsl(var(--primary) / 0.15), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <main className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-10">
        {/* Brand */}
        <div className="flex items-center justify-center pt-2">
          <span className="text-[13px] font-semibold tracking-tight text-muted-foreground">
            Megsy <span className="text-foreground">AI</span>
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {/* Avatar */}
          <div className="relative mb-6">
            <div
              aria-hidden
              className="absolute -inset-2 rounded-full blur-xl"
              style={{ background: "hsl(var(--primary) / 0.45)" }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-card text-2xl font-semibold text-foreground ring-1 ring-border">
              {info?.avatarUrl ? (
                <img
                  src={info.avatarUrl}
                  alt={info.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{info?.displayName}</span> invited you
          </p>

          {/* Headline */}
          <h1 className="mt-5 text-[34px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-[44px]">
            Join Megsy AI
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
            One workspace for chat, images, video, code and research — powered by the best AI
            models.
          </p>

          {/* Gift card */}
          <div
            className="mt-8 w-full rounded-2xl p-5 ring-1 ring-border backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(160deg, hsl(var(--card) / 0.9) 0%, hsl(var(--muted) / 0.6) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Welcome gift
              </span>
              <span
                dir="ltr"
                className="rounded-full px-2.5 py-0.5 font-mono text-[11px] text-primary-foreground"
                style={{ background: "hsl(var(--primary))" }}
              >
                {code}
              </span>
            </div>
            <p className="mt-3 text-[15px] font-medium text-foreground">
              Get{" "}
              <span style={{ color: "hsl(var(--primary))" }} className="font-semibold">
                15 free credits
              </span>{" "}
              when you sign up
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={join}
            className="mt-6 w-full rounded-2xl py-4 text-[14px] font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 100%)",
              boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.6)",
            }}
          >
            Accept invite & continue
          </button>

          <p className="mt-4 text-[11px] text-muted-foreground">
            No credit card required · Cancel anytime
          </p>
        </div>
      </main>
    </div>
  );
};

export default ReferralLandingPage;
