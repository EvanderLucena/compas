import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { resetPassword } from '../api/auth';
import { useToastStore } from '../stores/toastStore';

export function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Token de recuperação ausente. Por favor, solicite um novo link.');
      return;
    }

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
      setIsSuccess(true);
      showSuccess(response.message || 'Senha redefinida com sucesso!');
    } catch (err: unknown) {
      const apiErr = err as { message?: string; response?: { data?: { message?: string } } };
      const msg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Token inválido ou expirado. Solicite uma nova recuperação.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg, #0f172a)',
        color: 'var(--fg, #f8fafc)',
        padding: '24px',
        fontFamily: 'var(--font-ui, sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--card-bg, #1e293b)',
          borderRadius: '16px',
          border: '1px solid var(--border, #334155)',
          padding: '36px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--lime, #10b981)',
              letterSpacing: '-0.5px',
            }}
          >
            Compas 🧭
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--fg-muted, #94a3b8)',
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Redefinição de Senha
          </div>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
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
              Senha atualizada com sucesso!
            </h3>
            <p
              style={{
                color: 'var(--fg-muted, #94a3b8)',
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: '28px',
              }}
            >
              Você já pode fazer login na plataforma utilizando a sua nova senha cadastrada.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
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
              Fazer Login
            </button>
          </div>
        ) : !token ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 20px',
              }}
            >
              !
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
              Link de recuperação ausente
            </h3>
            <p
              style={{
                color: 'var(--fg-muted, #94a3b8)',
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: '28px',
              }}
            >
              O token de redefinição não foi informado na URL. Por favor, solicite um novo link a
              partir da tela de login.
            </p>
            <Link
              to="/login"
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--lime, #10b981)',
                color: '#022c22',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            >
              Voltar ao Login
            </Link>
          </div>
        ) : (
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
                  lineHeight: 1.4,
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--fg, #f8fafc)',
                  }}
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
                      outline: 'none',
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
                      padding: '4px',
                    }}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px',
                    color: 'var(--fg, #f8fafc)',
                  }}
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
                    outline: 'none',
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
                  style={{
                    color: 'var(--fg-muted, #94a3b8)',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  Lembrou da senha?{' '}
                  <span style={{ color: 'var(--lime, #10b981)' }}>Fazer login</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
