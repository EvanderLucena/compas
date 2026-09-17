import { useState } from 'react';
import { changePassword } from '../../api/nutritionist';
import { IconCheck, IconX } from '../icons';

const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 13,
  background: 'var(--surface)',
  color: 'var(--fg)',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
};

function PasswordField({
  label,
  value,
  onChange,
  show,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label className="eyebrow block mb-1">{label}</label>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={INPUT_STYLE}
        required
      />
    </div>
  );
}

function ValidationList({
  isMinLength,
  isDifferent,
  isMatches,
}: {
  isMinLength: boolean;
  isDifferent: boolean;
  isMatches: boolean;
}) {
  const items = [
    { valid: isMinLength, label: 'Mínimo de 8 caracteres' },
    { valid: isDifferent, label: 'Diferente da senha atual' },
    { valid: isMatches, label: 'Confirmação idêntica' },
  ];

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 6,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontSize: 12,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5"
          style={{ color: item.valid ? 'var(--sage)' : 'var(--fg-muted)' }}
        >
          {item.valid ? <IconCheck size={14} /> : <IconX size={14} />}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfileSecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isMinLength = newPassword.length >= 8;
  const isMatches = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferent = newPassword.length > 0 && newPassword !== currentPassword;
  const hasCurrent = currentPassword.length > 0;
  const canSubmit = isMinLength && isMatches && isDifferent && hasCurrent && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await changePassword({ currentPassword, newPassword, confirmPassword });
      setMessage({ type: 'success', text: response.message || 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setMessage({ type: 'error', text: apiErr.message || 'Erro ao alterar a senha.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {message && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 12,
            background: message.type === 'success' ? 'var(--sage-dim)' : 'var(--coral-dim)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {message.text}
        </div>
      )}

      <PasswordField
        label="Senha Atual"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showPasswords}
        placeholder="Digite sua senha atual"
      />

      <PasswordField
        label="Nova Senha"
        value={newPassword}
        onChange={setNewPassword}
        show={showPasswords}
        placeholder="Mínimo 8 caracteres"
      />

      <PasswordField
        label="Confirmar Nova Senha"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showPasswords}
        placeholder="Repita a nova senha"
      />

      <div className="flex items-center gap-2">
        <input
          id="toggle-profile-passwords"
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          style={{ accentColor: 'var(--lime-dim)', cursor: 'pointer' }}
        />
        <label
          htmlFor="toggle-profile-passwords"
          style={{ fontSize: 12, color: 'var(--fg-muted)', cursor: 'pointer' }}
        >
          Mostrar senhas digitadas
        </label>
      </div>

      {newPassword.length > 0 && (
        <ValidationList isMinLength={isMinLength} isDifferent={isDifferent} isMatches={isMatches} />
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-primary cursor-pointer"
          style={{ padding: '8px 20px', fontSize: 13 }}
        >
          {saving ? 'Atualizando...' : 'Atualizar Senha'}
        </button>
      </div>
    </form>
  );
}
