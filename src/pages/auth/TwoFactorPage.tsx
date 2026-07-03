/** @doc Set up and manage two-factor authentication. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Shield, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSettingsLayout } from "@/components/settings/DesktopSettingsLayout";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";
import {
  INK,
  MINT,
  LAVENDER,
  PINK,
  SURFACE,
  BORDER,
  TEXT,
  MUTED,
  PAGE_BG,
} from "@/pages/billing/ReferralsPage";

type Step = "loading" | "status" | "enroll" | "verify";

const TwoFactorPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>("loading");
  const [factors, setFactors] = useState<any[]>([]);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = (data?.totp || []).filter((f: any) => f.status === "verified");
      setFactors(totp);
      setStep("status");
    } catch (e: any) {
      toast.error(sanitizeErrorMessage(e, "Failed to load 2FA status"));
      setStep("status");
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    try {
      // Clean up any unverified factors first
      const { data: list } = await supabase.auth.mfa.listFactors();
      const unverified = (list?.totp || []).filter((f: any) => f.status !== "verified");
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${Date.now()}`,
      });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enroll");
    } catch (e: any) {
      toast.error(sanitizeErrorMessage(e, "Failed to start 2FA setup"));
    } finally {
      setBusy(false);
    }
  };

  const verifyEnroll = async () => {
    if (!factorId || otp.length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: ch.id,
        code: otp,
      });
      if (vErr) throw vErr;
      // Mirror flag in profile for UI display
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc("update_profile_safe", {
          p_user_id: user.id,
          p_two_factor_enabled: true,
        });
      }
      toast.success("Two-factor authentication enabled");
      setOtp("");
      setFactorId(null);
      setQr("");
      setSecret("");
      await loadFactors();
    } catch (e: any) {
      toast.error(sanitizeErrorMessage(e, "Invalid code"));
    } finally {
      setBusy(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm("Disable two-factor authentication?")) return;
    setBusy(true);
    try {
      const { data: list } = await supabase.auth.mfa.listFactors();
      const all = [...(list?.totp || []), ...((list as any)?.phone || [])];
      for (const f of all) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc("update_profile_safe", {
          p_user_id: user.id,
          p_two_factor_enabled: false,
        });
      }
      toast.success("Two-factor authentication disabled");
      await loadFactors();
    } catch (e: any) {
      toast.error(sanitizeErrorMessage(e, "Failed to disable 2FA"));
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const Content = () => (
    <>
      {step === "loading" && (
        <div className="text-center py-12 text-sm" style={{ color: MUTED }}>
          Loading…
        </div>
      )}

      {step === "status" && (
        <div className="space-y-4">
          <div
            className="rounded-[24px] p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor: factors.length ? MINT : LAVENDER,
              border: `2.5px solid ${INK}`,
              boxShadow: `4px 4px 0 ${INK}`,
            }}
          >
            <Shield className="w-16 h-16" strokeWidth={2} style={{ color: INK }} />
            <p
              className="mt-3 text-[11px] uppercase tracking-wider"
              style={{ fontWeight: 800, color: INK, opacity: 0.7 }}
            >
              Status
            </p>
            <p className="mt-1 text-[18px]" style={{ fontWeight: 900, color: INK }}>
              {factors.length ? "Enabled" : "Disabled"}
            </p>
            <p
              className="mt-2 text-[13px] max-w-sm"
              style={{ fontWeight: 600, color: INK, opacity: 0.8 }}
            >
              {factors.length
                ? "Your account is protected with an authenticator app. You'll be asked for a code at sign in."
                : "Add an extra layer of security using an authenticator app like Google Authenticator, 1Password, or Authy."}
            </p>
          </div>

          {factors.length ? (
            <button
              onClick={disable2FA}
              disabled={busy}
              className="w-full py-3.5 rounded-full text-[14px] disabled:opacity-50"
              style={{
                backgroundColor: PINK,
                color: INK,
                fontWeight: 900,
                border: `2.5px solid ${INK}`,
                boxShadow: `4px 4px 0 ${INK}`,
              }}
            >
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          ) : (
            <button
              onClick={startEnroll}
              disabled={busy}
              className="w-full py-3.5 rounded-full text-[14px] disabled:opacity-50"
              style={{
                backgroundColor: MINT,
                color: INK,
                fontWeight: 900,
                border: `2.5px solid ${INK}`,
                boxShadow: `4px 4px 0 ${INK}`,
              }}
            >
              {busy ? "Preparing…" : "Enable 2FA"}
            </button>
          )}
        </div>
      )}

      {step === "enroll" && (
        <div className="space-y-4">
          <div
            className="rounded-[24px] p-5 text-center"
            style={{ backgroundColor: SURFACE, border: `2px solid ${BORDER}` }}
          >
            <p className="text-[13px]" style={{ color: TEXT, fontWeight: 700 }}>
              1. Scan the QR code with your authenticator app
            </p>
            {qr && (
              <div
                className="mt-3 inline-block p-3 rounded-2xl bg-white"
                style={{ border: `2px solid ${INK}` }}
              >
                <img src={qr} alt="2FA QR" width={200} height={200} />
              </div>
            )}
            <p
              className="mt-3 text-[11px] uppercase tracking-wider"
              style={{ color: MUTED, fontWeight: 800 }}
            >
              Or enter this key manually
            </p>
            <button
              onClick={copySecret}
              className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-mono"
              style={{
                backgroundColor: PAGE_BG,
                border: `2px solid ${BORDER}`,
                color: TEXT,
                fontWeight: 700,
              }}
            >
              {secret}
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div
            className="rounded-[24px] p-5"
            style={{ backgroundColor: SURFACE, border: `2px solid ${BORDER}` }}
          >
            <p className="text-[13px]" style={{ color: TEXT, fontWeight: 700 }}>
              2. Enter the 6-digit code from your app
            </p>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verifyEnroll()}
              placeholder="000000"
              className="mt-3 w-full px-4 py-3 rounded-2xl text-center text-[20px] tracking-[0.5em] outline-none"
              style={{
                backgroundColor: PAGE_BG,
                border: `2px solid ${BORDER}`,
                color: TEXT,
                fontWeight: 800,
              }}
            />
          </div>

          <button
            onClick={verifyEnroll}
            disabled={busy || otp.length !== 6}
            className="w-full py-3.5 rounded-full text-[14px] disabled:opacity-50"
            style={{
              backgroundColor: MINT,
              color: INK,
              fontWeight: 900,
              border: `2.5px solid ${INK}`,
              boxShadow: `4px 4px 0 ${INK}`,
            }}
          >
            {busy ? "Verifying…" : "Verify & Enable"}
          </button>
          <button
            onClick={async () => {
              if (factorId) await supabase.auth.mfa.unenroll({ factorId });
              setFactorId(null);
              setQr("");
              setSecret("");
              setOtp("");
              setStep("status");
            }}
            className="w-full py-3 rounded-full text-[13px]"
            style={{
              backgroundColor: SURFACE,
              color: TEXT,
              fontWeight: 700,
              border: `1.5px solid ${BORDER}`,
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );

  if (!isMobile) {
    return (
      <DesktopSettingsLayout
        title="Two-Factor Authentication"
        subtitle="Protect your account with an authenticator app"
      >
        <div className="max-w-md mx-auto">{Content()}</div>
      </DesktopSettingsLayout>
    );
  }

  return (
    <div
      className="relative min-h-[100dvh] overflow-y-auto"
      style={{ backgroundColor: PAGE_BG, color: TEXT }}
    >
      <header
        className="sticky top-0 z-10"
        style={{
          backgroundColor: `${PAGE_BG}E6`,
          backdropFilter: "saturate(160%) blur(18px)",
          WebkitBackdropFilter: "saturate(160%) blur(18px)",
          borderBottom: `1.5px solid ${BORDER}`,
        }}
      >
        <div className="max-w-lg mx-auto px-5 flex items-center justify-between py-3 safe-top">
          <button
            onClick={() => navigate("/settings/profile")}
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ backgroundColor: SURFACE, border: `2px solid ${BORDER}`, color: TEXT }}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px]" style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
            Two-Factor Auth
          </h1>
          <div className="w-10" />
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 pb-12 safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4"
        >
          {Content()}
        </motion.div>
      </div>
    </div>
  );
};

export default TwoFactorPage;
