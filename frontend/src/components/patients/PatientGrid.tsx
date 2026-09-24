import { Avatar } from './Avatar';
import { IconArchive } from '../icons';
import { Sparkline } from '../viz/Sparkline';
import type { Patient } from '../../types/patient';

const STATUS_COLORS: Record<string, string> = {
  ontrack: 'var(--sage)',
  warning: 'var(--amber)',
  danger: 'var(--coral)',
  inactive: 'var(--fg-subtle)',
};

const STATUS_LABELS: Record<string, string> = {
  ontrack: 'No caminho',
  warning: 'Atenção',
  danger: 'Crítico',
  inactive: 'Inativo',
};

function fakeSpark(end: number): number[] {
  const out: number[] = [];
  let v = end - (Math.random() * 10 - 5);
  for (let i = 0; i < 7; i++) {
    out.push(v);
    v += Math.random() * 8 - 3;
  }
  out[6] = end;
  return out;
}

function StatusDotChip({ status }: { status: string }) {
  return (
    <div className={`chip ${status}`} style={{ padding: '2px 6px' }}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: STATUS_COLORS[status] || 'var(--fg-subtle)',
          marginRight: 4,
        }}
      />
      {STATUS_LABELS[status]}
    </div>
  );
}

function ArchiveButton({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button
      data-testid="btn-desativar"
      onClick={onClick}
      style={{
        color: 'var(--fg-subtle)',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
      }}
      title={active === false ? 'Reativar' : 'Desativar'}
    >
      <IconArchive size={12} />
    </button>
  );
}

interface PatientGridCardProps {
  patient: Patient;
  onOpen: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

function CardHeader({
  patient: p,
  onToggleActive,
}: {
  patient: Patient;
  onToggleActive?: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <Avatar initials={p.initials} status={p.active === false ? 'inactive' : p.status} size={34} />
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
          {p.name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
          {p.objective} · {p.age}A
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusDotChip status={p.status} />
        {onToggleActive && (
          <div onClick={(e) => e.stopPropagation()}>
            <ArchiveButton active={p.active} onClick={() => onToggleActive(p.id)} />
          </div>
        )}
      </div>
    </div>
  );
}

function CardStats({ patient: p }: { patient: Patient }) {
  const color =
    p.status === 'ontrack'
      ? 'var(--sage-dim)'
      : p.status === 'warning'
        ? 'var(--carb)'
        : 'var(--coral-dim)';

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 2 }}>
            Adesão 7d
          </div>
          <div className="mono tnum" style={{ fontSize: 22, fontWeight: 500, color }}>
            {p.adherence}%
          </div>
        </div>
        <Sparkline
          values={fakeSpark(p.adherence)}
          width={90}
          height={30}
          stroke={
            p.status === 'ontrack'
              ? 'var(--sage-dim)'
              : p.status === 'warning'
                ? 'var(--amber)'
                : 'var(--coral)'
          }
          fill="transparent"
          showDots={false}
        />
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
          {typeof p.weight === 'number' && p.weight > 0 ? `${p.weight}kg` : '—'} ·{' '}
          {Number.isFinite(p.weightDelta)
            ? `${p.weightDelta > 0 ? '+' : ''}${p.weightDelta.toFixed(1)}`
            : '0.0'}
        </span>
      </div>
    </>
  );
}

function PatientGridCard({ patient: p, onOpen, onToggleActive }: PatientGridCardProps) {
  return (
    <div
      className="card"
      onClick={() => onOpen(p.id)}
      style={{ cursor: 'pointer', padding: 16, transition: 'border-color 0.12s' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <CardHeader patient={p} onToggleActive={onToggleActive} />
      <CardStats patient={p} />
    </div>
  );
}

interface PatientGridProps {
  patients: Patient[];
  onOpen: (id: string) => void;
  onToggleActive?: (id: string) => void;
  compact?: boolean;
}

export function PatientGrid({ patients, onOpen, onToggleActive, compact }: PatientGridProps) {
  const list = compact ? patients.slice(0, 8) : patients;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14,
      }}
    >
      {list.map((p) => (
        <PatientGridCard key={p.id} patient={p} onOpen={onOpen} onToggleActive={onToggleActive} />
      ))}
    </div>
  );
}
