import { Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { CompasLogo } from '../ui/CompasLogo';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { PageFallback } from '../ui/PageFallback';

interface AdminShellHeaderProps {
  email?: string;
  onLogout: () => void;
}

function AdminShellHeader({ email, onLogout }: AdminShellHeaderProps) {
  return (
    <header
      style={{
        height: 56,
        borderBottom: '1px solid var(--border, #262c33)',
        background: 'var(--surface, #14181c)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <CompasLogo size={20} showTag={true} tagText="OPS" />
        <div style={{ width: 1, height: 20, background: 'var(--border, #262c33)' }} />
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavLink
            to="/admin/whatsapp"
            style={({ isActive }) => ({
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--fg, #e6edf3)' : 'var(--fg-muted, #8b949e)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              background: isActive ? 'var(--surface-2, #1b2127)' : 'transparent',
            })}
          >
            Frota WhatsApp
          </NavLink>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              color: 'var(--fg-muted, #8b949e)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {email || 'admin'}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--lime-dim, #a3e635)',
              background: 'rgba(163, 230, 53, 0.1)',
              padding: '1px 5px',
              borderRadius: 4,
              border: '1px solid rgba(163, 230, 53, 0.25)',
              letterSpacing: '0.04em',
            }}
          >
            ADMIN
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          data-testid="admin-logout-btn"
          style={{
            background: 'none',
            border: '1px solid var(--border, #262c33)',
            borderRadius: 6,
            color: 'var(--fg-muted, #8b949e)',
            padding: '4px 10px',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'color 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--coral, #f87171)';
            e.currentTarget.style.borderColor = 'var(--coral, #f87171)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--fg-muted, #8b949e)';
            e.currentTarget.style.borderColor = 'var(--border, #262c33)';
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}

export function AdminShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg, #0d0f11)',
        color: 'var(--fg, #e6edf3)',
      }}
    >
      <AdminShellHeader email={user?.email} onLogout={handleLogout} />

      <main
        style={{ flex: 1, padding: '24px 28px', maxWidth: 1400, width: '100%', margin: '0 auto' }}
      >
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
