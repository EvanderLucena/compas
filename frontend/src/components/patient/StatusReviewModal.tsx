import * as React from 'react';
import { useUpdatePatient } from '../../stores/patientStore';
import { useToastStore } from '../../stores/toastStore';
import type { PatientStatus } from '../../types/patient';
import { STATUS_LABELS, STATUS_COLORS } from '../../types/patient';
import { IconX, IconCheck } from '../icons';
import { useModalA11y } from '../../hooks/useModalA11y';

interface StatusReviewModalProps {
  patientId: string;
  currentStatus: PatientStatus;
  onClose: () => void;
}

const STATUS_OPTIONS: PatientStatus[] = ['ontrack', 'warning', 'danger'];

export function StatusReviewModal({ patientId, currentStatus, onClose }: StatusReviewModalProps) {
  const updateMutation = useUpdatePatient();
  const [selected, setSelected] = React.useState<PatientStatus>(currentStatus);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setErrorMessage(null);
  }, [selected]);

  const handleConfirm = () => {
    setErrorMessage(null);
    updateMutation.mutate(
      { id: patientId, data: { status: selected } },
      {
        onSuccess: () => {
          setErrorMessage(null);
          useToastStore.getState().showSuccess('Status atualizado com sucesso');
          onClose();
        },
        onError: () => {
          setErrorMessage('Não foi possível atualizar o status. Tente novamente.');
        },
      },
    );
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
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
        aria-label="Revisar status"
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Revisar status</div>
          <div className="spacer" />
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 6px' }}
          >
            <IconX size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="eyebrow">Status atual</div>
            <span className={`chip ${currentStatus}`}>{STATUS_LABELS[currentStatus]}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow">Novo status</div>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setSelected(status)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border:
                    selected === status
                      ? `2px solid ${STATUS_COLORS[status]}`
                      : '2px solid var(--border)',
                  background: selected === status ? 'var(--surface-2)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: selected === status ? '5px solid' : '2px solid',
                    borderColor: selected === status ? STATUS_COLORS[status] : 'var(--border-2)',
                    background: selected === status ? STATUS_COLORS[status] : 'transparent',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: selected === status ? 500 : 400,
                    color: 'var(--fg)',
                  }}
                >
                  {STATUS_LABELS[status]}
                </span>
              </button>
            ))}
          </div>

          {errorMessage ? (
            <div
              role="alert"
              aria-live="polite"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,107,74,0.35)',
                background: 'rgba(255,107,74,0.08)',
                color: 'var(--coral)',
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'var(--surface-2)',
          }}
        >
          <button className="btn btn-ghost" onClick={onClose}>
            Pular
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={updateMutation.isPending}
            style={{ opacity: updateMutation.isPending ? 0.6 : 1 }}
          >
            <IconCheck size={13} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
