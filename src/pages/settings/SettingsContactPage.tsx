/** @doc Contact — send a support message on the unified SubShell design. */
import { useState, useEffect } from "react";
import { Loader2, Send, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SubShell, SubSection, SubCard, SubStatStrip } from "@/components/settings/SubShell";

export default function SettingsContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email || "");
      const meta = (u.user_metadata as any) || {};
      setName(meta.full_name || meta.name || u.email?.split("@")[0] || "");
    });
  }, []);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in name, email and message");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim() || null,
      message: message.trim(),
      form_type: "support",
    });
    setSending(false);
    if (error) {
      toast.error("Failed to send. Please try again.");
      return;
    }
    toast.success("Message sent. We'll reply by email within 24h.");
    setSubject("");
    setMessage("");
  };

  const inputCls =
    "w-full rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40 transition";

  return (
    <SubShell
      title="Contact support"
      subtitle="Write to a real person from our team — we reply by email within 24 hours."
      backTo="/settings/support"
    >
      <SubSection title="Overview" description="How and when we respond.">
        <SubStatStrip
          items={[
            { label: "Reply time", value: "< 24h", sub: "By email" },
            { label: "Team", value: "Human", sub: "No bots" },
            { label: "Direct", value: "Email", sub: "support@megsyai.com" },
            { label: "Coverage", value: "Global", sub: "All timezones" },
          ]}
        />
      </SubSection>

      <SubSection title="Direct line" description="Prefer email? Reach out directly.">
        <SubCard>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-foreground/[0.06] text-foreground/80 shrink-0">
              <Mail className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-medium text-foreground">support@megsyai.com</p>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                Every message lands in a shared team inbox.
              </p>
            </div>
            <a
              href="mailto:support@megsyai.com"
              className="text-[12px] text-muted-foreground hover:text-foreground transition"
            >
              Open →
            </a>
          </div>
        </SubCard>
      </SubSection>

      <SubSection title="Send a message" description="Tell us what's happening. We'll follow up by email.">
        <SubCard>
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 block mb-1.5">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 block mb-1.5">
                Your email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 block mb-1.5">
                Subject (optional)
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Billing question"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 block mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Tell us what's happening…"
                className={`${inputCls} resize-none`}
              />
            </div>
            <button
              onClick={submit}
              disabled={sending}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background text-[14px] font-medium py-2.5 hover:opacity-90 disabled:opacity-60 transition"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        </SubCard>
      </SubSection>
    </SubShell>
  );
}
