import { useState, useRef, useId } from 'react';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { IconX, IconServer } from '../../icons';
import { useCreateFleetInstance } from '../../../stores/adminWhatsappStore';

interface CreateInstanceModalProps {
  onClose: () => void;
}

export function CreateInstanceModal({ onClose }: CreateInstanceModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [maxPatients, setMaxPatients] = useState<number>(180);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateFleetInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'O nome da instância é obrigatório';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name.trim())) {
      errors.name = 'O nome deve conter apenas letras, números, hífens ou underscores';
    }

    if (maxPatients < 10 || maxPatients > 500) {
      errors.maxPatients = 'A capacidade deve ser entre 10 e 500 pacientes';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    await createMutation.mutateAsync({
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      description: description.trim() || undefined,
      maxPatients,
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
              <IconServer size={18} />
            </div>
            <div>
              <h2 id={titleId} style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Novo Chip / Instância
              </h2>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                Adicionar número à frota de atendimento
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
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Identificador da Instância *
            </label>
            <input
              type="text"
              placeholder="ex: compas-chip-02"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input mono"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                border: fieldErrors.name ? '1px solid var(--coral)' : '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 13,
              }}
            />
            {fieldErrors.name && (
              <span style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4, display: 'block' }}>
                {fieldErrors.name}
              </span>
            )}
            <span
              style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4, display: 'block' }}
            >
              Identificador único usado na Evolution API (sem espaços nem acentos)
            </span>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Número de Telefone (opcional)
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
            <span
              style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4, display: 'block' }}
            >
              Formato internacional com DDI e DDD (ex: +5511999998888)
            </span>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Descrição / Operadora
            </label>
            <input
              type="text"
              placeholder="ex: Chip Vivo 02 - Atendimento Sul"
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
              Recomendado: 150 a 200 pacientes por número para evitar limitações e garantir rapidez
              nas respostas.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
              style={{ padding: '8px 20px' }}
            >
              {createMutation.isPending ? 'Salvando...' : 'Cadastrar Instância'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
