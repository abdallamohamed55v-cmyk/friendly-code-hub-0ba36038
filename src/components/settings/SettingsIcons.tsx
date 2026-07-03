// 3D-style hand-crafted icons for the settings menu.
// Each icon is a raised plate with a soft gradient and a contrasting symbol.
import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const base3d = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
};

const bgFill = "hsl(var(--background))";

const PlateGradient = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`${id}-plate`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="currentColor" stopOpacity="0.75" />
      <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
    </linearGradient>
    <linearGradient id={`${id}-top`} x1="3" y1="3" x2="3" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
    </linearGradient>
  </defs>
);

const Plate = ({ id }: { id: string }) => (
  <>
    <PlateGradient id={id} />
    <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill={`url(#${id}-plate)`} stroke="none" />
    <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill={`url(#${id}-top)`} opacity="0.5" stroke="none" />
  </>
);

export const AccountIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="account" />
    <circle cx="12" cy="9.5" r="3.2" fill={bgFill} />
    <path d="M7 17.5c0-2.5 2.5-4 5-4s5 1.5 5 4v1.5c0 .5-.5 1-1 1H8c-.5 0-1-.5-1-1z" fill={bgFill} />
  </svg>
);

export const WorkspacesIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="workspaces" />
    <rect x="5.5" y="5.5" width="10" height="10" rx="2" fill={bgFill} opacity="0.5" />
    <rect x="8.5" y="8.5" width="10" height="10" rx="2" fill={bgFill} />
  </svg>
);

export const BillingIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="billing" />
    <rect x="5" y="8" width="14" height="9" rx="1.5" fill={bgFill} />
    <rect x="5" y="10.5" width="14" height="1.5" fill="currentColor" opacity="0.2" />
    <rect x="13" y="13.5" width="3.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.3" />
  </svg>
);

export const AiPersonalizationIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="ai" />
    <path d="M12 5l1.2 4.8L18 12l-4.8 1.2L12 18l-1.2-4.8L6 12l4.8-1.2z" fill={bgFill} />
  </svg>
);

export const MemoryIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="memory" />
    <rect x="6" y="6" width="12" height="12" rx="1.5" fill={bgFill} />
    <path d="M9 6V5M12 6V5M15 6V5M9 18v1M12 18v1M15 18v1M6 9H5M6 12H5M6 15H5M18 9h1M18 12h1M18 15h1" stroke="currentColor" opacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const SkillsIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="skills" />
    <path d="M12 5l1.5 4.5L18 11l-4.5 1.5L12 17l-1.5-4.5L6 11l4.5-1.5z" fill={bgFill} />
  </svg>
);

export const AppearanceIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="appearance" />
    <circle cx="12" cy="12" r="6" fill="none" stroke={bgFill} strokeWidth="1.5" />
    <path d="M12 6a6 6 0 1 0 0 12V6z" fill={bgFill} />
  </svg>
);

export const NotificationsIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="notifications" />
    <path d="M12 5.5c-2.5 0-4.5 2-4.5 4.5v4l-2 2h13l-2-2v-4c0-2.5-2-4.5-4.5-4.5z" fill={bgFill} />
    <path d="M10 17.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const IntegrationsIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="integrations" />
    <circle cx="7.5" cy="7.5" r="2" fill={bgFill} />
    <circle cx="16.5" cy="7.5" r="2" fill={bgFill} />
    <circle cx="7.5" cy="16.5" r="2" fill={bgFill} />
    <circle cx="16.5" cy="16.5" r="2" fill={bgFill} />
    <path d="M9.5 7.5h5M7.5 9.5v5M16.5 9.5v5M9.5 16.5h5" stroke="currentColor" opacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const SupportIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="support" />
    <path d="M7 7h10a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-3 2.5V8.5A1.5 1.5 0 0 1 7.5 7z" fill={bgFill} />
  </svg>
);

export const PrivacyIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="privacy" />
    <path d="M12 4.5l6.5 3v4.5c0 4-2.8 7.8-6.5 8.8-3.7-1-6.5-4.8-6.5-8.8V7.5z" fill={bgFill} />
    <path d="M9 12l2 2 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </svg>
);

export const StatusIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="status" />
    <path d="M4 12h3l3-7 3 12 3-5h4" stroke={bgFill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...base3d} {...p}>
    <Plate id="logout" />
    <path d="M14 8l4 4-4 4M18 12H9M9 6.5H7.5A1.5 1.5 0 0 0 6 8v8a1.5 1.5 0 0 0 1.5 1.5H9" stroke={bgFill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Re-export as ThemeIcon for desktop layouts.
export const ThemeIcon = AppearanceIcon;

// Legacy / other icons used across settings pages.
export const FAQIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H18a2 2 0 0 1 2 2v14a1 1 0 0 1-1.5.9L17 19l-1.5.9A1 1 0 0 1 14 19V5H5.5A1.5 1.5 0 0 1 4 4.5z" />
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H14v16.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 4 19.5z" fill="currentColor" opacity="0.18" stroke="none" />
  </svg>
);

export const HumanSupportIcon = SupportIcon;

export const AISupportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 17h-4l-4 3.5V17H6a2.5 2.5 0 0 1-2.5-2.5z" />
    <path d="M12 7.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor" stroke="none" />
  </svg>
);

export const ApiIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8.7 6.3L3 12l5.7 5.7 1.5-1.5L6 12l4.2-4.2zM15.3 6.3l-1.5 1.5L18 12l-4.2 4.2 1.5 1.5L21 12z" />
  </svg>
);

export const LanguageIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <ellipse cx="12" cy="12" rx="3.5" ry="8" />
    <path d="M4 10h16M4 14h16" opacity="0.45" />
  </svg>
);

export const HelpIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 16.8v-.1" strokeWidth={2.2} />
    <path d="M12 13.2V13c0-1.5 1.2-2.2 1.8-2.6.6-.4.9-1 .9-1.7 0-1.2-1-2.2-2.2-2.2-1.2 0-2.2 1-2.2 2.2" />
  </svg>
);

export const SignOutIcon = LogoutIcon;

export const GiftIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="9" width="18" height="11" rx="1.5" />
    <path d="M12 5.5c-1.6 0-2.9 1.3-2.9 2.9 0 .6.2 1.2.5 1.6H7a1.5 1.5 0 0 0 0 3h10a1.5 1.5 0 0 0 0-3h-2.6c.3-.4.5-1 .5-1.6 0-1.6-1.3-2.9-2.9-2.9z" />
    <path d="M12 9v11" />
  </svg>
);

export const SwitchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M7 4l-4 4 4 4V9h13V7H7zM17 12l4 4-4 4v-3H4v-2h13z" />
  </svg>
);

export const ChevronIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9.3 5.7l6.3 6.3-6.3 6.3-1.2-1.2 5.1-5.1-5.1-5.1z" />
  </svg>
);

export const BackIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M14.7 5.7l-6.3 6.3 6.3 6.3 1.2-1.2-5.1-5.1 5.1-5.1z" />
  </svg>
);

export const SparkleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" />
    <path d="M18 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" opacity="0.6" />
  </svg>
);
