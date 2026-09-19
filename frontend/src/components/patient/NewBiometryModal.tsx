import * as React from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { BiometryAssessmentDTO, CreateBiometryAssessmentRequest } from '../../types/patient';
import { resolveMutationErrorMessage } from '../../stores/patientStore';
import { IconPlus, IconX } from '../icons';
import { useValidation } from '../../hooks/useValidation';
import { parseNumberInput } from '../../utils/numberInput';
import { useModalA11y } from '../../hooks/useModalA11y';

const SKINFOLD_KEYS = [
  'peitoral',
  'axilar_medio',
  'triceps',
  'subescapular',
  'abdominal',
  'suprailiaco',
  'coxa',
];
const SKINFOLD_LABELS: Record<string, string> = {
  peitoral: 'Peitoral',
  axilar_medio: 'Axilar médio',
  triceps: 'Tríceps',
  subescapular: 'Subescapular',
  abdominal: 'Abdominal',
  suprailiaco: 'Suprailíaco',
  coxa: 'Coxa',
};

const PERIMETRY_KEYS = [
  'cintura',
  'abdomen',
  'quadril',
  'braco_d',
  'braco_e',
  'coxa_d',
  'coxa_e',
  'panturrilha_d',
];
const PERIMETRY_LABELS: Record<string, string> = {
  cintura: 'Cintura',
  abdomen: 'Abdômen',
  quadril: 'Quadril',
  braco_d: 'Braço D',
  braco_e: 'Braço E',
  coxa_d: 'Coxa D',
  coxa_e: 'Coxa E',
  panturrilha_d: 'Panturrilha D',
};

interface NewBiometryModalProps {
  createMutation: UseMutationResult<BiometryAssessmentDTO, Error, CreateBiometryAssessmentRequest>;
  onSuccess: () => void;
  onClose: () => void;
}

export function NewBiometryModal({ createMutation, onSuccess, onClose }: NewBiometryModalProps) {
  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      assessmentDate: new Date().toISOString().slice(0, 10),
      weight: '',
      bodyFatPercent: '',
      leanMassKg: '',
      waterPercent: '',
      visceralFatLevel: '',
      bmrKcal: '',
      notes: '',
    } as Record<string, string>,
    {
      assessmentDate: {
        required: true,
        requiredMessage: 'Data da avaliação é obrigatória.',
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const d = new Date(v);
          if (isNaN(d.getTime())) return 'Data inválida.';
          if (d > new Date()) return 'Data não pode ser no futuro.';
          return undefined;
        },
      },
      weight: {
        required: true,
        requiredMessage: 'Peso é obrigatório.',
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n) || n <= 0) return 'Informe um peso válido em kg.';
          if (n > 500) return 'Peso deve ser menor que 500 kg.';
          return undefined;
        },
      },
      bodyFatPercent: {
        required: true,
        requiredMessage: '% de gordura é obrigatório.',
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n)) return 'Valor numérico inválido para % de gordura.';
          if (n <= 0 || n > 100) return '% de gordura deve estar entre 0,01 e 100.';
          return undefined;
        },
      },
      leanMassKg: {
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n)) return 'Valor numérico inválido para massa magra.';
          if (n < 0) return 'Massa magra não pode ser negativa.';
          return undefined;
        },
      },
      waterPercent: {
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n)) return 'Valor numérico inválido para % de água.';
          if (n < 0 || n > 100) return '% de água deve estar entre 0 e 100.';
          return undefined;
        },
      },
      visceralFatLevel: {
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n) || !Number.isInteger(n))
            return 'Nível de gordura visceral deve ser um número inteiro.';
          if (n < 0) return 'Nível de gordura visceral não pode ser negativo.';
          return undefined;
        },
      },
      bmrKcal: {
        custom: (v: string) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (!Number.isFinite(n) || !Number.isInteger(n)) return 'TMB deve ser um número inteiro.';
          if (n < 0) return 'TMB não pode ser negativa.';
          return undefined;
        },
      },
    },
  );

  const [skinfoldValues, setSkinfoldValues] = React.useState<Record<string, string>>({});
  const [skinfoldErrors, setSkinfoldErrors] = React.useState<Record<string, string>>({});
  const [perimetryValues, setPerimetryValues] = React.useState<Record<string, string>>({});
  const [perimetryErrors, setPerimetryErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const parseDecimal = (rawValue: string): number | null => {
    if (!rawValue.trim()) return null;
    const n = parseNumberInput(rawValue);
    return Number.isFinite(n) ? n : null;
  };

  const parseInteger = (rawValue: string): number | null => {
    const parsed = parseDecimal(rawValue);
    if (parsed == null || !Number.isInteger(parsed)) return null;
    return parsed;
  };

  const validateSkinfold = (key: string, value: string): string | undefined => {
    if (!value.trim()) return undefined;
    const parsed = parseDecimal(value);
    if (parsed == null) return `Valor inválido em ${SKINFOLD_LABELS[key]}.`;
    if (parsed < 0) return `${SKINFOLD_LABELS[key]} não pode ser negativo.`;
    return undefined;
  };

  const validatePerimetry = (key: string, value: string): string | undefined => {
    if (!value.trim()) return undefined;
    const parsed = parseDecimal(value);
    if (parsed == null) return `Valor inválido em ${PERIMETRY_LABELS[key]}.`;
    if (parsed < 0) return `${PERIMETRY_LABELS[key]} não pode ser negativo.`;
    return undefined;
  };

  const handleSubmit = () => {
    setSubmitError(null);

    if (!validateAll()) return;

    let hasInvalid = false;
    const newSkinfoldErrors: Record<string, string> = {};
    for (const key of SKINFOLD_KEYS) {
      const val = skinfoldValues[key]?.trim() ?? '';
      if (val) {
        const err = validateSkinfold(key, val);
        if (err) {
          newSkinfoldErrors[key] = err;
          hasInvalid = true;
        }
      }
    }
    setSkinfoldErrors(newSkinfoldErrors);

    const newPerimetryErrors: Record<string, string> = {};
    for (const key of PERIMETRY_KEYS) {
      const val = perimetryValues[key]?.trim() ?? '';
      if (val) {
        const err = validatePerimetry(key, val);
        if (err) {
          newPerimetryErrors[key] = err;
          hasInvalid = true;
        }
      }
    }
    setPerimetryErrors(newPerimetryErrors);

    if (hasInvalid) return;

    const weight = parseDecimal(form.weight);
    const bodyFatPercent = parseDecimal(form.bodyFatPercent);
    const leanMassKg = parseDecimal(form.leanMassKg);
    const waterPercent = parseDecimal(form.waterPercent);
    const visceralFatLevel = parseInteger(form.visceralFatLevel);
    const bmrKcal = parseInteger(form.bmrKcal);

    const skinfolds = SKINFOLD_KEYS.flatMap((key, i) => {
      const rawValue = skinfoldValues[key]?.trim() ?? '';
      if (!rawValue) return [];
      const parsed = parseDecimal(rawValue);
      if (parsed == null) return [];
      return [{ measureKey: key, valueMm: parsed, sortOrder: i + 1 }];
    });

    const perimetry = PERIMETRY_KEYS.flatMap((key, i) => {
      const rawValue = perimetryValues[key]?.trim() ?? '';
      if (!rawValue) return [];
      const parsed = parseDecimal(rawValue);
      if (parsed == null) return [];
      return [{ measureKey: key, valueCm: parsed, sortOrder: i + 1 }];
    });

    const payload: CreateBiometryAssessmentRequest = {
      assessmentDate: form.assessmentDate,
      weight: weight!,
      bodyFatPercent,
      leanMassKg,
      waterPercent,
      visceralFatLevel,
      bmrKcal,
      notes: form.notes || null,
      skinfolds: skinfolds.length > 0 ? skinfolds : undefined,
      perimetry: perimetry.length > 0 ? perimetry : undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        setSubmitError(
          resolveMutationErrorMessage(
            error,
            'Não foi possível salvar a avaliação. Tente novamente.',
          ),
        );
      },
    });
  };

  const isSubmitting = createMutation.isPending;
  const parsedWeight = parseDecimal(form.weight);
  const parsedBodyFat = parseDecimal(form.bodyFatPercent);
  const canSubmit =
    Boolean(form.assessmentDate) &&
    parsedWeight != null &&
    parsedWeight > 0 &&
    parsedBodyFat != null &&
    parsedBodyFat > 0;
  const containerRef = React.useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.45)',
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
        aria-labelledby="new-biometry-title"
        tabIndex={-1}
        className="card outline-none"
        style={{
          width: 'min(680px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div id="new-biometry-title" className="title">
            Nova avaliação biométrica
          </div>
          <div className="spacer" />
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
            Preencha só o que tiver disponível
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 6px', marginLeft: 8 }}
          >
            <IconX size={14} />
          </button>
        </div>

        <div
          style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <BioField
              label="Data da avaliação"
              type="date"
              value={form.assessmentDate}
              onChange={(v) => set('assessmentDate', v)}
              onBlur={() => onBlur('assessmentDate')()}
              error={errors.assessmentDate}
            />
            <BioField
              label="Peso (kg)"
              inputMode="decimal"
              placeholder="64,2"
              mono
              value={form.weight}
              onChange={(v: string) => set('weight', v)}
              onBlur={() => onBlur('weight')()}
              error={errors.weight}
            />
          </div>

          <div className="divider">
            <span>Bioimpedância · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <BioField
              label="% Gordura"
              inputMode="decimal"
              placeholder="22,8"
              mono
              value={form.bodyFatPercent}
              onChange={(v: string) => set('bodyFatPercent', v)}
              onBlur={() => onBlur('bodyFatPercent')()}
              error={errors.bodyFatPercent}
            />
            <BioField
              label="Massa magra (kg)"
              inputMode="decimal"
              placeholder="49,8"
              mono
              value={form.leanMassKg}
              onChange={(v: string) => set('leanMassKg', v)}
              onBlur={() => onBlur('leanMassKg')()}
              error={errors.leanMassKg}
            />
            <BioField
              label="% Água"
              inputMode="decimal"
              placeholder="54,2"
              mono
              value={form.waterPercent}
              onChange={(v: string) => set('waterPercent', v)}
              onBlur={() => onBlur('waterPercent')()}
              error={errors.waterPercent}
            />
            <BioField
              label="Gordura visceral · nível"
              inputMode="decimal"
              placeholder="6"
              mono
              value={form.visceralFatLevel}
              onChange={(v: string) => set('visceralFatLevel', v)}
              onBlur={() => onBlur('visceralFatLevel')()}
              error={errors.visceralFatLevel}
            />
            <BioField
              label="TMB (kcal)"
              inputMode="decimal"
              placeholder="1420"
              mono
              value={form.bmrKcal}
              onChange={(v: string) => set('bmrKcal', v)}
              onBlur={() => onBlur('bmrKcal')()}
              error={errors.bmrKcal}
            />
          </div>

          <div className="divider">
            <span>Dobras cutâneas · mm · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {SKINFOLD_KEYS.map((k) => (
              <BioField
                key={k}
                inputMode="decimal"
                label={SKINFOLD_LABELS[k]}
                placeholder="—"
                mono
                value={skinfoldValues[k] ?? ''}
                onChange={(v: string) => {
                  setSkinfoldValues((prev) => ({ ...prev, [k]: v }));
                  const err = validateSkinfold(k, v);
                  setSkinfoldErrors((prev) => {
                    const next = { ...prev };
                    if (err) next[k] = err;
                    else delete next[k];
                    return next;
                  });
                }}
                onBlur={() => {
                  const val = skinfoldValues[k]?.trim() ?? '';
                  const err = validateSkinfold(k, val);
                  setSkinfoldErrors((prev) => {
                    const next = { ...prev };
                    if (err) next[k] = err;
                    else delete next[k];
                    return next;
                  });
                }}
                error={skinfoldErrors[k]}
              />
            ))}
          </div>
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--surface-2)',
              borderRadius: 6,
              fontSize: 11.5,
              color: 'var(--fg-muted)',
              lineHeight: 1.5,
            }}
          >
            <span
              className="mono"
              style={{ color: 'var(--fg-subtle)', marginRight: 6, fontSize: 10 }}
            >
              FÓRMULA
            </span>
            Se todas as 7 dobras forem preenchidas, % gordura é calculado por Jackson &amp; Pollock
            (1978) + Siri.
          </div>

          <div className="divider">
            <span>Perimetria · cm · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {PERIMETRY_KEYS.map((k) => (
              <BioField
                key={k}
                inputMode="decimal"
                label={PERIMETRY_LABELS[k]}
                placeholder="—"
                mono
                value={perimetryValues[k] ?? ''}
                onChange={(v: string) => {
                  setPerimetryValues((prev) => ({ ...prev, [k]: v }));
                  const err = validatePerimetry(k, v);
                  setPerimetryErrors((prev) => {
                    const next = { ...prev };
                    if (err) next[k] = err;
                    else delete next[k];
                    return next;
                  });
                }}
                onBlur={() => {
                  const val = perimetryValues[k]?.trim() ?? '';
                  const err = validatePerimetry(k, val);
                  setPerimetryErrors((prev) => {
                    const next = { ...prev };
                    if (err) next[k] = err;
                    else delete next[k];
                    return next;
                  });
                }}
                error={perimetryErrors[k]}
              />
            ))}
          </div>

          <BioField
            label="Observações · opcional"
            kind="textarea"
            placeholder="ex: paciente em jejum, avaliação pós-treino"
            value={form.notes}
            onChange={(v) => set('notes', v)}
          />

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
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'var(--surface-2)',
          }}
        >
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            data-testid="btn-save-biometry"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            style={{ opacity: !canSubmit || isSubmitting ? 0.5 : 1 }}
          >
            <IconPlus size={13} /> {isSubmitting ? 'Salvando...' : 'Registrar avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BioField({
  label,
  placeholder,
  type,
  inputMode,
  kind,
  mono,
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  inputMode?: 'decimal' | 'numeric' | 'text' | 'tel' | 'url' | 'email' | 'search';
  kind?: string;
  mono?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const style: React.CSSProperties = {
    padding: '8px 10px',
    border: `1px solid ${error ? 'var(--coral)' : 'var(--border)'}`,
    borderRadius: 6,
    fontSize: 13,
    background: 'var(--surface)',
    outline: 'none',
    width: '100%',
    color: 'var(--fg)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label className="eyebrow" htmlFor={fieldId}>
        {label}
      </label>
      {kind === 'textarea' ? (
        <textarea
          id={fieldId}
          placeholder={placeholder}
          rows={2}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          style={{ ...style, resize: 'vertical', fontFamily: 'var(--font-ui)' }}
        />
      ) : (
        <input
          id={fieldId}
          type={type || 'text'}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          style={style}
        />
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-xs text-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
