import { useRef } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { IconTrash } from '../icons';

export interface DeleteConfirmModalProps {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ name, onClose, onConfirm }: DeleteConfirmModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.4)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Excluir alimento"
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Excluir alimento</h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            Tem certeza que deseja excluir <strong style={{ color: 'var(--fg)' }}>{name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--coral)', color: '#fff', borderColor: 'transparent' }}
              onClick={onConfirm}
            >
              <IconTrash size={13} /> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
