import { useId, useRef } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';

interface TogglePatientModalProps {
  name: string;
  activating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TogglePatientModal({
  name,
  activating,
  onClose,
  onConfirm,
}: TogglePatientModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px' }}>
          <h3 id={titleId} style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
            {activating ? 'Reativar paciente' : 'Desativar paciente'}
          </h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            {activating ? (
              <>
                Deseja reativar <strong style={{ color: 'var(--fg)' }}>{name}</strong>? O paciente
                voltará a aparecer na carteira ativa.
              </>
            ) : (
              <>
                Deseja desativar <strong style={{ color: 'var(--fg)' }}>{name}</strong>? Os dados
                serão preservados e o paciente poderá ser reativado depois.
              </>
            )}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn"
              style={
                activating
                  ? { background: 'var(--sage)', color: '#fff', borderColor: 'transparent' }
                  : { background: 'var(--amber)', color: '#fff', borderColor: 'transparent' }
              }
              onClick={onConfirm}
              autoFocus
            >
              {activating ? 'Reativar' : 'Desativar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
