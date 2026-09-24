import type { PlanTemplateResponse } from '../../api/planTemplates';

interface TemplateDeleteConfirmModalProps {
  template: PlanTemplateResponse;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TemplateDeleteConfirmModal({
  template,
  isPending,
  onClose,
  onConfirm,
}: TemplateDeleteConfirmModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 300,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="card"
        style={{ width: 'min(400px, 100%)', padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>Excluir Modelo</div>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '10px 0 16px' }}>
          Tem certeza que deseja excluir o modelo <strong>{template.name}</strong>? Esta ação não
          pode ser desfeita.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirm-delete-template"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isPending}
            style={{ background: 'var(--coral)', borderColor: 'var(--coral)', color: '#fff' }}
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
