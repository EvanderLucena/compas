import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';

function ResetSuccessState({ onLoginClick }: { onLoginClick: () => void }) {
  return (
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
        onClick={onLoginClick}
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
  );
}

function ResetMissingTokenState() {
  return (
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
        O token de redefinição não foi informado na URL. Por favor, solicite um novo link a partir
        da tela de login.
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
  );
}

export function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

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
          <ResetSuccessState onLoginClick={() => navigate('/login')} />
        ) : !token ? (
          <ResetMissingTokenState />
        ) : (
          <ResetPasswordForm token={token} onSuccess={() => setIsSuccess(true)} />
        )}
      </div>
    </div>
  );
}
