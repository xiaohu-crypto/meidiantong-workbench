import type { ReactElement } from "react";

type IconProps = { size?: number; className?: string };

function base(size: number | undefined, className: string | undefined, inner: ReactElement): ReactElement {
  return (
    <svg
      className={className}
      width={size ?? 18}
      height={size ?? 18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {inner}
    </svg>
  );
}

export function IconHome(p: IconProps) { return base(p.size, p.className, <><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></>); }
export function IconToday(p: IconProps) { return base(p.size, p.className, <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></>); }
export function IconUsers(p: IconProps) { return base(p.size, p.className, <><circle cx="9" cy="8.4" r="3.4" /><path d="M2.8 19.6c.9-3.5 3.5-5.3 6.2-5.3s5.3 1.8 6.2 5.3" /><circle cx="17" cy="9.2" r="2.6" /><path d="M16.6 14.6c2.5.3 4.4 1.8 5.2 4.6" /></>); }
export function IconKb(p: IconProps) { return base(p.size, p.className, <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>); }
export function IconTask(p: IconProps) { return base(p.size, p.className, <><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></>); }
export function IconFunnel(p: IconProps) { return base(p.size, p.className, <path d="M4 5.5h16l-6 7v5.4l-4 2v-7.4z" />); }
export function IconMedia(p: IconProps) { return base(p.size, p.className, <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9.2 5 2.8-5 2.8z" /></>); }
export function IconChart(p: IconProps) { return base(p.size, p.className, <><path d="M18.5 20V10M12.5 20V4M6.5 20v-6" /><path d="M2.8 20h18.4" /></>); }
export function IconGrowth(p: IconProps) { return base(p.size, p.className, <><path d="m3 17.5 6-6 4 4 8-8.5" /><path d="M15.5 7H21v5.5" /></>); }
export function IconSettings(p: IconProps) { return base(p.size, p.className, <><path d="M5 21V11M5 7V3M12 21v-5M12 12V3M19 21v-9M19 8V3" /><circle cx="5" cy="9" r="2" /><circle cx="12" cy="14" r="2" /><circle cx="19" cy="10" r="2" /></>); }
export function IconSearch(p: IconProps) { return base(p.size, p.className, <><circle cx="11" cy="11" r="7" /><path d="M20.5 20.5 16.5 16.5" /></>); }
export function IconPlus(p: IconProps) { return base(p.size, p.className, <path d="M12 5v14M5 12h14" />); }
export function IconBell(p: IconProps) { return base(p.size, p.className, <><path d="M6.2 8.5a5.8 5.8 0 0 1 11.6 0c0 6.2 2.7 7.3 2.7 7.3H3.5s2.7-1.1 2.7-7.3" /><path d="M10.2 20.2a1.9 1.9 0 0 0 3.6 0" /></>); }
export function IconAI(p: IconProps) { return base(p.size, p.className, <path d="m12 3.5 1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6-5.6-1.9 5.6-1.9z" />); }
export function IconTrash(p: IconProps) { return base(p.size, p.className, <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6.5 7l1 13h9l1-13" /><path d="M10 11v5M14 11v5" /></>); }
export function IconCheck(p: IconProps) { return base(p.size, p.className, <path d="m5 12.5 4.5 4.5L19 7.5" />); }
export function IconClose(p: IconProps) { return base(p.size, p.className, <path d="m6 6 12 12M18 6 6 18" />); }
export function IconRefresh(p: IconProps) { return base(p.size, p.className, <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v4h-4" /></>); }
export function IconMoon(p: IconProps) { return base(p.size, p.className, <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />); }
export function IconSun(p: IconProps) { return base(p.size, p.className, <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></>); }
export function IconWallet(p: IconProps) { return base(p.size, p.className, <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.2" /></>); }
export function IconFlag(p: IconProps) { return base(p.size, p.className, <><path d="M6 21V4" /><path d="M6 5h11l-2.5 3.5L17 12H6" /></>); }
export function IconHelp(p: IconProps) { return base(p.size, p.className, <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5" /><path d="M12 17.5h.01" /></>); }
export function IconGrid(p: IconProps) { return base(p.size, p.className, <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>); }
export function IconClock(p: IconProps) { return base(p.size, p.className, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>); }
