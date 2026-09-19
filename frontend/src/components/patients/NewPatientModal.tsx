import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { OBJECTIVE_LABELS, OBJECTIVE_KEYS } from '../../types/patient';
import type { ObjectiveOption } from '../../types/patient';
import { useValidation } from '../../hooks/useValidation';
import { parseNumberInput } from '../../utils/numberInput';

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

interface NewPatientModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSave?: (data: {
    name: string;
    objective: ObjectiveOption;
    birthDate?: string;
    sex: 'F' | 'M';
    heightCm?: number;
    whatsapp?: string;
    terms: boolean;
  }) => void;
}

export function NewPatientModal({
  open,
  onClose,
  onSave,
  isSubmitting = false,
  errorMessage,
}: NewPatientModalProps) {
  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
    reset,
  } = useValidation(
    {
      name: '',
      objective: '',
      birthDate: '',
      heightCm: '',
      whatsapp: '',
      notes: '',
    } as Record<string, string>,
    {
      name: {
        required: true,
        requiredMessage: 'Nome é obrigatório.',
        minLength: 2,
        minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
      },
      objective: {
        required: true,
        requiredMessage: 'Selecione um objetivo.',
      },
      heightCm: {
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n)) return 'Altura deve ser um número.';
          if (n < 50 || n > 250) return 'Altura deve estar entre 50 e 250 cm.';
          return undefined;
        },
      },
      whatsapp: {
        custom: (v: string) => {
          const digits = stripPhone(v).replace(/\D/g, '');
          if (!digits) return undefined;
          if (digits.length < 10) return 'WhatsApp deve ter pelo menos 10 dígitos.';
          if (digits.length > 11) return 'WhatsApp deve ter no máximo 11 dígitos.';
          return undefined;
        },
      },
      birthDate: {
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const d = new Date(v);
          if (isNaN(d.getTime())) return 'Data inválida.';
          if (d > new Date()) return 'Data não pode ser no futuro.';
          return undefined;
        },
      },
    },
  );

  const [sex, setSex] = useState<'F' | 'M'>('F');
  const [terms, setTerms] = useState(false);

  const handleSubmit = () => {
    if (!terms) return;
    if (!validateAll()) return;
    const parsedHeightCm = form.heightCm.trim() ? parseNumberInput(form.heightCm) : undefined;
    onSave?.({
      name: form.name.trim(),
      objective: form.objective as ObjectiveOption,
      ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      sex,
      ...(parsedHeightCm !== undefined && Number.isFinite(parsedHeightCm)
        ? { heightCm: parsedHeightCm }
        : {}),
      ...(stripPhone(form.whatsapp) ? { whatsapp: stripPhone(form.whatsapp) } : {}),
      terms,
    });
  };

  const handleClose = () => {
    reset();
    setSex('F');
    setTerms(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Novo paciente">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--coral)',
              borderRadius: 6,
              color: 'var(--coral)',
              fontSize: 13,
            }}
          >
            {errorMessage}
          </div>
        )}
        <Input
          label="Nome completo"
          placeholder="ex: Ana Beatriz Lima"
          error={errors.name}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={onBlur('name')}
          data-testid="newpatient-name"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input
            label="Data de nascimento"
            type="date"
            error={errors.birthDate}
            value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
            onBlur={onBlur('birthDate')}
          />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow">Sexo</label>
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
          <Input
            label="Altura (cm)"
            placeholder="168"
            error={errors.heightCm}
            value={form.heightCm}
            onChange={(e) => set('heightCm', e.target.value)}
            onBlur={onBlur('heightCm')}
          />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow">Objetivo</label>
            <select
              data-testid="newpatient-objective"
              value={form.objective}
              onChange={(e) => set('objective', e.target.value)}
              onBlur={onBlur('objective')}
              aria-invalid={errors.objective ? 'true' : undefined}
              style={{
                padding: '8px 10px',
                border: `1px solid ${errors.objective ? 'var(--coral)' : 'var(--border)'}`,
                borderRadius: 6,
                fontSize: 13,
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontFamily: 'var(--font-ui)',
                width: '100%',
              }}
            >
              <option value="">Selecione…</option>
              {OBJECTIVE_KEYS.map((o) => (
                <option key={o} value={o}>
                  {OBJECTIVE_LABELS[o]}
                </option>
              ))}
            </select>
            {errors.objective && (
              <p id="objective-error" className="text-xs text-coral" role="alert">
                {errors.objective}
              </p>
            )}
          </div>
        </div>

        <div className="divider">
          <span>Contato</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="eyebrow">WhatsApp</label>
          <input
            data-testid="newpatient-whatsapp"
            value={form.whatsapp}
            onChange={(e) => set('whatsapp', formatPhone(stripPhone(e.target.value)))}
            type="tel"
            placeholder="(11) 99999-9999"
            aria-invalid={errors.whatsapp ? 'true' : undefined}
            aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined}
            style={{
              padding: '8px 10px',
              border: `1px solid ${errors.whatsapp ? 'var(--coral)' : 'var(--border)'}`,
              borderRadius: 6,
              fontSize: 13,
              background: 'var(--surface)',
              color: 'var(--fg)',
              fontFamily: 'var(--font-mono)',
              width: '100%',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={(e) => {
              if (!errors.whatsapp) e.target.style.borderColor = 'var(--fg-muted)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.whatsapp ? 'var(--coral)' : 'var(--border)';
              onBlur('whatsapp')();
            }}
          />
          {errors.whatsapp && (
            <p id="whatsapp-error" className="text-xs text-coral" role="alert">
              {errors.whatsapp}
            </p>
          )}
        </div>
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--surface-2)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--fg-muted)',
            lineHeight: 1.55,
          }}
        >
          <span className="mono" style={{ fontSize: 10, color: 'var(--lime-dim)', marginRight: 6 }}>
            IA
          </span>
          O paciente vai receber a IA por este número. Certifique que está correto antes de salvar.
        </div>

        <Input
          label="Observações iniciais · opcional"
          placeholder="ex: histórico de diabetes, alergia a lactose"
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: 12.5,
            color: 'var(--fg-muted)',
            lineHeight: 1.5,
          }}
        >
          <input
            data-testid="newpatient-terms"
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            Confirmo que o paciente autorizou o tratamento dos dados de saúde conforme LGPD.
          </span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          data-testid="newpatient-submit"
          disabled={!form.name.trim() || !form.objective || !terms || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Salvando...' : 'Cadastrar paciente'}
        </Button>
      </div>
    </Modal>
  );
}
