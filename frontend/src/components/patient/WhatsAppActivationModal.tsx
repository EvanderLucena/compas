import { useRef } from 'react';
import type { Patient } from '../../types/patient';
import { IconWhatsapp, IconEdit, IconX } from '../icons';
import { useModalA11y } from '../../hooks/useModalA11y';

interface WhatsAppActivationModalProps {
  patient: Patient;
  onClose: () => void;
  onEditPatient: () => void;
}

export function WhatsAppActivationModal({
  patient,
  onClose,
  onEditPatient,
}: WhatsAppActivationModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const handleEdit = () => {
    onClose();
    onEditPatient();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ativar WhatsApp"
        tabIndex={-1}
        className="card outline-none"
        style={{
          width: 380,
          padding: 28,
          borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconWhatsapp size={20} style={{ color: 'var(--fg-subtle)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Ativar WhatsApp</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 6px' }} onClick={onClose}>
            <IconX size={14} />
          </button>
        </div>

        <p
          style={{ fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.5, margin: '0 0 20px' }}
        >
          Cadastre o WhatsApp do paciente para ativar as conversas com IA. Assim que o número for
          cadastrado, você pode gerar o link de ativação.
        </p>

        <div
          style={{
            padding: '12px 16px',
            background: 'var(--surface-2)',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--fg-muted)',
          }}
        >
          <div style={{ fontWeight: 500, color: 'var(--fg)', marginBottom: 4 }}>{patient.name}</div>
          <div>
            WhatsApp: <span style={{ color: 'var(--coral)' }}>Não cadastrado</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleEdit}>
            <IconEdit size={12} /> Editar paciente
          </button>
        </div>
      </div>
    </div>
  );
}
