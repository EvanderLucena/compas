import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalA11y } from '../../hooks/useModalA11y';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmIcon?: ReactNode;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function getConfirmStyle(variant?: 'danger' | 'warning' | 'primary') {
  switch (variant) {
    case 'warning':
      return {
        background: 'var(--amber, #f59e0b)',
        color: '#fff',
        borderColor: 'transparent',
      };
    case 'primary':
      return {
        background: 'var(--primary, #166534)',
        color: '#fff',
        borderColor: 'transparent',
      };
    case 'danger':
    default:
      return {
        background: 'var(--coral, #ef4444)',
        color: '#fff',
        borderColor: 'transparent',
      };
  }
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  confirmIcon,
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ open: isOpen, onClose, containerRef });

  if (!isOpen) return null;

  const confirmBtnStyle = getConfirmStyle(variant);

  return createPortal(
    <div
      data-testid="confirm-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 12, 10, 0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={isPending ? undefined : onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card outline-none"
        data-testid="confirm-modal-dialog"
        style={{
          width: 'min(420px, 100%)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.25)',
          borderRadius: 8,
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px' }}>
          <h3
            id={titleId}
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: '0 0 8px',
              color: 'var(--ink)',
            }}
          >
            {title}
          </h3>
          <div
            style={{
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="btn"
              data-testid="confirm-modal-button"
              style={confirmBtnStyle}
              onClick={onConfirm}
              disabled={isPending}
            >
              {confirmIcon && (
                <span style={{ display: 'inline-flex', marginRight: 4, alignItems: 'center' }}>
                  {confirmIcon}
                </span>
              )}
              {isPending ? 'Processando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
