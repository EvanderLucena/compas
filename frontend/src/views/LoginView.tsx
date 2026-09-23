import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { Link } from 'react-router';
import { IconCompas } from '../components/ui/CompasLogo';
import { Modal } from '../components/ui/Modal';
import { forgotPassword } from '../api/auth';

function AuthLeftBranding() {
  return (
    <div className="auth-left">
      <div className="auth-left-content">
        <div className="auth-brand">
          <IconCompas size={28} color="var(--paper)" accentColor="var(--lime)" />
          <span className="auth-brand-name">
            compas<span>.</span>
          </span>
        </div>
        <h1 className="auth-left-title">
          Seus pacientes reportam.
          <br />A IA extrai.
          <br />
          <em>Você decide.</em>
        </h1>
        <p className="auth-left-sub">
          Acompanhamento nutricional inteligente via WhatsApp. Zero fricção pro paciente, dados
          estruturados pra você.
        </p>
      </div>
    </div>
  );
}

function MobileBrandHeader() {
  return (
    <div className="auth-mobile-brand">
      <div className="auth-brand" style={{ marginBottom: 0 }}>
        <IconCompas size={24} color="var(--fg)" accentColor="var(--lime-dim)" />
        <span className="auth-brand-name" style={{ color: 'var(--fg)' }}>
          compas<span style={{ color: 'var(--lime-dim)' }}>.</span>
        </span>
      </div>
    </div>
  );
}

function PasswordField({
  password,
  onChange,
  showPassword,
  onToggleShow,
  error,
}: {
  password: string;
  onChange: (v: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  error?: string;
}) {
  return (
    <div className="auth-field">
      <label className="auth-label">Senha</label>
      <div className="auth-password-wrapper">
        <input
          data-testid="login-password"
          type={showPassword ? 'text' : 'password'}
          className={'auth-input' + (error ? ' auth-input-error' : '')}
          placeholder="••••••••"
          value={password}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={onToggleShow}
          aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
          tabIndex={-1}
        >
          {showPassword ? (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  );
}

function GoogleAuthButton({ onGoogleClick }: { onGoogleClick: () => void }) {
  return (
    <button type="button" onClick={onGoogleClick} className="btn btn-secondary auth-oauth">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
          fill="#EA4335"
        />
      </svg>
      Continuar com Google
      <span className="auth-oauth-badge">Em breve</span>
    </button>
  );
}

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  defaultEmail: string;
}

function ForgotPasswordModal({ open, onClose, defaultEmail }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setSubmitted(false);
      setError('');
    }
  }, [open, defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail cadastrado.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(
        apiErr.message ||
          'Ocorreu um erro ao enviar as instruções de recuperação. Tente novamente em instantes.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Recuperar Senha">
      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <div
            style={{
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '16px',
              fontSize: '13px',
              color: 'var(--lime, #10b981)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
              Instruções enviadas!
            </div>
            <div style={{ color: 'var(--fg, #f8fafc)', marginBottom: '8px' }}>
              Se houver uma conta associada a <strong>{email}</strong>, enviamos um link para você
              redefinir sua senha.
            </div>
            <div style={{ fontSize: '12px', color: 'var(--fg-muted, #94a3b8)' }}>
              Verifique sua caixa de entrada e pasta de spam. O link é válido por 1 hora.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px' }}
          >
            Fechar
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}
        >
          <p
            style={{
              fontSize: '13px',
              color: 'var(--fg-muted, #94a3b8)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Digite o e-mail cadastrado na sua conta. Enviaremos um link seguro para você redefinir
            sua senha de acesso.
          </p>

          {error && (
            <div
              style={{
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          <div className="auth-field" style={{ marginBottom: 0 }}>
            <label className="auth-label">E-mail</label>
            <input
              type="email"
              className="auth-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              autoComplete="email"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px' }}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', opacity: isLoading || !email.trim() ? 0.6 : 1 }}
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Enviando...' : 'Enviar link'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [localError, setLocalError] = useState('');
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fieldErrors = useAuthStore((s) => s.fieldErrors);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Preencha todos os campos.');
      return;
    }
    setLocalError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Credenciais inválidas. Tente novamente.';
      setLocalError(message);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgotModal(true);
  };

  const handleGoogleAuth = () => {
    useToastStore.getState().showSuccess('O login com Google estará disponível em breve!');
  };

  const isSubmitDisabled = !email || !password || isLoading;

  return (
    <div className="auth-page">
      <AuthLeftBranding />

      <div className="auth-right">
        <div className="auth-form-wrap">
          <MobileBrandHeader />

          <div className="auth-form-header">
            <h2>Entrar</h2>
            <p>Acesse sua conta Compas</p>
          </div>

          {localError && <div className="auth-error">{localError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">E-mail</label>
              <input
                data-testid="login-email"
                type="email"
                className={'auth-input' + (fieldErrors.email ? ' auth-input-error' : '')}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </div>

            <PasswordField
              password={password}
              onChange={setPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              error={fieldErrors.password}
            />

            <div className="auth-row">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="auth-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Esqueci minha senha
              </button>
            </div>
            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={isSubmitDisabled}
              style={{ opacity: isSubmitDisabled ? 0.45 : 1 }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <GoogleAuthButton onGoogleClick={handleGoogleAuth} />

          <p className="auth-switch">
            Não tem conta?{' '}
            <Link to="/signup" className="auth-link-btn">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={email}
      />
    </div>
  );
}
