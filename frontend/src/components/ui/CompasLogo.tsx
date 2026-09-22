export function IconCompas({
  size = 18,
  color = 'currentColor',
  accentColor = 'var(--lime)',
  className,
}: {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Precision circular ring */}
      <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.8" />
      {/* 4-point faceted compass star */}
      <path d="M16 2L18.2 16L16 30L13.8 16L16 2Z" fill={color} />
      <path d="M2 16L16 18.2L30 16L16 13.8L2 16Z" fill={color} />
      {/* Central Lime calibration pivot core */}
      <circle cx="16" cy="16" r="2.4" fill={accentColor} />
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
  size = 20,
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
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            letterSpacing: '-0.01em',
            color: 'var(--fg)',
          }}
        >
          compas<span style={{ color: 'var(--lime)' }}>.</span>
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
