import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { forgotPassword } from '../../api/auth';

function SuccessView({ email, onClose }: { email: string; onClose: () => void }) {
  return (
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
  );
}

interface FormViewProps {
  email: string;
  setEmail: (val: string) => void;
  error: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function FormView({ email, setEmail, error, isLoading, onClose, onSubmit }: FormViewProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}
    >
      <p
        style={{ fontSize: '13px', color: 'var(--fg-muted, #94a3b8)', lineHeight: 1.5, margin: 0 }}
      >
        Digite o e-mail cadastrado na sua conta. Enviaremos um link seguro para você redefinir sua
        senha de acesso.
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
  );
}

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  defaultEmail: string;
}

export function ForgotPasswordModal({ open, onClose, defaultEmail }: ForgotPasswordModalProps) {
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
        <SuccessView email={email} onClose={onClose} />
      ) : (
        <FormView
          email={email}
          setEmail={setEmail}
          error={error}
          isLoading={isLoading}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
}
