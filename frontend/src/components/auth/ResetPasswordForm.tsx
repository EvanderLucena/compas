import { useState } from 'react';
import { Link } from 'react-router';
import { resetPassword } from '../../api/auth';
import { useToastStore } from '../../stores/toastStore';

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (password.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(token, password);
      onSuccess();
      showSuccess(response.message || 'Senha redefinida com sucesso!');
    } catch (err: unknown) {
      const apiErr = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = apiErr.response?.data?.message || apiErr.message || 'Token inválido ou expirado.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        Crie sua nova senha
      </h3>
      <p
        style={{
          color: 'var(--fg-muted, #94a3b8)',
          fontSize: '14px',
          lineHeight: 1.5,
          marginBottom: '24px',
        }}
      >
        Escolha uma senha segura de no mínimo 6 caracteres para acessar sua conta.
      </p>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}
          >
            Nova Senha
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                borderRadius: '8px',
                background: 'var(--input-bg, #0f172a)',
                border: '1px solid var(--border, #334155)',
                color: 'var(--fg, #f8fafc)',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--fg-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}
          >
            Confirmar Nova Senha
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--input-bg, #0f172a)',
              border: '1px solid var(--border, #334155)',
              color: 'var(--fg, #f8fafc)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--lime, #10b981)',
            color: '#022c22',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            marginBottom: '16px',
          }}
        >
          {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{ color: 'var(--fg-muted, #94a3b8)', fontSize: '13px', textDecoration: 'none' }}
          >
            Lembrou da senha? <span style={{ color: 'var(--lime, #10b981)' }}>Fazer login</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
