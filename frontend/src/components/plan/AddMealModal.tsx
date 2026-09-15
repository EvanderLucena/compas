import { useValidation } from '../../hooks/useValidation';
import { IconPlus, IconX } from '../icons';

interface AddMealModalProps {
  onClose: () => void;
  onAdd: (data: { label: string; time: string }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

interface MealForm {
  label: string;
  time: string;
  errors: Record<string, string>;
  set: (k: string, v: string) => void;
  onBlur: (k: string) => () => void;
  validateAll: () => boolean;
  reset: () => void;
}

function useMealForm(): MealForm {
  const { values, errors, set, onBlur, validateAll, reset } = useValidation(
    { label: '', time: '' } as Record<string, string>,
    {
      label: {
        required: true,
        requiredMessage: 'Nome da refeição é obrigatório.',
        minLength: 2,
        minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
      },
      time: {
        required: true,
        requiredMessage: 'Horário é obrigatório.',
      },
    },
  );
  return { label: values.label, time: values.time, errors, set, onBlur, validateAll, reset };
}

function MealLabelInput({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label className="eyebrow" htmlFor="meal-label">
        Nome
      </label>
      <input
        id="meal-label"
        data-testid="addmeal-label"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'meal-label-error' : undefined}
        placeholder="ex: Lanche pré-treino"
        style={{
          padding: '8px 10px',
          border: `1px solid ${error ? 'var(--coral)' : 'var(--border)'}`,
          borderRadius: 6,
          fontSize: 13,
          background: 'var(--surface)',
          outline: 'none',
          color: 'var(--fg)',
        }}
      />
      {error && (
        <p id="meal-label-error" className="text-xs text-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function MealTimeInput({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label className="eyebrow" htmlFor="meal-time">
        Horário
      </label>
      <input
        id="meal-time"
        data-testid="addmeal-time"
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'meal-time-error' : undefined}
        style={{
          padding: '8px 10px',
          border: `1px solid ${error ? 'var(--coral)' : 'var(--border)'}`,
          borderRadius: 6,
          fontSize: 13,
          background: 'var(--surface)',
          outline: 'none',
          color: 'var(--fg)',
          fontFamily: 'var(--font-mono)',
        }}
      />
      {error && (
        <p id="meal-time-error" className="text-xs text-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AddMealModal({ onClose, onAdd, isSubmitting = false, error }: AddMealModalProps) {
  const form = useMealForm();

  const handleSave = () => {
    if (!form.validateAll()) return;
    onAdd({ label: form.label.trim(), time: form.time });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

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
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-meal-title"
        className="card"
        style={{ width: 'min(420px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div id="add-meal-title" className="title">
            Nova refeição
          </div>
          <div className="spacer" />
          <button onClick={handleClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}>
            <IconX size={14} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && (
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
              {error}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <MealLabelInput
              value={form.label}
              error={form.errors.label}
              onChange={(v) => form.set('label', v)}
              onBlur={form.onBlur('label')}
            />
            <MealTimeInput
              value={form.time}
              error={form.errors.time}
              onChange={(v) => form.set('time', v)}
              onBlur={form.onBlur('time')}
            />
          </div>
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
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancelar
          </button>
          <button
            data-testid="btn-add-meal"
            className="btn btn-primary"
            disabled={!form.label.trim() || !form.time || isSubmitting}
            onClick={handleSave}
            style={{ opacity: form.label.trim() && form.time && !isSubmitting ? 1 : 0.45 }}
          >
            <IconPlus size={13} /> {isSubmitting ? 'Criando...' : 'Criar refeição'}
          </button>
        </div>
      </div>
    </div>
  );
}
