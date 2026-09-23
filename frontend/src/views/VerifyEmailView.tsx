import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

type Status = 'idle' | 'loading' | 'success' | 'error';

function LoadingState() {
  return (
    <div>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--lime, #10b981)',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: 'var(--fg-muted)', fontSize: '15px' }}>
        Confirmando seu endereço de e-mail...
      </p>
    </div>
  );
}

function SuccessState({
  isAuthenticated,
  onNavigate,
}: {
  isAuthenticated: boolean;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--lime, #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 20px',
        }}
      >
        ✓
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
        E-mail confirmado com sucesso!
      </h3>
      <p
        style={{
          color: 'var(--fg-muted)',
          fontSize: '14px',
          lineHeight: 1.5,
          marginBottom: '28px',
        }}
      >
        Sua conta profissional de nutricionista foi validada. Você já pode desfrutar de todas as
        funcionalidades.
      </p>
      <button
        type="button"
        onClick={onNavigate}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--lime, #10b981)',
          color: '#022c22',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {isAuthenticated ? 'Ir para o Dashboard' : 'Fazer Login'}
      </button>
    </div>
  );
}

interface ResendFormStateProps {
  status: Status;
  errorMessage: string;
  resendEmail: string;
  isResending: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function ResendFormState({
  status,
  errorMessage,
  resendEmail,
  isResending,
  onEmailChange,
  onSubmit,
}: ResendFormStateProps) {
  return (
    <div>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--amber, #f59e0b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          margin: '0 auto 20px',
        }}
      >
        !
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
        {status === 'error' ? 'Link expirado ou inválido' : 'Confirmação de E-mail'}
      </h3>
      <p
        style={{
          color: 'var(--fg-muted)',
          fontSize: '14px',
          lineHeight: 1.5,
          marginBottom: '24px',
        }}
      >
        {status === 'error'
          ? errorMessage
          : 'Para validar seu cadastro, informe seu e-mail abaixo para receber um novo link seguro.'}
      </p>

      <form onSubmit={onSubmit} style={{ textAlign: 'left', marginBottom: '20px' }}>
        <label
          htmlFor="resendEmailInput"
          style={{
            display: 'block',
            fontSize: '12px',
            color: 'var(--fg-muted)',
            marginBottom: '6px',
          }}
        >
          E-mail cadastrado
        </label>
        <input
          id="resendEmailInput"
          type="email"
          placeholder="seu.email@exemplo.com"
          value={resendEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface-2, #0f172a)',
            color: 'var(--fg)',
            fontSize: '14px',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={isResending}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--lime, #10b981)',
            color: '#022c22',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: isResending ? 'wait' : 'pointer',
          }}
        >
          {isResending ? 'Enviando...' : 'Reenviar link de confirmação'}
        </button>
      </form>

      <Link
        to="/login"
        style={{
          fontSize: '13px',
          color: 'var(--fg-muted)',
          textDecoration: 'none',
        }}
      >
        ← Voltar para o Login
      </Link>
    </div>
  );
}

export function VerifyEmailView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendVerification = useAuthStore((s) => s.resendVerification);
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    verifyEmail(token)
      .then(() => {
        if (mounted) setStatus('success');
      })
      .catch((err: unknown) => {
        if (mounted) {
          setStatus('error');
          const apiErr = err as { message?: string };
          setErrorMessage(apiErr.message || 'O link de confirmação é inválido ou já expirou.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [token, verifyEmail]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      showError('Informe seu endereço de e-mail.');
      return;
    }

    setIsResending(true);
    try {
      const response = await resendVerification(resendEmail.trim());
      showSuccess(response.message || 'E-mail de confirmação enviado!');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showError(apiErr.message || 'Não foi possível reenviar o link no momento.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg, #0f172a)',
        color: 'var(--fg, #f8fafc)',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface-1, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '32px' }} aria-hidden="true">
            🧭
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginTop: '12px', color: 'var(--fg)' }}>
            Compas
          </h2>
        </div>

        {status === 'loading' && <LoadingState />}
        {status === 'success' && (
          <SuccessState
            isAuthenticated={isAuthenticated}
            onNavigate={() => navigate(isAuthenticated ? '/home' : '/login')}
          />
        )}
        {(status === 'error' || status === 'idle') && (
          <ResendFormState
            status={status}
            errorMessage={errorMessage}
            resendEmail={resendEmail}
            isResending={isResending}
            onEmailChange={setResendEmail}
            onSubmit={handleResend}
          />
        )}
      </div>
    </div>
  );
}
