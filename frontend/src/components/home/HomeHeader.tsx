interface HomeHeaderProps {
  userName?: string;
  headerDate: string;
  onTrack: number;
  warning: number;
  danger: number;
}

function StatusIndicatorChip({
  status,
  color,
  count,
  label,
}: {
  status: string;
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className={`chip ${status}`}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          marginRight: 4,
        }}
      />
      {count} {label}
    </div>
  );
}

export function HomeHeader({ userName, headerDate, onTrack, warning, danger }: HomeHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'nutricionista';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div className="eyebrow">{headerDate}</div>
        <h1
          className="serif"
          style={{
            fontSize: 34,
            margin: '4px 0 0',
            letterSpacing: '-0.02em',
            fontWeight: 400,
            whiteSpace: 'nowrap',
          }}
        >
          Bom dia, {firstName}.
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <StatusIndicatorChip
          status="ontrack"
          color="var(--sage)"
          count={onTrack}
          label="on-track"
        />
        <StatusIndicatorChip
          status="warning"
          color="var(--amber)"
          count={warning}
          label="atenção"
        />
        <StatusIndicatorChip status="danger" color="var(--coral)" count={danger} label="crítico" />
      </div>
    </div>
  );
}
