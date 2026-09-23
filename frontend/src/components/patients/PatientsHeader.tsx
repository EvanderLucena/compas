import { IconSearch, IconPlus, IconFilter, IconArchive } from '../icons';
import type { Patient } from '../../types/patient';

interface PatientsHeaderProps {
  showInactive: boolean;
  totalElements: number;
  isLoading: boolean;
  activePats: Patient[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  mode: 'table' | 'grid';
  onModeChange: (m: 'table' | 'grid') => void;
  filterOpen: boolean;
  activeFilters: number;
  onToggleFilter: () => void;
  onToggleInactive: () => void;
  onNewPatient: () => void;
}

function MiniStat({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div className="eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
        <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function HeaderStatsSummary({ activePats }: { activePats: Patient[] }) {
  const onTrack = activePats.filter((p) => p.status === 'ontrack').length;
  const warning = activePats.filter((p) => p.status === 'warning').length;
  const danger = activePats.filter((p) => p.status === 'danger').length;

  return (
    <>
      <MiniStat label="On-track" value={String(onTrack)} dot="var(--sage)" />
      <MiniStat label="Atenção" value={String(warning)} dot="var(--amber)" />
      <MiniStat label="Crítico" value={String(danger)} dot="var(--coral)" />
      <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
    </>
  );
}

function ActiveControls({
  mode,
  onModeChange,
  filterOpen,
  activeFilters,
  onToggleFilter,
  onNewPatient,
}: {
  mode: 'table' | 'grid';
  onModeChange: (m: 'table' | 'grid') => void;
  filterOpen: boolean;
  activeFilters: number;
  onToggleFilter: () => void;
  onNewPatient: () => void;
}) {
  const filterBtnClass = filterOpen || activeFilters > 0 ? 'btn-secondary' : 'btn-ghost';

  return (
    <>
      <div className="seg" style={{ height: 30 }}>
        <button className={mode === 'table' ? 'active' : ''} onClick={() => onModeChange('table')}>
          Lista
        </button>
        <button className={mode === 'grid' ? 'active' : ''} onClick={() => onModeChange('grid')}>
          Cartões
        </button>
      </div>
      <button className={`btn ${filterBtnClass}`} onClick={onToggleFilter}>
        <IconFilter size={13} /> Filtrar
      </button>
      <button className="btn btn-primary" onClick={onNewPatient}>
        <IconPlus size={13} /> Novo paciente
      </button>
    </>
  );
}

export function PatientsHeader({
  showInactive,
  totalElements,
  isLoading,
  activePats,
  searchQuery,
  onSearchChange,
  mode,
  onModeChange,
  filterOpen,
  activeFilters,
  onToggleFilter,
  onToggleInactive,
  onNewPatient,
}: PatientsHeaderProps) {
  const countLabel = showInactive ? 'pacientes inativos' : 'pacientes ativos';
  const titleText = isLoading ? '...' : `${totalElements} ${countLabel}`;
  const eyebrowText = showInactive ? 'Inativos · arquivo clínico' : 'Carteira clínica';
  const inactiveBtnClass = showInactive ? 'btn-secondary' : 'btn-ghost';
  const inactiveTextColor = showInactive ? 'var(--fg)' : 'var(--fg-muted)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: filterOpen && !showInactive ? 12 : 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <div className="eyebrow">{eyebrowText}</div>
        <h1
          className="serif"
          style={{ fontSize: 34, margin: '4px 0 0', fontWeight: 400, letterSpacing: '-0.02em' }}
        >
          {titleText}
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {!showInactive && <HeaderStatsSummary activePats={activePats} />}
        <div className="search" style={{ margin: 0, width: 200 }}>
          <IconSearch size={13} />
          <input
            placeholder="Buscar por nome…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {!showInactive && (
          <ActiveControls
            mode={mode}
            onModeChange={onModeChange}
            filterOpen={filterOpen}
            activeFilters={activeFilters}
            onToggleFilter={onToggleFilter}
            onNewPatient={onNewPatient}
          />
        )}
        <button
          className={`btn ${inactiveBtnClass}`}
          onClick={onToggleInactive}
          style={{ color: inactiveTextColor }}
        >
          <IconArchive size={13} />
          {showInactive ? ' Ver ativos' : ' Inativos'}
        </button>
      </div>
    </div>
  );
}
