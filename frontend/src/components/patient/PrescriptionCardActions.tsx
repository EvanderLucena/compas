import { IconTrash } from '../icons';

export interface PrescriptionCardActionsProps {
  onDownloadPdf: () => void;
  onCopyWhatsApp: () => void;
  onSendWhatsApp: () => void;
  onEdit: () => void;
  onDelete: () => void;
  downloading: boolean;
}

export function PrescriptionCardActions({
  onDownloadPdf,
  onCopyWhatsApp,
  onSendWhatsApp,
  onEdit,
  onDelete,
  downloading,
}: PrescriptionCardActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onDownloadPdf}
        disabled={downloading}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        📄 {downloading ? 'Baixando...' : 'Receituário PDF'}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onCopyWhatsApp}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        📋 Copiar WhatsApp
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onSendWhatsApp}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        💬 Enviar no WhatsApp
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onEdit}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        ✏️ Editar
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onDelete}
        style={{ fontSize: 12, color: 'var(--coral, #ef4444)' }}
        title="Excluir prescrição"
      >
        <IconTrash size={13} />
      </button>
    </div>
  );
}
