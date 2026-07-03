import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRef } from "react";

type ExtraScreen =
  | "otp-signup"
  | "otp-2fa"
  | "otp-reset"
  | "set-password"
  | "reset-password"
  | "forgot-password";

interface Props {
  screen: ExtraScreen;
  email: string;
  otpValues: string[];
  onOtpChange: (i: number, v: string) => void;
  onOtpKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>, i: number) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  isSubmitting: boolean;
  countdown: number;
  onResendOtp: () => void;
  onSubmitSetPassword: () => void;
  onSubmitResetPassword: () => void;
  onSubmitForgotPassword: () => void;
  onBack: () => void;
}

const Backdrop = () => (
  <>
    <div className="auth-bg absolute inset-0" aria-hidden />
    <div className="auth-stars absolute inset-0" aria-hidden />
    <div className="auth-bg-grain absolute inset-0" aria-hidden />
  </>
);

const TopBar = ({ onBack }: { onBack: () => void }) => (
  <div className="relative z-10 px-5 pt-4 flex items-center justify-between safe-top">
    <button
      onClick={onBack}
      aria-label="Back"
      className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 grid place-items-center text-white active:scale-95 transition-transform"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
    <span className="text-[17px] font-bold tracking-tight text-white drop-shadow-sm">Megsy AI</span>
    <div className="w-9 h-9" />
  </div>
);

const gradientBtn =
  "w-full py-4 rounded-full text-white text-[15px] font-semibold active:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-50";
const gradientStyle = {
  background:
    "linear-gradient(90deg,hsl(var(--brand-charcoal)) 0%,hsl(var(--brand-slate)) 50%,hsl(var(--brand-silver)) 100%)",
};

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
);

const META: Record<ExtraScreen, { title: string; sub: (email: string) => string; cta: string }> = {
  "otp-signup": {
    title: "Verify your email",
    sub: (e) => `We sent a 6-digit code to ${e}`,
    cta: "Verify",
  },
  "otp-2fa": {
    title: "Two-factor verification",
    sub: (e) => `Enter the code sent to ${e}`,
    cta: "Verify",
  },
  "otp-reset": {
    title: "Verify your email",
    sub: (e) => `Enter the code sent to ${e}`,
    cta: "Verify",
  },
  "set-password": {
    title: "Set a password",
    sub: () => "At least 8 characters.",
    cta: "Create account",
  },
  "reset-password": {
    title: "Choose a new password",
    sub: () => "At least 8 characters.",
    cta: "Reset password",
  },
  "forgot-password": {
    title: "Reset your password",
    sub: (e) => `We'll send a verification code to ${e}`,
    cta: "Send code",
  },
};

export default function MobileAuthExtras(p: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const meta = META[p.screen];
  const isOtp = p.screen.startsWith("otp-");
  const isPwd = p.screen === "set-password" || p.screen === "reset-password";

  const submit = () => {
    if (p.screen === "set-password") p.onSubmitSetPassword();
    else if (p.screen === "reset-password") p.onSubmitResetPassword();
    else if (p.screen === "forgot-password") p.onSubmitForgotPassword();
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black text-white">
      <Backdrop />
      <AnimatePresence mode="wait">
        <motion.div
          key={p.screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex flex-col min-h-[100dvh]"
        >
          <TopBar onBack={p.onBack} />

          <div className="flex-1 flex flex-col justify-center px-6 -mt-8">
            <div className="text-center">
              <h1 className="text-[28px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                {meta.title}
              </h1>
              <p className="mt-2 text-[13px] text-white/85 break-words">{meta.sub(p.email)}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isPwd || p.screen === "forgot-password") submit();
              }}
              className="mt-7 space-y-4 w-full max-w-sm mx-auto"
            >
              {isOtp && (
                <div className="flex justify-center gap-2 mt-2">
                  {p.otpValues.map((v, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={(e) => {
                        p.onOtpChange(i, e.target.value);
                        if (e.target.value && i < 5) inputRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        p.onOtpKeyDown(i, e);
                        if (e.key === "Backspace" && !p.otpValues[i] && i > 0)
                          inputRefs.current[i - 1]?.focus();
                      }}
                      onPaste={(e) => p.onOtpPaste(e, i)}
                      autoFocus={i === 0}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-[20px] font-semibold rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/30 text-white outline-none focus:border-white/70 transition-colors"
                      style={{ height: 56 }}
                    />
                  ))}
                </div>
              )}

              {isPwd && (
                <div>
                  <label className="block text-[12px] text-white mb-2 px-1 font-medium">
                    New password
                  </label>
                  <div className="rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/30 px-4 py-3.5 flex items-center gap-2">
                    <input
                      type={p.showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={p.newPassword}
                      onChange={(e) => p.setNewPassword(e.target.value)}
                      autoFocus
                      className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/50"
                    />
                    <button
                      type="button"
                      onClick={() => p.setShowNewPassword(!p.showNewPassword)}
                      className="text-white/80 hover:text-white"
                    >
                      {p.showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {p.screen === "forgot-password" && (
                <div>
                  <label className="block text-[12px] text-white mb-2 px-1 font-medium">
                    Email
                  </label>
                  <div className="rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/30 px-4 py-3.5">
                    <input
                      type="email"
                      value={p.email}
                      disabled
                      className="w-full bg-transparent outline-none text-[15px] text-white/80"
                    />
                  </div>
                </div>
              )}

              {!isOtp && (
                <button
                  type="submit"
                  disabled={p.isSubmitting}
                  className={gradientBtn}
                  style={gradientStyle}
                >
                  {p.isSubmitting ? (
                    <Spinner />
                  ) : (
                    <>
                      {meta.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {isOtp && (
                <div className="text-center pt-2">
                  {p.countdown > 0 ? (
                    <p className="text-[12px] text-white/70">Resend code in {p.countdown}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={p.onResendOtp}
                      disabled={p.isSubmitting}
                      className="text-[13px] text-white underline underline-offset-2 disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                  {p.isSubmitting && (
                    <div className="mt-3 flex justify-center">
                      <Spinner />
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
