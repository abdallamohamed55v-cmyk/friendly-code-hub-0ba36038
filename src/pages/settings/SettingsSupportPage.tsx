/** @doc Support hub — entry point to the help center, AI support and human contact. */
import { useNavigate } from "react-router-dom";
import { HelpCircle, MessageSquare, Mail } from "lucide-react";
import { SubShell, SubSection, SubRowList, SubRow, SubStatStrip } from "@/components/settings/SubShell";

const options = [
  {
    icon: HelpCircle,
    title: "Help Center",
    desc: "Curated guides for every page and every feature.",
    path: "/settings/support/help",
  },
  {
    icon: MessageSquare,
    title: "Ask AI",
    desc: "Instant answers from Megsy's support assistant.",
    path: "/support",
  },
  {
    icon: Mail,
    title: "Write to a human",
    desc: "A member of our team replies by email within 24 hours.",
    path: "/settings/support/contact",
  },
];

export default function SettingsSupportPage() {
  const navigate = useNavigate();

  return (
    <SubShell
      title="Help & Support"
      subtitle="Find answers in the help center, ask our AI assistant, or write to a human — we reply within 24 hours."
      backTo="/settings"
    >
      <SubSection title="Overview" description="Support channels and typical response times.">
        <SubStatStrip
          items={[
            { label: "Reply time", value: "< 24h", sub: "Rolling 30 days" },
            { label: "Channels", value: `${options.length}`, sub: "Docs, AI, human" },
            { label: "Direct", value: "Email", sub: "support@megsyai.com" },
            { label: "Coverage", value: "Global", sub: "All timezones" },
          ]}
        />
      </SubSection>

      <SubSection title="Get help" description="Pick a channel that matches your question.">
        <SubRowList>
          {options.map((opt) => (
            <SubRow
              key={opt.title}
              label={opt.title}
              hint={opt.desc}
              icon={opt.icon}
              onClick={() => navigate(opt.path)}
            />
          ))}
        </SubRowList>
      </SubSection>

      <SubSection title="Direct" description="Reach out any time — no bots, no templates.">
        <SubRowList>
          <SubRow
            label="support@megsyai.com"
            hint="Email us directly"
            icon={Mail}
            onClick={() => (window.location.href = "mailto:support@megsyai.com")}
          />
          <SubRow
            label="Documentation"
            hint="Every feature, deeply explained"
            icon={HelpCircle}
            onClick={() => navigate("/docs")}
          />
        </SubRowList>
      </SubSection>
    </SubShell>
  );
}
