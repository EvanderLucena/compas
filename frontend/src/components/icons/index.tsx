interface IconProps {
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

function Icon({
  d,
  size = 16,
  children,
  className,
  color,
  fill = 'none',
  ...rest
}: IconProps & { d?: string; children?: React.ReactNode; fill?: string; [key: string]: unknown }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color || 'currentColor'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export function IconHome(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </Icon>
  );
}

export function IconUsers(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 20c0-2 1.5-4 4-4s4 1.5 4 4" />
    </Icon>
  );
}

export function IconPlan(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </Icon>
  );
}

export function IconInsight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 20V6M4 20h16" />
      <path d="M8 16l3-4 3 2 5-7" />
    </Icon>
  );
}

export function IconBell(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </Icon>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.3-4.3" />
    </Icon>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconChevronR(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function IconChevronD(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function IconSparkle(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4Z" />
      <path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7L19 17Z" />
    </Icon>
  );
}

export function IconWhatsapp(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 20l1.5-4A8 8 0 1 1 8 20l-4 0Z" />
      <path d="M9 10c.5 2 2 3.5 4 4l1-1c.4-.4 1-.5 1.5-.3l1.5.6c.5.2.7.7.5 1.2-.4 1-1.4 1.6-2.5 1.4A7 7 0 0 1 8 10.5C7.8 9.4 8.4 8.4 9.4 8c.5-.2 1 0 1.2.5l.6 1.5c.2.5.1 1.1-.3 1.5l-1 .5Z" />
    </Icon>
  );
}

export function IconClock(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </Icon>
  );
}

export function IconTrend(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M3 17l6-6 4 4 8-9" />
      <path d="M14 6h6v6" />
    </Icon>
  );
}

export function IconMeal(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function IconScale(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 10h8" />
      <path d="M10 14l2-2 2 2" />
    </Icon>
  );
}

export function IconEdit(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </Icon>
  );
}

export function IconFilter(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 5h16l-6 8v5l-4 2v-7L4 5Z" />
    </Icon>
  );
}

export function IconDots(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </Icon>
  );
}

export function IconAlert(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4 2 20h20L12 4Z" />
      <path d="M12 10v5M12 18v.5" />
    </Icon>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m5 12 4 4 10-10" />
    </Icon>
  );
}

export function IconX(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconArrowR(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </Icon>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="4" y="5" width="16" height="16" rx="1.5" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </Icon>
  );
}

export function IconDrop(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" />
    </Icon>
  );
}

export function IconTrash(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </Icon>
  );
}

export function IconArchive(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="4" rx="1" />
      <path d="M5 9v11h14V9M10 13h4" />
    </Icon>
  );
}

export function IconDownload(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M12 4v12M7 12l5 5 5-5" />
      <path d="M4 20h16" />
    </Icon>
  );
}

export function IconFood(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </Icon>
  );
}

export function IconUser(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

export function IconLock(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

export function IconCreditCard(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </Icon>
  );
}

export function IconCopy(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Icon>
  );
}

export function IconRefresh(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </Icon>
  );
}

export function IconServer(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="2" y="3" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="13" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="7" x2="6.01" y2="7" />
      <line x1="6" y1="17" x2="6.01" y2="17" />
    </Icon>
  );
}

export function IconQrCode(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3M20 14v3" />
    </Icon>
  );
}
