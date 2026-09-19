import { useNavigate, useLocation } from 'react-router';
import type { ViewType } from '../../stores/navigationStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useThemeStore } from '../../stores/themeStore';
import { IconHome, IconUsers, IconFood, IconInsight, IconSettings } from '../icons';

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
      <div className="rail-logo" title="NutriAI">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2c0 6-6 7-6 13a6 6 0 0 0 12 0c0-6-6-7-6-13Z"
            stroke="var(--lime)"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="14" r="1.4" fill="var(--lime)" />
        </svg>
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
