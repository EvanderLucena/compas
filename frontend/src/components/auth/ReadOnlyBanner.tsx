import { useAuthStore } from '../../stores/authStore';
import { IconSparkle } from '../icons';

export function ReadOnlyBanner() {
  const user = useAuthStore((s) => s.user);
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  // If user not loaded or not in read-only mode, don't render banner
  if (!user || !user.readOnly) {
    return null;
  }

  return (
    <div
      role="alert"
      className="read-only-banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 16px',
        backgroundColor: 'rgba(245, 158, 11, 0.09)',
        borderBottom: '1px solid rgba(245, 158, 11, 0.28)',
        color: 'var(--fg)',
        fontSize: '13px',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '15px', color: 'var(--amber, #f59e0b)' }} aria-hidden="true">
          🔒
        </span>
        <span style={{ color: 'var(--fg)', fontSize: '12.5px' }}>
          <strong>Modo Leitura ativo:</strong> Sua assinatura está pausada. Todos os seus pacientes
          e históricos continuam preservados para consulta, mas edições e a IA no WhatsApp estão
          suspensas.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={openReadOnlyModal}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--amber, #f59e0b)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 4px',
          }}
        >
          <IconSparkle size={12} color="var(--amber, #f59e0b)" />
          Saiba mais / Reativar
        </button>
      </div>
    </div>
  );
}
