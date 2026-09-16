import { useState, useRef } from 'react';
import type { MealFood } from '../../types/plan';
import { FOOD_UNIT_SYMBOLS } from '../../types/food';
import { IconX, IconCheck } from '../icons';
import { useValidation } from '../../hooks/useValidation';
import { useModalA11y } from '../../hooks/useModalA11y';

interface EditFoodModalProps {
  item: MealFood;
  onClose: () => void;
  onSave: (item: MealFood) => void;
}

export function EditFoodModal({ item, onClose, onSave }: EditFoodModalProps) {
  const unitSymbol = FOOD_UNIT_SYMBOLS[item.unit as keyof typeof FOOD_UNIT_SYMBOLS] || 'g';
  const [prep, setPrep] = useState(item.prep);

  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      foodName: item.foodName,
      referenceAmount: String(item.referenceAmount),
      kcal: String(item.kcal),
      prot: String(item.prot),
      carb: String(item.carb),
      fat: String(item.fat),
    } as Record<string, string>,
    {
      foodName: {
        required: true,
        requiredMessage: 'Nome é obrigatório.',
        minLength: 2,
        minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
      },
      referenceAmount: {
        required: true,
        requiredMessage: 'Quantidade é obrigatória.',
        custom: (v) => {
          const n = Number(v.replace(',', '.'));
          if (!Number.isFinite(n) || n <= 0) return 'Quantidade deve ser maior que zero.';
          return undefined;
        },
      },
      kcal: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = Number(v.replace(',', '.'));
          if (!Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      prot: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = Number(v.replace(',', '.'));
          if (!Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      carb: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = Number(v.replace(',', '.'));
          if (!Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      fat: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = Number(v.replace(',', '.'));
          if (!Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
    },
  );

  const handleSave = () => {
    if (!validateAll()) return;
    onSave({
      ...item,
      foodName: form.foodName.trim(),
      prep,
      referenceAmount: Number(form.referenceAmount) || 0,
      kcal: Number(form.kcal) || 0,
      prot: Number(form.prot) || 0,
      carb: Number(form.carb) || 0,
      fat: Number(form.fat) || 0,
    });
  };

  const fieldStyle = (hasError: boolean, mono = false): React.CSSProperties => ({
    padding: '8px 10px',
    border: `1px solid ${hasError ? 'var(--coral)' : 'var(--border)'}`,
    borderRadius: 6,
    fontSize: 13,
    background: 'var(--surface)',
    outline: 'none',
    color: 'var(--fg)',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
  });

  const containerRef = useRef<HTMLDivElement>(null);
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
        aria-label="Editar alimento"
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(460px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Editar alimento</div>
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
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--fg-subtle)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Alimento vinculado ao catálogo
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="edit-food-name">
              Nome
            </label>
            <input
              id="edit-food-name"
              autoComplete="off"
              value={form.foodName}
              onChange={(e) => set('foodName', e.target.value)}
              onBlur={onBlur('foodName')}
              aria-invalid={errors.foodName ? 'true' : undefined}
              aria-describedby={errors.foodName ? 'edit-food-name-error' : undefined}
              style={fieldStyle(!!errors.foodName)}
            />
            {errors.foodName && (
              <p id="edit-food-name-error" className="text-xs text-coral" role="alert">
                {errors.foodName}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label className="eyebrow" htmlFor="edit-ref-amount">
                  Referência
                </label>
                <input
                  id="edit-ref-amount"
                  autoComplete="off"
                  value={form.referenceAmount}
                  onChange={(e) => set('referenceAmount', e.target.value)}
                  onBlur={onBlur('referenceAmount')}
                  aria-invalid={errors.referenceAmount ? 'true' : undefined}
                  aria-describedby={errors.referenceAmount ? 'edit-ref-amount-error' : undefined}
                  style={fieldStyle(!!errors.referenceAmount, true)}
                />
                {errors.referenceAmount && (
                  <p id="edit-ref-amount-error" className="text-xs text-coral" role="alert">
                    {errors.referenceAmount}
                  </p>
                )}
              </div>
            </div>
            <div
              className="mono"
              style={{ fontSize: 13, color: 'var(--fg-muted)', paddingBottom: 12 }}
            >
              Uni: {unitSymbol}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="edit-prep">
              Preparo
            </label>
            <input
              id="edit-prep"
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
              placeholder="ex: grelhado, cozido"
              style={fieldStyle(false)}
            />
          </div>

          <div className="divider">
            <span>Valores nutricionais (congelados)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {(['kcal', 'prot', 'carb', 'fat'] as const).map((key) => {
              const labels: Record<string, string> = {
                kcal: 'Kcal',
                prot: 'Prot (g)',
                carb: 'Carb (g)',
                fat: 'Gord (g)',
              };
              const colors: Record<string, string> = {
                kcal: '',
                prot: 'var(--sage-dim)',
                carb: 'var(--carb)',
                fat: 'var(--sky)',
              };
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="eyebrow" htmlFor={`edit-food-${key}`}>
                    {labels[key]}
                  </label>
                  <input
                    id={`edit-food-${key}`}
                    autoComplete="off"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    onBlur={onBlur(key)}
                    aria-invalid={errors[key] ? 'true' : undefined}
                    aria-describedby={errors[key] ? `edit-food-${key}-error` : undefined}
                    style={{
                      ...fieldStyle(!!errors[key], true),
                      color: colors[key] || 'var(--fg)',
                    }}
                  />
                  {errors[key] && (
                    <p id={`edit-food-${key}-error`} className="text-xs text-coral" role="alert">
                      {errors[key]}
                    </p>
                  )}
                </div>
              );
            })}
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
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!form.foodName.trim()}
            style={{ opacity: form.foodName.trim() ? 1 : 0.45 }}
          >
            <IconCheck size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
