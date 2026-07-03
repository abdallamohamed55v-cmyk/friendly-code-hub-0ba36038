import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Github } from "lucide-react";
import Claude from "@lobehub/icons/es/Claude";
import OpenAI from "@lobehub/icons/es/OpenAI";
import Gemini from "@lobehub/icons/es/Gemini";
import Grok from "@lobehub/icons/es/Grok";
import Kling from "@lobehub/icons/es/Kling";
import c1 from "@/assets/auth/collage/c1.jpg";
import c3 from "@/assets/auth/collage/c3.jpg";
import c6 from "@/assets/auth/collage/c6.jpg";
import { useBrandLogo } from "@/hooks/useBrandLogo";

type Screen = "intro" | "email";

interface Props {
  screen: Screen;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isSubmitting: boolean;
  showPasswordField: boolean;
  onNextIntro: () => void;
  onStartCreating: () => void;
  onGoogle: () => void;
  onGitHub: () => void;
  onEmail: () => void;
  onBack: () => void;
  onSubmitEmail: () => void;
  onSubmitPassword: () => void;
  onForgotPassword: () => void;
  onSwitchToCreate: () => void;
}

const Backdrop = () => (
  <>
    <div className="auth-bg absolute inset-0" aria-hidden />
    <div className="auth-stars absolute inset-0" aria-hidden />
    <div className="auth-bg-grain absolute inset-0" aria-hidden />
  </>
);

const TopBar = ({ onBack, showBack }: { onBack?: () => void; showBack?: boolean }) => (
  <div className="relative z-10 px-5 pt-4 flex items-center justify-between safe-top">
    {showBack ? (
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-10 h-10 rounded-full bg-brand-action border-[2.5px] border-brand-ink grid place-items-center text-brand-ink shadow-[2px_2px_0_rgba(59,130,246,0.32)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
      </button>
    ) : (
      <div className="w-10 h-10" />
    )}
    <div className="flex items-center">
      <span className="text-[17px] font-black tracking-tight text-brand-parchment">Megsy AI</span>
    </div>
    <div className="w-10 h-10" />
  </div>
);

export default function MobileAuthFlow(p: Props) {
  const megsyIconUrl = useBrandLogo();
  const primaryBtn =
    "w-full py-3.5 rounded-full bg-brand-action text-brand-ink text-[14.5px] font-black border-[2.5px] border-brand-ink shadow-[3px_3px_0_rgba(59,130,246,0.32)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50";
  const secondaryBtn =
    "w-full py-3.5 rounded-full bg-surface-1 text-brand-parchment text-[14px] font-black border-[2.5px] border-brand-ink shadow-[2px_2px_0_rgba(59,130,246,0.22)] flex items-center justify-center gap-2.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all";

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black text-white">
      <Backdrop />

      <AnimatePresence mode="wait">
        {/* ───── Screen 1: Intro / large stacked cards ───── */}
        {p.screen === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 flex flex-col min-h-[100dvh]"
          >
            <TopBar />

            <div className="px-5 mt-16 grid grid-cols-3 gap-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] translate-y-3"
              >
                <img src={c6} alt="" className="w-full h-full object-cover" loading="lazy" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/30 shadow-[0_28px_56px_-14px_rgba(0,0,0,0.7)]"
              >
                <img src={c1} alt="" className="w-full h-full object-cover" loading="lazy" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] translate-y-3"
              >
                <img src={c3} alt="" className="w-full h-full object-cover" loading="lazy" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="px-5 mt-6 text-center"
            >
              <h1 className="text-[34px] leading-[1.05] font-black tracking-tight text-brand-parchment">
                One subscription.
                <br />
                <span className="text-brand-parchment">Every frontier model.</span>
              </h1>
              <p className="mt-3 text-[15px] text-white/90 leading-relaxed max-w-[340px] mx-auto">
                Chat, images, video, slides, code and deep research — in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-5 px-6"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                {/* Claude */}
                <Claude.Color size={24} className="h-6 w-6" aria-label="Claude" />
                {/* OpenAI */}
                <OpenAI size={24} color="#10A37F" className="h-6 w-6" aria-label="OpenAI" />
                {/* Gemini */}
                <Gemini.Color size={24} className="h-6 w-6" aria-label="Gemini" />
                {/* Grok */}
                <Grok size={24} color="#FFFFFF" className="h-6 w-6" aria-label="Grok" />
                {/* Kling */}
                <Kling.Color size={24} className="h-6 w-6" aria-label="Kling" />
                {/* Megsy — white transparent glyph */}
                <img
                  src={megsyIconUrl}
                  alt="Megsy"
                  className="h-6 w-6"
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
                />
              </div>
            </motion.div>

            <div className="mt-auto px-6 pt-2 pb-7 safe-bottom space-y-2.5 relative">
              <button onClick={p.onStartCreating} className={primaryBtn}>
                Sign in with Email
              </button>

              <button onClick={p.onGoogle} className={secondaryBtn}>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <button onClick={p.onGitHub} className={secondaryBtn}>
                <Github className="w-[18px] h-[18px]" />
                Continue with GitHub
              </button>
            </div>
          </motion.div>
        )}

        {/* ───── Screen 3: Email ───── */}
        {p.screen === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 flex flex-col min-h-[100dvh]"
          >
            <TopBar showBack onBack={p.onBack} />

            <div className="flex-1 flex flex-col justify-center px-6 -mt-8">
              <div className="text-center">
                <h1 className="text-[28px] font-black tracking-tight text-brand-parchment">
                  Continue with email
                </h1>
                <p className="mt-2 text-[13px] text-brand-muted">
                  Sign in to access your AI-powered creations.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (p.showPasswordField) p.onSubmitPassword();
                  else p.onSubmitEmail();
                }}
                className="mt-7 space-y-4 w-full max-w-sm mx-auto"
              >
                <div>
                  <label className="block text-[11px] text-brand-muted mb-2 px-1 font-black uppercase tracking-wider">
                    Email
                  </label>
                  <div className="rounded-2xl bg-surface-1 border-[2.5px] border-brand-ink shadow-[2px_2px_0_rgba(59,130,246,0.22)] px-4 py-3.5">
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={p.email}
                      onChange={(e) => p.setEmail(e.target.value)}
                      disabled={p.showPasswordField}
                      className="w-full bg-transparent outline-none text-[15px] text-brand-parchment placeholder:text-[#5A5A5A] disabled:opacity-70"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {p.showPasswordField && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <label className="block text-[11px] text-brand-muted mb-2 px-1 font-black uppercase tracking-wider">
                        Password
                      </label>
                      <div className="rounded-2xl bg-surface-1 border-[2.5px] border-brand-ink shadow-[2px_2px_0_rgba(59,130,246,0.22)] px-4 py-3.5 flex items-center gap-2">
                        <input
                          type={p.showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••••"
                          value={p.password}
                          onChange={(e) => p.setPassword(e.target.value)}
                          autoFocus
                          className="flex-1 bg-transparent outline-none text-[15px] text-brand-parchment placeholder:text-[#5A5A5A]"
                        />
                        <button
                          type="button"
                          onClick={() => p.setShowPassword(!p.showPassword)}
                          className="text-brand-action hover:text-brand-action/90"
                        >
                          {p.showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={p.onForgotPassword}
                          className="text-[12px] text-brand-action font-bold underline underline-offset-4"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={p.isSubmitting || !p.email}
                  className={`${primaryBtn} flex items-center justify-center gap-2 disabled:opacity-50`}
                >
                  {p.isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-brand-ink border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {p.showPasswordField ? "Sign In" : "Continue"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
