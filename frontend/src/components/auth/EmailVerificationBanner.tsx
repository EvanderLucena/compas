import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const resendVerification = useAuthStore((s) => s.resendVerification);
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('compas_email_banner_dismissed') === 'true';
  });
  const [isSending, setIsSending] = useState(false);

  // If email is verified or user not loaded or banner was dismissed for this session, don't show
  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);
    try {
      const response = await resendVerification(user.email);
      showSuccess(response.message || 'E-mail de confirmação reenviado com sucesso!');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showError(apiErr.message || 'Não foi possível reenviar o e-mail no momento.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('compas_email_banner_dismissed', 'true');
  };

  return (
    <div
      role="alert"
      className="email-verification-banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
        color: 'var(--fg)',
        fontSize: '13px',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '15px', color: 'var(--amber, #f59e0b)' }} aria-hidden="true">
          ✉
        </span>
        <span style={{ color: 'var(--fg-muted)', fontSize: '12.5px' }}>
          Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada para garantir o acesso
          completo.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleResend}
          disabled={isSending}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--amber, #f59e0b)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: isSending ? 'wait' : 'pointer',
            textDecoration: 'underline',
            padding: '2px 4px',
          }}
        >
          {isSending ? 'Enviando...' : 'Reenviar link de confirmação'}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar aviso"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--fg-subtle)',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
          }}
          title="Dispensar nesta sessão"
        >
          ×
        </button>
      </div>
    </div>
  );
}
