import { useNavigate, useLocation } from 'react-router';
import { IconWhatsapp } from '../icons';
import { IconCompas } from '../ui/CompasLogo';

interface SidebarAdminProps {
  user: { name?: string } | null;
  sidebarOpen: boolean;
}

export function SidebarAdmin({ user, sidebarOpen }: SidebarAdminProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="brand-row">
          <div className="brand-mark" title="Compas">
            <IconCompas size={16} />
          </div>
          <div className="brand-name">compas</div>
          <div className="brand-tag mono">beta</div>
        </div>
        <div className="sidebar-user-name">{user?.name || 'Administrador'}</div>
      </div>

      <div className="nav-section-label">Administração</div>
      <div className="nav-list">
        <button
          className={`nav-item ${location.pathname.startsWith('/admin/whatsapp') ? 'active' : ''}`}
          onClick={() => navigate('/admin/whatsapp')}
        >
          <IconWhatsapp size={15} />
          <span>Frota WhatsApp</span>
        </button>
      </div>

      <div
        style={{ padding: '16px 14px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}
      >
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          Painel Compas
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.4 }}>
          Monitoramento de chips, balanceamento de carga e estabilidade do gateway Evolution.
        </div>
      </div>
    </aside>
  );
}
