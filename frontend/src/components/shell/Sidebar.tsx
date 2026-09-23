import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useNavigationStore } from '../../stores/navigationStore';
import { usePatients } from '../../stores/patientStore';
import { useAuthStore } from '../../stores/authStore';
import { mapPatientFromApi } from '../../types/patient';
import { IconSearch, IconHome, IconUsers, IconMeal, IconInsight } from '../icons';
import { IconCompas } from '../ui/CompasLogo';
import type { PatientStatus } from '../../types/patient';
import type { ViewType } from '../../stores/navigationStore';
import { SidebarAdmin } from './SidebarAdmin';

interface NavItem {
  id: string;
  path: string;
  label: string;
  Icon: React.FC<{
    size?: number;
    className?: string;
    color?: string;
    style?: React.CSSProperties;
  }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', path: '/home', label: 'Visão geral', Icon: IconHome, badge: 'HOJE' },
  { id: 'patients', path: '/patients', label: 'Pacientes', Icon: IconUsers },
  { id: 'foods', path: '/foods', label: 'Alimentos', Icon: IconMeal },
  { id: 'insights', path: '/insights', label: 'Inteligência', Icon: IconInsight },
];

const STATUS_FILTERS: { key: PatientStatus | 'all'; label: string; dot?: string }[] = [
  { key: 'all', label: 'TODOS' },
  { key: 'ontrack', label: '', dot: 'var(--sage)' },
  { key: 'warning', label: '', dot: 'var(--amber)' },
  { key: 'danger', label: '', dot: 'var(--coral)' },
];

function SidebarHeader({ user }: { user: { name?: string } | null }) {
  return (
    <div className="sidebar-header">
      <div className="brand-row">
        <div className="brand-mark" title="Compas">
          <IconCompas size={16} />
        </div>
        <div className="brand-name">compas</div>
        <div className="brand-tag mono">v2.4</div>
      </div>
      <div className="sidebar-user-name">{user?.name || 'Nutricionista'}</div>
    </div>
  );
}

function SidebarSearch({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <div className="search">
      <IconSearch size={14} />
      <input
        placeholder="Buscar paciente, plano, alimento…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <span className="kbd">⌘K</span>
    </div>
  );
}

function NavSection({
  location,
  setView,
  navigate,
  apiPatients,
}: {
  location: ReturnType<typeof useLocation>;
  setView: (v: ViewType) => void;
  navigate: ReturnType<typeof useNavigate>;
  apiPatients: ReturnType<typeof mapPatientFromApi>[];
}) {
  return (
    <>
      <div className="nav-section-label">Workspace</div>
      <div className="nav-list">
        {NAV_ITEMS.map((it) => (
          <button
            key={it.id}
            className={`nav-item ${location.pathname.startsWith(it.path) ? 'active' : ''}`}
            onClick={() => {
              setView(it.id as ViewType);
              navigate(it.path);
            }}
          >
            <it.Icon size={15} />
            <span>{it.label}</span>
            {'badge' in it && it.badge && <span className="count">{it.badge}</span>}
            {it.id === 'patients' && <span className="count">{apiPatients.length}</span>}
          </button>
        ))}
      </div>
    </>
  );
}

function PatientQuickItem({
  patient,
  navigate,
  setActivePatientId,
  setView,
  isActive,
}: {
  patient: ReturnType<typeof mapPatientFromApi>;
  navigate: ReturnType<typeof useNavigate>;
  setActivePatientId: (id: string) => void;
  setView: (v: ViewType) => void;
  isActive: boolean;
}) {
  return (
    <div
      className={`pq-item ${isActive ? 'active' : ''}`}
      onClick={() => {
        setActivePatientId(patient.id);
        setView('patient');
        navigate(`/patient/${patient.id}`);
      }}
    >
      <span className={`pq-status ${patient.status}`} />
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div
          className="pq-name"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {patient.name}
        </div>
        <div
          className="pq-meta"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {patient.objective.toUpperCase()}
        </div>
      </div>
      <div className="pq-meta tnum" style={{ flexShrink: 0 }}>
        {patient.adherence}%
      </div>
    </div>
  );
}

function StatusFilterRow({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: PatientStatus | 'all';
  setStatusFilter: (s: PatientStatus | 'all') => void;
}) {
  return (
    <div
      className="nav-section-label"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 18,
      }}
    >
      <span>Pacientes ativos</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            title={f.key}
            style={{
              padding: f.key === 'all' ? '2px 6px' : '4px',
              borderRadius: 4,
              border: `1px solid ${statusFilter === f.key ? 'var(--fg)' : 'var(--border)'}`,
              background: statusFilter === f.key ? 'var(--surface-2)' : 'transparent',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--fg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: f.key === 'all' ? 0 : 18,
              minHeight: 18,
              cursor: 'pointer',
            }}
          >
            {f.key === 'all' ? (
              'TODOS'
            ) : (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: f.dot,
                  display: 'block',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function PatientList({
  filtered,
  navigate,
  setActivePatientId,
  setView,
  location,
}: {
  filtered: ReturnType<typeof mapPatientFromApi>[];
  navigate: ReturnType<typeof useNavigate>;
  setActivePatientId: (id: string) => void;
  setView: (v: ViewType) => void;
  location: ReturnType<typeof useLocation>;
}) {
  return (
    <div className="patient-quick">
      {filtered.map((p) => (
        <PatientQuickItem
          key={p.id}
          patient={p}
          navigate={navigate}
          setActivePatientId={setActivePatientId}
          setView={setView}
          isActive={location.pathname === `/patient/${p.id}`}
        />
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: 16, fontSize: 12, color: 'var(--fg-subtle)' }}>
          Nenhum paciente neste filtro.
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setView, setActivePatientId, statusFilter, setStatusFilter, sidebarOpen } =
    useNavigationStore();
  const user = useAuthStore((s) => s.user);
  const { data } = usePatients();
  const apiPatients = useMemo(() => (data?.content ?? []).map(mapPatientFromApi), [data]);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let list = apiPatients;
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [apiPatients, q, statusFilter]);

  if (user?.role === 'ADMIN') {
    return <SidebarAdmin user={user} sidebarOpen={sidebarOpen} />;
  }

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <SidebarHeader user={user} />
      <SidebarSearch q={q} setQ={setQ} />
      <NavSection
        location={location}
        setView={setView}
        navigate={navigate}
        apiPatients={apiPatients}
      />
      <StatusFilterRow statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <PatientList
        filtered={filtered}
        navigate={navigate}
        setActivePatientId={setActivePatientId}
        setView={setView}
        location={location}
      />
    </aside>
  );
}
