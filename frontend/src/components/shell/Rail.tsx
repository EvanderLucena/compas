import { useNavigate, useLocation } from 'react-router';
import type { ViewType } from '../../stores/navigationStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useThemeStore } from '../../stores/themeStore';
import { IconHome, IconUsers, IconFood, IconInsight, IconSettings } from '../icons';
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
  const { toggleTheme } = useThemeStore();

  return (
    <aside className="rail">
      <div className="rail-logo" title="Compas">
        <IconCompas size={20} />
      </div>
      {RAIL_ITEMS.map((it) => {
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
      })}
      <div className="rail-spacer" />
      <button className="rail-btn" title="Alternar tema" onClick={toggleTheme}>
        <IconSettings size={18} />
      </button>
      <div className="rail-avatar" title="Dra. Helena Viana">
        HV
      </div>
    </aside>
  );
}
