import { useState, useRef, useId } from 'react';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { IconX, IconEdit } from '../../icons';
import { useUpdateFleetInstance } from '../../../stores/adminWhatsappStore';
import type { WhatsAppFleetInstance } from '../../../types/whatsappFleet';

interface EditInstanceModalProps {
  instance: WhatsAppFleetInstance;
  onClose: () => void;
}

export function EditInstanceModal({ instance, onClose }: EditInstanceModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const [phoneNumber, setPhoneNumber] = useState(instance.phoneNumber || '');
  const [description, setDescription] = useState(instance.description || '');
  const [maxPatients, setMaxPatients] = useState<number>(instance.maxPatients || 180);
  const [active, setActive] = useState<boolean>(instance.active);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateMutation = useUpdateFleetInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (maxPatients < 10 || maxPatients > 500) {
      errors.maxPatients = 'A capacidade deve ser entre 10 e 500 pacientes';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    await updateMutation.mutateAsync({
      id: instance.id,
      req: {
        phoneNumber: phoneNumber.trim() || undefined,
        description: description.trim() || undefined,
        maxPatients,
        active,
      },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          padding: 24,
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--surface-2)',
                color: 'var(--fg)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconEdit size={18} />
            </div>
            <div>
              <h2 id={titleId} style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Editar Instância
              </h2>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {instance.name}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 6, borderRadius: '50%' }}
            title="Fechar"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Número de Telefone
            </label>
            <input
              type="text"
              placeholder="ex: +5511999998888"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input mono"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Descrição / Operadora
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
              }}
            />
          </div>

          {/* Max Patients */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Limite Máximo de Pacientes
            </label>
            <input
              type="number"
              min={10}
              max={500}
              value={maxPatients}
              onChange={(e) => setMaxPatients(parseInt(e.target.value, 10) || 180)}
              className="input mono"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                border: fieldErrors.maxPatients
                  ? '1px solid var(--coral)'
                  : '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
              }}
            />
            {fieldErrors.maxPatients && (
              <span style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4, display: 'block' }}>
                {fieldErrors.maxPatients}
              </span>
            )}
            <span
              style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4, display: 'block' }}
            >
              Atualmente: {instance.patientCount} pacientes vinculados.
            </span>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="activeCheckbox" style={{ fontSize: 13, cursor: 'pointer' }}>
              Instância ativa para receber novos pacientes automaticamente
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateMutation.isPending}
              style={{ padding: '8px 20px' }}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
