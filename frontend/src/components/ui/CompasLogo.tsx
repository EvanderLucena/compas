export function IconCompas({
  size = 18,
  color = 'var(--lime)',
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Top pivot circle */}
      <circle cx="12" cy="4.5" r="1.8" stroke={color} strokeWidth="1.8" />
      {/* Compass legs forming precision angle */}
      <path
        d="M10.5 6.3L6 20M13.5 6.3L18 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Precision measurement arc */}
      <path
        d="M7.8 14.8C9.1 13.7 10.5 13.1 12 13.1C13.5 13.1 14.9 13.7 16.2 14.8"
        stroke="var(--fg-muted)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Center pivot point */}
      <circle cx="12" cy="13.1" r="1.2" fill={color} />
    </svg>
  );
}

interface CompasLogoProps {
  size?: number;
  showTag?: boolean;
  tagText?: string;
  className?: string;
}

export function CompasLogo({
  size = 18,
  showTag = false,
  tagText = 'CLÍNICO',
  className,
}: CompasLogoProps) {
  return (
    <div
      className={`flex items-center gap-2 ${className || ''}`}
      style={{ userSelect: 'none' }}
      title="Compas — Sistema Clínico"
    >
      <div
        className="brand-mark"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: size + 8,
          height: size + 8,
          borderRadius: 6,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <IconCompas size={size} />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.02em',
            color: 'var(--fg)',
          }}
        >
          compas
        </span>
        {showTag && (
          <span
            className="mono"
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--lime-dim)',
              background: 'rgba(196, 241, 53, 0.1)',
              padding: '1px 5px',
              borderRadius: 4,
              border: '1px solid rgba(196, 241, 53, 0.25)',
              letterSpacing: '0.04em',
            }}
          >
            {tagText}
          </span>
        )}
      </div>
    </div>
  );
}
