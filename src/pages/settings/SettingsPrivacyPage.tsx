/** @doc Privacy & Data — review policies, manage stored data, and delete account. */
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Globe, EyeOff, ExternalLink, FileText, Cookie, Brain, Mail, KeyRound } from "lucide-react";
import {
  SubShell,
  SubSection,
  SubStatStrip,
  SubRowList,
  SubRow,
  DangerCallout,
} from "@/components/settings/SubShell";

const trustStats: { label: string; value: string; sub?: string }[] = [
  { label: "At rest", value: "AES-256", sub: "Storage encryption" },
  { label: "In transit", value: "TLS 1.3", sub: "Network encryption" },
  { label: "Residency", value: "EU + US", sub: "Data regions" },
  { label: "Training", value: "Opt-out", sub: "Your data, your choice" },
];

const links = [
  {
    title: "Privacy Policy",
    desc: "How we collect and use your data",
    href: "https://privacy.megsyai.com",
    external: true,
    icon: FileText,
  },
  {
    title: "Terms of Service",
    desc: "The rules for using Megsy",
    href: "https://terms.megsyai.com",
    external: true,
    icon: FileText,
  },
  {
    title: "Cookie Policy",
    desc: "Which cookies we use and why",
    href: "/cookies",
    external: false,
    icon: Cookie,
  },
];

const actions = [
  { title: "Memory", desc: "View or clear what Megsy remembers", path: "/settings/memory", icon: Brain },
  { title: "Change email", desc: "Update your account email", path: "/settings/change-email", icon: Mail },
  { title: "Change password", desc: "Set a new password", path: "/settings/change-password", icon: KeyRound },
];

export default function SettingsPrivacyPage() {
  const navigate = useNavigate();

  return (
    <SubShell
      title="Privacy & Data"
      subtitle="Review our policies, manage what we store about you, and permanently delete your account when you're done."
      backTo="/settings"
    >
      <SubSection title="Trust primitives" description="How your data is protected in transit, at rest, and in training.">
        <SubStatStrip items={trustStats} />
      </SubSection>

      <SubSection title="Policies" description="Everything we publish about how Megsy handles data.">
        <SubRowList>
          {links.map((l) => (
            <SubRow
              key={l.title}
              label={l.title}
              hint={l.desc}
              icon={l.icon}
              trailing={
                l.external ? (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                ) : undefined
              }
              onClick={() =>
                l.external ? window.open(l.href, "_blank") : navigate(l.href)
              }
            />
          ))}
        </SubRowList>
      </SubSection>

      <SubSection title="Your data" description="Manage what Megsy remembers about you and your account credentials.">
        <SubRowList>
          {actions.map((a) => (
            <SubRow
              key={a.title}
              label={a.title}
              hint={a.desc}
              icon={a.icon}
              onClick={() => navigate(a.path)}
            />
          ))}
        </SubRowList>
      </SubSection>

      <SubSection title="Danger zone" description="Permanent actions that cannot be undone.">
        <DangerCallout
          title="Delete account"
          description="Permanent. All personal data is wiped within 30 days."
          action={
            <button
              onClick={() => navigate("/settings/delete-account")}
              className="shrink-0 h-9 px-4 text-[13px] font-medium rounded-full border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 transition"
            >
              Continue
            </button>
          }
        />
      </SubSection>
    </SubShell>
  );
}
