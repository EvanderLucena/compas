import { useState, useRef } from 'react';
import { useUpdatePatient, resolveMutationErrorMessage } from '../../stores/patientStore';
import { useToastStore } from '../../stores/toastStore';
import type { Patient, ObjectiveOption } from '../../types/patient';
import { OBJECTIVE_LABELS, OBJECTIVE_KEYS, REVERSE_OBJECTIVE_LABELS } from '../../types/patient';
import { IconX, IconCheck } from '../icons';
import { useValidation } from '../../hooks/useValidation';
import { parseNumberInput } from '../../utils/numberInput';
import { useModalA11y } from '../../hooks/useModalA11y';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function stripPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export interface EditPatientModalProps {
  patient: Patient;
  open?: boolean;
  onClose: () => void;
}

// eslint-disable-next-line max-lines-per-function, complexity
export function EditPatientModal({ patient, open, onClose }: EditPatientModalProps) {
  const updateMutation = useUpdatePatient();
  const [sex, setSex] = useState(patient.sex || 'F');
  const [objective, setObjective] = useState<ObjectiveOption>(
    (REVERSE_OBJECTIVE_LABELS[patient.objective] ?? patient.objective) as ObjectiveOption,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      name: patient.name,
      birthDate: patient.birthDate ?? '',
      heightCm: patient.heightCm != null ? String(patient.heightCm) : '',
      whatsapp: formatPhone(patient.whatsapp ?? ''),
    } as Record<string, string>,
    {
      name: {
        required: true,
        requiredMessage: 'Nome é obrigatório.',
        minLength: 2,
        minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
      },
      birthDate: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const d = new Date(v);
          if (isNaN(d.getTime())) return 'Data inválida.';
          if (d > new Date()) return 'Data não pode ser no futuro.';
          return undefined;
        },
      },
      heightCm: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n)) return 'Altura deve ser um número.';
          if (n < 50 || n > 250) return 'Altura deve estar entre 50 e 250 cm.';
          return undefined;
        },
      },
      whatsapp: {
        custom: (v) => {
          const digits = stripPhone(v).replace(/\D/g, '');
          if (!digits) return undefined;
          if (digits.length < 10) return 'WhatsApp deve ter pelo menos 10 dígitos.';
          if (digits.length > 11) return 'WhatsApp deve ter no máximo 11 dígitos.';
          return undefined;
        },
      },
    },
  );

  const handleSave = () => {
    if (!validateAll()) return;
    setSubmitError(null);
    const parsedHeightCm = form.heightCm.trim() ? parseNumberInput(form.heightCm) : undefined;
    if (parsedHeightCm !== undefined && !Number.isFinite(parsedHeightCm)) {
      setSubmitError('Altura deve ser um número válido.');
      return;
    }

    updateMutation.mutate(
      {
        id: patient.id,
        data: {
          name: form.name.trim(),
          ...(form.birthDate ? { birthDate: form.birthDate } : {}),
          sex,
          ...(parsedHeightCm !== undefined ? { heightCm: parsedHeightCm } : {}),
          ...(stripPhone(form.whatsapp) ? { whatsapp: stripPhone(form.whatsapp) } : {}),
          objective,
        },
      },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Paciente atualizado com sucesso');
          onClose();
        },
        onError: (error) => {
          const message = resolveMutationErrorMessage(
            error,
            'Não foi possível atualizar o paciente. Tente novamente.',
          );
          setSubmitError(message);
          useToastStore.getState().showError(message);
        },
      },
    );
  };

  const fieldStyle = (hasError: boolean): React.CSSProperties => ({
    padding: '8px 10px',
    border: `1px solid ${hasError ? 'var(--coral)' : 'var(--border)'}`,
    borderRadius: 6,
    fontSize: 13,
    background: 'var(--surface)',
    outline: 'none',
    color: 'var(--fg)',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-ui)',
  });

  const canSubmit = form.name.trim().length >= 2 && !updateMutation.isPending;
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ open: open !== false, onClose, containerRef });

  if (open === false) return null;

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
        aria-label="Editar paciente"
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(480px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Editar paciente</div>
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
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="edit-name">
              Nome completo
            </label>
            <input
              id="edit-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={onBlur('name')}
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'edit-name-error' : undefined}
              placeholder="Ana Beatriz Lopes"
              style={fieldStyle(!!errors.name)}
            />
            {errors.name && (
              <p id="edit-name-error" className="text-xs text-coral" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="edit-birthdate">
                Data de nascimento
              </label>
              <input
                id="edit-birthdate"
                type="date"
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                onBlur={onBlur('birthDate')}
                aria-invalid={errors.birthDate ? 'true' : undefined}
                aria-describedby={errors.birthDate ? 'edit-birthdate-error' : undefined}
                style={fieldStyle(!!errors.birthDate)}
              />
              {errors.birthDate && (
                <p id="edit-birthdate-error" className="text-xs text-coral" role="alert">
                  {errors.birthDate}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Sexo</div>
              <div className="seg" style={{ height: 36 }}>
                <button className={sex === 'F' ? 'active' : ''} onClick={() => setSex('F')}>
                  Feminino
                </button>
                <button className={sex === 'M' ? 'active' : ''} onClick={() => setSex('M')}>
                  Masculino
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="edit-height">
                Altura (cm)
              </label>
              <input
                data-testid="editpatient-height"
                id="edit-height"
                inputMode="decimal"
                value={form.heightCm}
                onChange={(e) => set('heightCm', e.target.value)}
                onBlur={onBlur('heightCm')}
                aria-invalid={errors.heightCm ? 'true' : undefined}
                aria-describedby={errors.heightCm ? 'edit-height-error' : undefined}
                placeholder="168"
                style={{ ...fieldStyle(!!errors.heightCm), fontFamily: 'var(--font-mono)' }}
              />
              {errors.heightCm && (
                <p id="edit-height-error" className="text-xs text-coral" role="alert">
                  {errors.heightCm}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="edit-whatsapp">
                WhatsApp
              </label>
              <input
                data-testid="editpatient-whatsapp"
                id="edit-whatsapp"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', formatPhone(stripPhone(e.target.value)))}
                onBlur={onBlur('whatsapp')}
                type="tel"
                placeholder="(11) 99999-9999"
                aria-invalid={errors.whatsapp ? 'true' : undefined}
                aria-describedby={errors.whatsapp ? 'edit-whatsapp-error' : undefined}
                style={{ ...fieldStyle(!!errors.whatsapp), fontFamily: 'var(--font-mono)' }}
              />
              {errors.whatsapp && (
                <p id="edit-whatsapp-error" className="text-xs text-coral" role="alert">
                  {errors.whatsapp}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="edit-objective">
              Objetivo clínico
            </label>
            <select
              data-testid="editpatient-objective"
              id="edit-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value as ObjectiveOption)}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 13,
                background: 'var(--surface)',
                color: 'var(--fg)',
                width: '100%',
              }}
            >
              {OBJECTIVE_KEYS.map((o) => (
                <option key={o} value={o}>
                  {OBJECTIVE_LABELS[o]}
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(255,107,74,0.1)',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--coral)',
              }}
              role="alert"
            >
              {submitError}
            </div>
          )}
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
            Cancelar
          </button>
          <button
            data-testid="editpatient-submit"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.45 }}
          >
            <IconCheck size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
