/** @doc Help center — searchable FAQ grouped by topic on the unified SubShell design. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { SubShell, SubSection, SubCard } from "@/components/settings/SubShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    title: "Getting started",
    items: [
      { q: "What is Megsy?", a: "Megsy is an all-in-one AI creative platform — chat, images, videos, websites/code, presentations, and file analysis, all running on Megsy Credits (MC)." },
      { q: "How do credits (MC) work?", a: "Every action consumes MC. Chat costs 1 MC, images start at 2 MC, videos at 8 MC, and Build projects vary by complexity. Your balance is shown in Settings → Billing." },
      { q: "How do I sign in?", a: "Go to /auth and sign in with email or Google. Forgot your password? Use the recovery link on the login screen." },
      { q: "Free vs paid plans", a: "Free includes a starter credit allowance. Paid plans (Starter, Pro, Elite, Enterprise) add monthly MC, faster models, and team features. Compare at /pricing." },
    ],
  },
  {
    title: "Chat",
    items: [
      { q: "How do I start a chat?", a: "Open /chat and type your prompt. You can attach files, enable web search, switch models, and pick agents from the composer." },
      { q: "Can Megsy remember things about me?", a: "Yes — important details are saved in Memory. Manage them from Settings → Memory." },
      { q: "How do I share a conversation?", a: "Open any chat → menu → Share. A read-only public link is created. You can revoke it anytime." },
      { q: "What is Deep Research?", a: "An agent that runs multi-source web research and returns a structured report with citations." },
      { q: "What is Slides mode?", a: "Generates a full editable presentation from a prompt. Export to PPTX from the slide deck view." },
    ],
  },
  {
    title: "Images & Video",
    items: [
      { q: "How do I generate an image?", a: "Open Media → Image Studio, pick a model, write your prompt, choose ratio and quality, then generate." },
      { q: "How do I generate a video?", a: "Open Media → Video Studio, pick a model, optionally upload a starting image, write your prompt, and generate." },
      { q: "What is Lip Sync?", a: "Upload a portrait video and an audio file, and Megsy syncs the mouth movements to the audio." },
      { q: "Can I edit a generated image?", a: "Yes — open the image and use the edit tools (inpaint, upscale, background remove). Each edit costs MC." },
      { q: "Where are my generations saved?", a: "Everything you generate lives in your Library, scoped to your account or active workspace." },
    ],
  },
  {
    title: "Build (websites & apps)",
    items: [
      { q: "How do I start a project?", a: "Open /build, describe what you want, and Megsy scaffolds a working project you can iterate on with chat." },
      { q: "Can I preview my project?", a: "Yes — every project has a live preview pane that updates as the AI edits files." },
      { q: "How do I publish a project?", a: "Open the project → Publish. You get a free megsy.app subdomain, or connect a custom domain from project Settings." },
      { q: "Can I connect a database?", a: "Yes — projects can use Lovable Cloud for auth, database, storage, and edge functions." },
    ],
  },
  {
    title: "Workspaces",
    items: [
      { q: "What is a workspace?", a: "A shared space for teams. Members share credits and content. Switch from the account switcher in Settings." },
      { q: "How do I invite a member?", a: "Settings → Workspaces → pick a workspace → Members → Invite by email or shareable link." },
      { q: "What are roles?", a: "Owner controls billing, Admin manages members and content, Member can create and edit, Viewer is read-only." },
      { q: "How do credits work in a workspace?", a: "Workspace credits are a shared pool. Personal credits stay separate." },
    ],
  },
  {
    title: "Billing & Plans",
    items: [
      { q: "How do I buy credits?", a: "Settings → Billing → Buy credits. You can pay with card or supported local methods." },
      { q: "How do I upgrade my plan?", a: "Visit /pricing and choose a plan. Upgrades take effect immediately and unused credits roll over." },
      { q: "How do I cancel?", a: "Settings → Billing → Manage subscription → Cancel. You keep access until the end of the billing period." },
      { q: "Do you offer refunds?", a: "Yes within 14 days for unused credits. Contact our team from Help & Support → Contact our team." },
      { q: "Can I get an invoice?", a: "Invoices are emailed automatically and also available in Settings → Billing → History." },
    ],
  },
  {
    title: "Integrations & API",
    items: [
      { q: "Which integrations are available?", a: "Settings → Integrations lists every connector. Connect once to use across chat and Build." },
      { q: "How do I get an API key?", a: "Visit api.megsyai.com → Dashboard → API keys. Each call consumes MC from the key's workspace." },
      { q: "What models are exposed via API?", a: "All chat, image, video, and embedding models. See docs at api.megsyai.com/docs." },
    ],
  },
  {
    title: "Settings & Privacy",
    items: [
      { q: "Where do I change my email or password?", a: "Settings → Account → Change email / Change password." },
      { q: "How do I delete my account?", a: "Settings → Account → Delete account. This is irreversible and wipes all personal data within 30 days." },
      { q: "How do I export my data?", a: "Settings → Privacy & Data → Export." },
      { q: "Is my data used for training?", a: "No. Your prompts and outputs are never used to train models." },
      { q: "How do I enable two-factor auth?", a: "Settings → Account → Security → Enable 2FA. Use any TOTP app like 1Password or Authy." },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      { q: "A generation failed — am I charged?", a: "No. Failed generations are automatically refunded within a few minutes." },
      { q: "The app feels slow", a: "Check status.megsyai.com for incidents. Try a hard refresh, then sign out and back in." },
      { q: "I can't sign in", a: "Use the password reset link, check for typos in your email, and make sure cookies aren't blocked." },
      { q: "Where do I report a bug?", a: "Help & Support → Contact our team. Include screenshots and the URL where it happened." },
    ],
  },
];

export default function SettingsHelpPage() {
  const [query, setQuery] = useState("");

  const filtered = sections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((it) =>
        (it.q + " " + it.a).toLowerCase().includes(query.trim().toLowerCase()),
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <SubShell
      title="Help Center"
      subtitle="Guides and answers for every corner of Megsy. Search or scroll through the topics below."
      backTo="/settings/support"
    >
      <SubSection title="Search" description="Find an answer across every topic.">
        <div className="rounded-2xl border border-border/70 bg-card/40 flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className="flex-1 bg-transparent text-[14px] outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </SubSection>

      <SubSection title="Full documentation" description="Deep dives into every feature.">
        <Link
          to="/docs"
          className="rounded-2xl border border-border/70 bg-card/40 flex items-center gap-3 px-4 py-3.5 transition hover:bg-foreground/[0.03]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-foreground/[0.06] text-foreground/80 shrink-0">
            <BookOpen className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-medium text-foreground">Read the full docs</p>
            <p className="text-[12.5px] mt-0.5 text-muted-foreground">
              Every feature, deeply explained
            </p>
          </div>
          <span className="text-[12px] text-muted-foreground">Open →</span>
        </Link>
      </SubSection>

      {filtered.map((sec) => (
        <SubSection key={sec.title} title={sec.title}>
          <SubCard flush>
            <Accordion type="single" collapsible>
              {sec.items.map((it, i) => (
                <AccordionItem
                  key={i}
                  value={`${sec.title}-${i}`}
                  className={i > 0 ? "border-t border-border/60" : "border-0"}
                >
                  <AccordionTrigger className="text-[14px] font-medium text-foreground hover:no-underline px-4 py-3.5">
                    {it.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground px-4 pb-3.5">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SubCard>
        </SubSection>
      ))}

      {filtered.length === 0 && (
        <SubSection title="No matches">
          <SubCard>
            <div className="text-center py-6">
              <p className="text-[14px] font-semibold text-foreground">Nothing found</p>
              <p className="text-[12.5px] mt-1 text-muted-foreground">
                Try a different keyword.
              </p>
            </div>
          </SubCard>
        </SubSection>
      )}
    </SubShell>
  );
}
