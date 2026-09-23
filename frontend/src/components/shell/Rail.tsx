import { useNavigate, useLocation } from 'react-router';
import type { ViewType } from '../../stores/navigationStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { IconHome, IconUsers, IconFood, IconInsight, IconSettings, IconWhatsapp } from '../icons';
import { IconCompas } from '../ui/CompasLogo';

const RAIL_ITEMS: { id: ViewType; path: string; label: string; Icon: typeof IconHome }[] = [
  { id: 'home', path: '/home', label: 'Visão geral', Icon: IconHome },
  { id: 'patients', path: '/patients', label: 'Pacientes', Icon: IconUsers },
  { id: 'foods', path: '/foods', label: 'Alimentos', Icon: IconFood },
  { id: 'insights', path: '/insights', label: 'Inteligência', Icon: IconInsight },
];

export function Rail() {
  const navigate = useNavigate();
  const location = useLocation();
  const setView = useNavigationStore((s) => s.setView);
  const user = useAuthStore((s) => s.user);
  const { toggleTheme } = useThemeStore();

  const isAdmin = user?.role === 'ADMIN';
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('')
    : 'CP';

  return (
    <aside className="rail">
      <div className="rail-logo" title="Compas">
        <IconCompas size={20} />
      </div>
      {isAdmin ? (
        <button
          className={`rail-btn ${location.pathname.startsWith('/admin/whatsapp') ? 'active' : ''}`}
          onClick={() => navigate('/admin/whatsapp')}
          title="Frota WhatsApp"
        >
          <IconWhatsapp size={18} />
        </button>
      ) : (
        RAIL_ITEMS.map((it) => {
          const isActive = location.pathname.startsWith(it.path);
          return (
            <button
              key={it.id}
              className={`rail-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setView(it.id);
                navigate(it.path);
              }}
              title={it.label}
            >
              <it.Icon size={18} />
            </button>
          );
        })
      )}
      <div className="rail-spacer" />
      <button className="rail-btn" title="Alternar tema" onClick={toggleTheme}>
        <IconSettings size={18} />
      </button>
      <div
        className="rail-avatar"
        title={user?.name || (isAdmin ? 'Administrador' : 'Nutricionista')}
      >
        {initials}
      </div>
    </aside>
  );
}
