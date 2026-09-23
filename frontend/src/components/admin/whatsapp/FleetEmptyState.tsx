import { IconServer, IconPlus } from '../../icons';

interface FleetEmptyStateProps {
  hasInstances: boolean;
  onOpenCreate: () => void;
}

export function FleetEmptyState({ hasInstances, onOpenCreate }: FleetEmptyStateProps) {
  return (
    <div
      className="card"
      style={{
        padding: 48,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--fg-muted)',
          marginBottom: 12,
        }}
      >
        <IconServer size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px 0' }}>Nenhum chip encontrado</h3>
      <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '0 0 16px 0', maxWidth: 400 }}>
        {hasInstances
          ? 'Nenhum chip corresponde aos filtros selecionados. Tente alterar sua busca.'
          : 'Nenhum chip cadastrado na frota. Adicione uma nova instância para começar.'}
      </p>
      <button type="button" className="btn-primary" onClick={onOpenCreate}>
        <IconPlus size={16} />
        <span>Cadastrar Primeiro Chip</span>
      </button>
    </div>
  );
}
