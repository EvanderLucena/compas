interface HeaderStatProps {
  label: string;
  value: string;
  sub?: string;
  status?: string;
  good?: boolean;
}

export function HeaderStat({ label, value, sub, status, good }: HeaderStatProps) {
  const color =
    status === 'ontrack'
      ? 'var(--sage-dim)'
      : status === 'warning'
        ? 'var(--carb)'
        : status === 'danger'
          ? 'var(--coral-dim)'
          : good
            ? 'var(--sage-dim)'
            : 'var(--fg)';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: 68,
        whiteSpace: 'nowrap',
      }}
    >
      <div className="eyebrow">{label}</div>
      <div
        className="mono tnum"
        style={{ fontSize: 20, fontWeight: 500, color, letterSpacing: '-0.02em', marginTop: 2 }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
