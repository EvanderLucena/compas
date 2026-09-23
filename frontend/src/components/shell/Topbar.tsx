import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useNavigationStore } from '../../stores/navigationStore';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { IconCalendar, IconUser } from '../../components/icons';
import { ProfileModal } from '../profile/ProfileModal';

const VIEW_LABELS: Record<string, string[]> = {
  home: ['Dashboard'],
  patients: ['Pacientes'],
  patient: ['Pacientes', 'Paciente'],
  foods: ['Alimentos'],
  insights: ['Inteligência'],
  'admin-whatsapp': ['Administração', 'Frota WhatsApp'],
};

interface UserProfileMenuProps {
  user: { name?: string; email?: string } | null;
  onLogout: () => void;
  onOpenProfile: () => void;
}

function UserProfileMenu({ user, onLogout, onOpenProfile }: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NA';

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="topbar-avatar"
        onClick={() => setOpen((prev) => !prev)}
        title={user?.name || 'Perfil do nutricionista'}
      >
        {initials}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 220,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '12px 14px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--fg)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name || 'Nutricionista'}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--fg-muted)',
              marginTop: 2,
              wordBreak: 'break-all',
            }}
          >
            {user?.email || ''}
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              fontSize: 12,
              padding: '6px 8px',
              color: 'var(--fg)',
              cursor: 'pointer',
              marginBottom: 4,
            }}
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
          >
            <IconUser size={14} style={{ marginRight: 6 }} />
            Meu Perfil
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              fontSize: 12,
              padding: '6px 8px',
              color: 'var(--coral)',
            }}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const navigate = useNavigate();
  const { activeView, toggleSidebar } = useNavigationStore();
  const { theme, toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [profileOpen, setProfileOpen] = useState(false);

  const crumbs = VIEW_LABELS[activeView] || ['Dashboard'];
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="topbar">
      <button className="sidebar-toggle" onClick={toggleSidebar} title="Alternar painel lateral">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'now' : ''}>{c}</span>
          </span>
        ))}
      </div>
      <div className="topbar-right">
        <div className="date-chip tnum">
          <IconCalendar size={12} />
          {dateStr} · {timeStr}
        </div>
        <button
          type="button"
          className="topbar-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
        <UserProfileMenu
          user={user}
          onLogout={handleLogout}
          onOpenProfile={() => setProfileOpen(true)}
        />
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
