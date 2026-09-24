import type { Patient } from '../../types/patient';

interface HomePatientCardProps {
  p: Patient;
  onNavigate: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ontrack: 'var(--sage)',
  warning: 'var(--amber)',
  danger: 'var(--coral)',
};

const STATUS_LABELS: Record<string, string> = {
  ontrack: 'No caminho',
  warning: 'Atenção',
  danger: 'Crítico',
};

function PatientAvatar({ initials, status }: { initials: string; status: string }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: 'var(--surface-2)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 600,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {initials}
      <span
        style={{
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: STATUS_COLORS[status] || 'var(--fg-subtle)',
          boxShadow: '0 0 0 3px var(--surface)',
        }}
      />
    </div>
  );
}

function PatientInfo({ name, objective, age }: { name: string; objective: string; age: number }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
        {objective} · {age}A
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <div className={`chip ${status}`} style={{ padding: '2px 6px' }}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: STATUS_COLORS[status],
          marginRight: 4,
        }}
      />
      {STATUS_LABELS[status]}
    </div>
  );
}

export function HomePatientCard({ p, onNavigate }: HomePatientCardProps) {
  const adherenceColor =
    p.status === 'ontrack'
      ? 'var(--sage-dim)'
      : p.status === 'warning'
        ? 'var(--carb)'
        : 'var(--coral-dim)';

  const weight = p.weight ?? 0;
  const delta = typeof p.weightDelta === 'number' ? p.weightDelta : 0;

  return (
    <div
      className="card"
      data-testid={`home-patient-card-${p.id}`}
      style={{ cursor: 'pointer', padding: 16, transition: 'border-color 0.12s' }}
      onClick={() => onNavigate(p.id)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <PatientAvatar initials={p.initials} status={p.status} />
        <PatientInfo name={p.name} objective={p.objective} age={p.age} />
        <StatusChip status={p.status} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        <div>
          <div className="eyebrow">Adesão 7d</div>
          <div
            className="mono tnum"
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: adherenceColor,
            }}
          >
            {p.adherence}%
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: 'var(--fg-muted)',
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}
      >
        <span className="mono tnum">
          {typeof weight === 'number' && weight > 0 ? `${weight}kg` : '—'} ·{' '}
          {Number.isFinite(delta) ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` : '0.0'}
        </span>
      </div>
    </div>
  );
}
