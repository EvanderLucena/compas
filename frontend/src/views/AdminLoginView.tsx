import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { CompasLogo } from '../components/ui/CompasLogo';

function AdminLoginHeader() {
  return (
    <div
      style={{
        marginBottom: 24,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <CompasLogo size={24} showTag={true} tagText="OPS" />
      <h1
        style={{
          fontSize: 20,
          fontWeight: 600,
          margin: '16px 0 6px',
          color: 'var(--fg, #e6edf3)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        Portal de Operações
      </h1>
      <p style={{ fontSize: 13, color: 'var(--fg-muted, #8b949e)', margin: 0 }}>
        Acesso administrativo e infraestrutura do Compas
      </p>
    </div>
  );
}

interface AdminLoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitDisabled: boolean;
  isLoading: boolean;
}

function AdminLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  handleSubmit,
  isSubmitDisabled,
  isLoading,
}: AdminLoginFormProps) {
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="admin-email"
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted, #8b949e)' }}
        >
          E-mail do Administrador
        </label>
        <input
          id="admin-email"
          data-testid="admin-login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@compas.app"
          autoComplete="username"
          required
          style={{
            width: '100%',
            padding: '9px 12px',
            fontSize: 13.5,
            background: 'var(--surface-2, #1b2127)',
            border: '1px solid var(--border, #2d353f)',
            borderRadius: 6,
            color: 'var(--fg, #e6edf3)',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="admin-password"
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted, #8b949e)' }}
        >
          Senha
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="admin-password"
            data-testid="admin-login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            style={{
              width: '100%',
              padding: '9px 38px 9px 12px',
              fontSize: 13.5,
              background: 'var(--surface-2, #1b2127)',
              border: '1px solid var(--border, #2d353f)',
              borderRadius: 6,
              color: 'var(--fg, #e6edf3)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg-muted, #8b949e)',
              padding: 4,
              fontSize: 11,
            }}
          >
            {showPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        data-testid="admin-login-submit"
        disabled={isSubmitDisabled}
        className="btn btn-primary"
        style={{
          marginTop: 8,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          width: '100%',
          justifyContent: 'center',
          cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
          opacity: isSubmitDisabled ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Autenticando...' : 'Acessar Painel Ops'}
      </button>
    </form>
  );
}

export function AdminLoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Preencha o e-mail e a senha de administrador.');
      return;
    }

    setLocalError('');
    try {
      await login(email, password);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role !== 'ADMIN') {
        await logout();
        setLocalError('Acesso negado: esta conta não possui privilégios de administrador.');
        return;
      }
      navigate('/admin/whatsapp', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Credenciais inválidas. Verifique os dados.';
      setLocalError(message);
    }
  };

  const isSubmitDisabled = !email || !password || isLoading;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #0d0f11)',
        padding: '24px 16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '36px 32px',
          background: 'var(--surface, #14181c)',
          border: '1px solid var(--border, #262c33)',
          borderRadius: 12,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
        }}
      >
        <AdminLoginHeader />

        {localError && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--coral, #f87171)',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 12.5,
              marginBottom: 18,
            }}
          >
            {localError}
          </div>
        )}

        <AdminLoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleSubmit={handleSubmit}
          isSubmitDisabled={isSubmitDisabled}
          isLoading={isLoading}
        />

        <div
          style={{
            marginTop: 24,
            textAlign: 'center',
            borderTop: '1px solid var(--border, #262c33)',
            paddingTop: 16,
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--fg-subtle, #6e7681)', margin: 0 }}>
            Compas Backoffice · Acesso restrito e auditado
          </p>
        </div>
      </div>
    </div>
  );
}
