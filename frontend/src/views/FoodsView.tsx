import { useState, useEffect, useRef, useCallback } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  FOOD_CATEGORIES,
  FOOD_CATEGORY_LABELS,
  FOOD_UNIT_KEYS,
  FOOD_UNIT_LABELS,
  FOOD_UNIT_SYMBOLS,
  REVERSE_CATEGORY_LABELS,
} from '../types/food';
import type { Food, FoodCategory, FoodCategoryKey, FoodUnit } from '../types/food';
import { parseNumberInput, sanitizeNumberInput } from '../utils/numberInput';
import {
  useFoodUIStore,
  useFoodCatalog,
  useCreateFood,
  useUpdateFood,
  useDeleteFood,
} from '../stores/foodStore';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconDots,
  IconX,
  IconCheck,
  IconTrash,
} from '../components/icons';
import { useValidation } from '../hooks/useValidation';
import { useToastStore } from '../stores/toastStore';
import { resolveMutationErrorMessage } from '../stores/patientStore';

function MiniMacro({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 9.5,
          color: 'var(--fg-subtle)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        className="mono tnum"
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: color || 'var(--fg)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DropdownItem({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 14px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: 13,
        color: color || 'var(--fg)',
        textAlign: 'left',
        fontFamily: 'var(--font-ui)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      {icon} {label}
    </button>
  );
}

function FoodMenuDropdown({
  onEdit,
  onDelete,
  onClose,
  isCustom = true,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  isCustom?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        right: 0,
        top: '100%',
        zIndex: 50,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: 140,
        padding: '4px 0',
      }}
    >
      <DropdownItem
        onClick={() => {
          onEdit();
          onClose();
        }}
        icon={<IconEdit size={13} />}
        label={isCustom ? 'Editar' : 'Visualizar / Duplicar'}
      />
      {isCustom && (
        <DropdownItem
          onClick={() => {
            onDelete();
            onClose();
          }}
          icon={<IconTrash size={13} />}
          label="Excluir"
          color="var(--coral)"
        />
      )}
    </div>
  );
}

function EditFoodCatalogModal({ food, onClose }: { food: Food; onClose: () => void }) {
  const [category, setCategory] = useState<FoodCategoryKey>(
    REVERSE_CATEGORY_LABELS[food.category] || (food.category as FoodCategoryKey),
  );
  const [unit, setUnit] = useState<FoodUnit>(food.unit);
  const [prep, setPrep] = useState(food.prep);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateFood = useUpdateFood();
  const createFood = useCreateFood();

  const handleDuplicate = () => {
    setSubmitError(null);
    if (!validateAll()) return;
    const kcal = parseNumberInput(form.kcal);
    const prot = parseNumberInput(form.prot);
    const carb = parseNumberInput(form.carb);
    const fat = parseNumberInput(form.fat);
    if (kcal == null || prot == null || carb == null || fat == null) {
      setSubmitError('Preencha todos os campos obrigatórios de macronutrientes.');
      return;
    }
    createFood.mutate(
      {
        name: form.name.trim() + ' (Personalizado)',
        category,
        unit,
        referenceAmount: parseNumberInput(form.referenceAmount),
        kcal,
        prot,
        carb,
        fat,
        fiber: form.fiber.trim() ? parseNumberInput(form.fiber) : undefined,
        prep: prep || null,
        portionLabel: food.portionLabel || null,
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          useToastStore.getState().showSuccess('Alimento duplicado como personalizado!');
          onClose();
        },
        onError: (error) => {
          const msg = resolveMutationErrorMessage(
            error,
            'Erro ao duplicar alimento — tente novamente',
          );
          setSubmitError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
  };

  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      name: food.name,
      referenceAmount: String(food.referenceAmount),
      kcal: String(food.kcal ?? 0),
      prot: String(food.prot ?? 0),
      carb: String(food.carb ?? 0),
      fat: String(food.fat ?? 0),
      fiber: String(food.fiber ?? ''),
    } as Record<string, string>,
    {
      name: {
        required: true,
        requiredMessage: 'Nome é obrigatório.',
        minLength: 2,
        minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
      },
      referenceAmount: {
        required: true,
        requiredMessage: 'Quantidade de referência é obrigatória.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (!n || n <= 0) return 'Referência deve ser maior que zero.';
          return undefined;
        },
      },
      kcal: {
        required: true,
        requiredMessage: 'Calorias são obrigatórias.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      prot: {
        required: true,
        requiredMessage: 'Proteína é obrigatória.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      carb: {
        required: true,
        requiredMessage: 'Carboidrato é obrigatório.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      fat: {
        required: true,
        requiredMessage: 'Gordura é obrigatória.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      fiber: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
    },
  );

  const handleSave = () => {
    setSubmitError(null);
    if (!validateAll()) return;
    const kcal = parseNumberInput(form.kcal);
    const prot = parseNumberInput(form.prot);
    const carb = parseNumberInput(form.carb);
    const fat = parseNumberInput(form.fat);
    if (kcal == null || prot == null || carb == null || fat == null) {
      setSubmitError('Preencha todos os campos obrigatórios de macronutrientes.');
      return;
    }
    updateFood.mutate(
      {
        id: food.id,
        data: {
          name: form.name.trim(),
          category,
          unit,
          referenceAmount: parseNumberInput(form.referenceAmount),
          kcal,
          prot,
          carb,
          fat,
          fiber: parseNumberInput(form.fiber),
          prep: prep || null,
        },
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          useToastStore.getState().showSuccess('Alimento atualizado com sucesso');
          onClose();
        },
        onError: (error) => {
          const msg = resolveMutationErrorMessage(
            error,
            'Erro ao atualizar alimento — tente novamente',
          );
          setSubmitError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
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

  const unitSymbol = FOOD_UNIT_SYMBOLS[unit];
  const refLabel = unit === 'UNIDADE' ? 'unidade' : unit === 'ML' ? 'ml' : 'g';
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
        style={{
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">
            {food.custom ? 'Editar alimento' : 'Detalhes do alimento (Tabela TACO)'}
          </div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}>
            <IconX size={14} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!food.custom && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 6,
                fontSize: 12.5,
                color: 'var(--fg)',
                lineHeight: 1.4,
              }}
            >
              ℹ️ Este é um alimento padrão da <strong>Tabela TACO / IBGE</strong>. Você pode
              duplicá-lo como personalizado para customizar seus valores à vontade.
            </div>
          )}
          {submitError && (
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
              {submitError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="edit-catalog-name">
              Nome
            </label>
            <input
              id="edit-catalog-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={onBlur('name')}
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'edit-catalog-name-error' : undefined}
              style={fieldStyle(!!errors.name)}
            />
            {errors.name && (
              <p id="edit-catalog-name-error" className="text-xs text-coral" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="edit-catalog-category">
                Categoria
              </label>
              <select
                id="edit-catalog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategoryKey)}
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
                {FOOD_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                  <option key={c} value={c}>
                    {FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="edit-catalog-unit">
                Unidade
              </label>
              <select
                id="edit-catalog-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as FoodUnit)}
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
                {FOOD_UNIT_KEYS.map((u) => (
                  <option key={u} value={u}>
                    {FOOD_UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="edit-catalog-ref">
                Referência ({refLabel})
              </label>
              <input
                id="edit-catalog-ref"
                value={form.referenceAmount}
                onChange={(e) => set('referenceAmount', sanitizeNumberInput(e.target.value))}
                onBlur={() => {
                  set('referenceAmount', String(parseNumberInput(form.referenceAmount)));
                  onBlur('referenceAmount')();
                }}
                aria-invalid={errors.referenceAmount ? 'true' : undefined}
                aria-describedby={errors.referenceAmount ? 'edit-catalog-ref-error' : undefined}
                inputMode="decimal"
                style={fieldStyle(!!errors.referenceAmount, true)}
              />
              {errors.referenceAmount && (
                <p id="edit-catalog-ref-error" className="text-xs text-coral" role="alert">
                  {errors.referenceAmount}
                </p>
              )}
            </div>
          </div>
          <div className="divider">
            <span>
              Valores por {form.referenceAmount || '?'}
              {unitSymbol}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {(['kcal', 'prot', 'carb', 'fat', 'fiber'] as const).map((key) => {
              const labels: Record<string, string> = {
                kcal: 'Kcal',
                prot: 'Prot (g)',
                carb: 'Carb (g)',
                fat: 'Gord (g)',
                fiber: 'Fibra (g)',
              };
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="eyebrow" htmlFor={`edit-catalog-${key}`}>
                    {labels[key]}
                  </label>
                  <input
                    id={`edit-catalog-${key}`}
                    value={form[key]}
                    onChange={(e) => set(key, sanitizeNumberInput(e.target.value))}
                    onBlur={() => {
                      set(key, String(parseNumberInput(form[key])));
                      onBlur(key)();
                    }}
                    aria-invalid={errors[key] ? 'true' : undefined}
                    aria-describedby={errors[key] ? `edit-catalog-${key}-error` : undefined}
                    inputMode="decimal"
                    style={fieldStyle(!!errors[key], true)}
                  />
                  {errors[key] && (
                    <p id={`edit-catalog-${key}-error`} className="text-xs text-coral" role="alert">
                      {errors[key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="edit-catalog-prep">
              Preparo sugerido
            </label>
            <input
              id="edit-catalog-prep"
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
              placeholder="ex: grelhado, cozido no vapor"
              style={fieldStyle(false)}
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
          <button className="btn btn-ghost" onClick={onClose}>
            {food.custom ? 'Cancelar' : 'Fechar'}
          </button>
          {food.custom ? (
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={
                !form.name.trim() ||
                !form.referenceAmount.trim() ||
                !form.kcal.trim() ||
                !form.prot.trim() ||
                !form.carb.trim() ||
                !form.fat.trim() ||
                updateFood.isPending
              }
              style={{
                opacity:
                  form.name.trim() &&
                  form.referenceAmount.trim() &&
                  form.kcal.trim() &&
                  form.prot.trim() &&
                  form.carb.trim() &&
                  form.fat.trim() &&
                  !updateFood.isPending
                    ? 1
                    : 0.45,
              }}
            >
              <IconCheck size={13} /> {updateFood.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleDuplicate}
              disabled={createFood.isPending}
            >
              <IconPlus size={13} />{' '}
              {createFood.isPending ? 'Duplicando...' : 'Duplicar como personalizado'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  name,
  onClose,
  onConfirm,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
        aria-label="Excluir alimento"
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Excluir alimento</h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            Tem certeza que deseja excluir <strong style={{ color: 'var(--fg)' }}>{name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn"
              style={{ background: 'var(--coral)', color: '#fff', borderColor: 'transparent' }}
              onClick={onConfirm}
            >
              <IconTrash size={13} /> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            width: '60%',
            height: 14,
            background: 'var(--surface-2)',
            borderRadius: 4,
            marginBottom: 8,
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div
          style={{
            width: '40%',
            height: 12,
            background: 'var(--surface-2)',
            borderRadius: 4,
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 28,
                background: 'var(--surface-2)',
                borderRadius: 4,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FoodCard({
  food,
  onEdit,
  onDelete,
}: {
  food: Food;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const unitSymbol = FOOD_UNIT_SYMBOLS[food.unit];
  const refLabel = food.unit === 'UNIDADE' ? 'unidade' : food.unit === 'ML' ? 'ml' : 'g';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--fg-subtle)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {food.category}
            </div>
            {!food.custom && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: '1px 5px',
                  borderRadius: 3,
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--sky)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                TACO
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' }}>
            {food.name}
          </div>
          {food.prep && (
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 2 }}>
              {food.prep}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button style={{ color: 'var(--fg-subtle)' }} onClick={() => setMenuOpen((v) => !v)}>
            <IconDots size={14} />
          </button>
          {menuOpen && (
            <FoodMenuDropdown
              onEdit={onEdit}
              onDelete={onDelete}
              onClose={() => setMenuOpen(false)}
              isCustom={food.custom}
            />
          )}
        </div>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          por {food.referenceAmount}
          {unitSymbol} ({refLabel})
        </div>
        <div
          className="foods-foods-macros-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}
        >
          <MiniMacro label="Kcal" value={food.kcal} />
          <MiniMacro label="Prot" value={`${food.prot}g`} color="var(--sage-dim)" />
          <MiniMacro label="Carb" value={`${food.carb}g`} color="var(--carb)" />
          <MiniMacro label="Gord" value={`${food.fat}g`} color="var(--sky)" />
          <MiniMacro label="Fibra" value={`${food.fiber ?? 0}g`} color="var(--lime-dim)" />
        </div>
      </div>
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-2)',
          marginTop: 'auto',
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: 'var(--fg-subtle)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          usado em {food.used} planos
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11.5, padding: '3px 6px', color: 'var(--fg-muted)' }}
          onClick={onEdit}
        >
          <IconEdit size={11} /> {food.custom ? 'Editar' : 'Visualizar'}
        </button>
      </div>
    </div>
  );
}

function FoodsPagination({
  page,
  pages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        marginTop: 8,
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        className="mono"
        style={{ fontSize: 11.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}
      >
        {from}–{to} <span style={{ color: 'var(--fg-muted)' }}>de</span> {total}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          style={{ padding: '4px 8px', opacity: page === 0 ? 0.35 : 1 }}
        >
          ←
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              fontSize: 12,
              background: i === page ? 'var(--surface-2)' : 'transparent',
              border: i === page ? '1px solid var(--border)' : '1px solid transparent',
              color: i === page ? 'var(--fg)' : 'var(--fg-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="btn btn-ghost"
          disabled={page === pages - 1}
          onClick={() => onChange(page + 1)}
          style={{ padding: '4px 8px', opacity: page === pages - 1 ? 0.35 : 1 }}
        >
          →
        </button>
      </div>
    </div>
  );
}

function CreateFoodModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<FoodCategoryKey>('PROTEINA');
  const [unit, setUnit] = useState<FoodUnit>('GRAMAS');
  const [prep, setPrep] = useState('');
  const [portionLabel, setPortionLabel] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createFood = useCreateFood();

  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
  } = useValidation(
    {
      name: '',
      referenceAmount: '100',
      kcal: '0',
      prot: '0',
      carb: '0',
      fat: '0',
      fiber: '',
    } as Record<string, string>,
    {
      name: {
        required: true,
        requiredMessage: 'Nome do alimento é obrigatório.',
        minLength: 2,
        minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
      },
      referenceAmount: {
        required: true,
        requiredMessage: 'Quantidade de referência é obrigatória.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (!n || n <= 0) return 'Referência deve ser maior que zero.';
          return undefined;
        },
      },
      kcal: {
        required: true,
        requiredMessage: 'Calorias são obrigatórias.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      prot: {
        required: true,
        requiredMessage: 'Proteína é obrigatória.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      carb: {
        required: true,
        requiredMessage: 'Carboidrato é obrigatório.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      fat: {
        required: true,
        requiredMessage: 'Gordura é obrigatória.',
        min: 0,
        minMessage: 'Valor não pode ser negativo.',
        custom: (v) => {
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
      fiber: {
        custom: (v) => {
          if (!v.trim()) return undefined;
          const n = parseNumberInput(v);
          if (n == null || !Number.isFinite(n)) return 'Valor numérico inválido.';
          if (n < 0) return 'Valor não pode ser negativo.';
          return undefined;
        },
      },
    },
  );

  const handleCreate = () => {
    setSubmitError(null);
    if (!validateAll()) return;
    const kcal = parseNumberInput(form.kcal);
    const prot = parseNumberInput(form.prot);
    const carb = parseNumberInput(form.carb);
    const fat = parseNumberInput(form.fat);
    if (kcal == null || prot == null || carb == null || fat == null) {
      setSubmitError('Preencha todos os campos obrigatórios de macronutrientes.');
      return;
    }
    createFood.mutate(
      {
        name: form.name.trim(),
        category,
        unit,
        referenceAmount: parseNumberInput(form.referenceAmount),
        kcal,
        prot,
        carb,
        fat,
        fiber: parseNumberInput(form.fiber),
        prep: prep || null,
        portionLabel: portionLabel || null,
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          useToastStore.getState().showSuccess('Alimento cadastrado com sucesso');
          onClose();
        },
        onError: (error) => {
          const msg = resolveMutationErrorMessage(
            error,
            'Erro ao cadastrar alimento — tente novamente',
          );
          setSubmitError(msg);
          useToastStore.getState().showError(msg);
        },
      },
    );
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

  const unitSymbol = FOOD_UNIT_SYMBOLS[unit];
  const refLabel = unit === 'UNIDADE' ? 'unidade' : unit === 'ML' ? 'ml' : 'g';
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
        aria-labelledby="create-food-title"
        tabIndex={-1}
        className="card outline-none"
        style={{
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div id="create-food-title" className="title">
            Novo alimento
          </div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}>
            <IconX size={14} />
          </button>
        </div>
        <div
          style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {submitError && (
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
              {submitError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="create-food-name">
              Nome do alimento
            </label>
            <input
              data-testid="newfood-name"
              id="create-food-name"
              placeholder="ex: Frango desfiado"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={onBlur('name')}
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'create-food-name-error' : undefined}
              style={fieldStyle(!!errors.name)}
            />
            {errors.name && (
              <p id="create-food-name-error" className="text-xs text-coral" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="create-food-category">
                Categoria
              </label>
              <select
                data-testid="newfood-category"
                id="create-food-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategoryKey)}
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
                {FOOD_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                  <option key={c} value={c}>
                    {FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="create-food-unit">
                Unidade
              </label>
              <select
                id="create-food-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as FoodUnit)}
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
                {FOOD_UNIT_KEYS.map((u) => (
                  <option key={u} value={u}>
                    {FOOD_UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="create-food-ref">
                Referência ({refLabel})
              </label>
              <input
                data-testid="newfood-ref"
                id="create-food-ref"
                value={form.referenceAmount}
                onChange={(e) => set('referenceAmount', sanitizeNumberInput(e.target.value))}
                onBlur={() => {
                  set('referenceAmount', String(parseNumberInput(form.referenceAmount)));
                  onBlur('referenceAmount')();
                }}
                aria-invalid={errors.referenceAmount ? 'true' : undefined}
                aria-describedby={errors.referenceAmount ? 'create-food-ref-error' : undefined}
                inputMode="decimal"
                placeholder={unit === 'GRAMAS' ? '100' : '1'}
                style={fieldStyle(!!errors.referenceAmount, true)}
              />
              {errors.referenceAmount && (
                <p id="create-food-ref-error" className="text-xs text-coral" role="alert">
                  {errors.referenceAmount}
                </p>
              )}
            </div>
          </div>
          <div className="divider">
            <span>
              Valores por {form.referenceAmount || '?'}
              {unitSymbol}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {(['kcal', 'prot', 'carb', 'fat', 'fiber'] as const).map((key) => {
              const labels: Record<string, string> = {
                kcal: 'Kcal',
                prot: 'Prot (g)',
                carb: 'Carb (g)',
                fat: 'Gord (g)',
                fiber: 'Fibra (g)',
              };
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label className="eyebrow" htmlFor={`create-food-${key}`}>
                    {labels[key]}
                  </label>
                  <input
                    id={`create-food-${key}`}
                    value={form[key]}
                    onChange={(e) => set(key, sanitizeNumberInput(e.target.value))}
                    onBlur={() => {
                      set(key, String(parseNumberInput(form[key])));
                      onBlur(key)();
                    }}
                    aria-invalid={errors[key] ? 'true' : undefined}
                    aria-describedby={errors[key] ? `create-food-${key}-error` : undefined}
                    inputMode="decimal"
                    style={fieldStyle(!!errors[key], true)}
                  />
                  {errors[key] && (
                    <p id={`create-food-${key}-error`} className="text-xs text-coral" role="alert">
                      {errors[key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="create-food-prep">
              Preparo sugerido
            </label>
            <input
              id="create-food-prep"
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
              placeholder="ex: grelhado, cozido no vapor"
              style={fieldStyle(false)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="eyebrow" htmlFor="create-food-portion">
              Descrição da porção
            </label>
            <input
              id="create-food-portion"
              value={portionLabel}
              onChange={(e) => setPortionLabel(e.target.value)}
              placeholder="ex: 1 unidade · 100g"
              style={fieldStyle(false)}
            />
          </div>
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
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            data-testid="newfood-submit"
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={
              !form.name.trim() ||
              !form.referenceAmount.trim() ||
              !form.kcal.trim() ||
              !form.prot.trim() ||
              !form.carb.trim() ||
              !form.fat.trim() ||
              createFood.isPending
            }
            style={{
              opacity:
                form.name.trim() &&
                form.referenceAmount.trim() &&
                form.kcal.trim() &&
                form.prot.trim() &&
                form.carb.trim() &&
                form.fat.trim() &&
                !createFood.isPending
                  ? 1
                  : 0.45,
            }}
          >
            <IconCheck size={13} /> {createFood.isPending ? 'Salvando...' : 'Salvar no catálogo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FoodsView() {
  const {
    searchQuery,
    categoryFilter,
    currentPage,
    pageSize,
    setSearchQuery,
    setCategoryFilter,
    setCurrentPage,
    createModalOpen,
    setCreateModalOpen,
    editingFoodId,
    setEditingFoodId,
  } = useFoodUIStore();
  const { data, isLoading } = useFoodCatalog();
  const deleteFood = useDeleteFood();
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);

  // Debounced search: 300ms
  const [localQ, setLocalQ] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback(
    (val: string) => {
      setLocalQ(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(val);
      }, 300);
    },
    [setSearchQuery],
  );
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const foods = data?.content ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const total = data?.total ?? 0;

  const editingFood = editingFoodId ? (foods.find((f) => f.id === editingFoodId) ?? null) : null;

  const handleConfirmDelete = () => {
    if (deletingFood) {
      deleteFood.mutate(deletingFood.id);
      setDeletingFood(null);
    }
  };

  return (
    <div>
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="eyebrow">
            Catálogo pessoal · Tabela TACO / IBGE e alimentos personalizados
          </div>
          <h1
            className="serif"
            style={{ fontSize: 32, margin: '4px 0 6px', fontWeight: 400, letterSpacing: '-0.02em' }}
          >
            Alimentos
          </h1>
        </div>
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div className="search" style={{ margin: 0, flex: 1, maxWidth: 320 }}>
            <IconSearch size={13} />
            <input
              placeholder="Buscar no catálogo…"
              value={localQ}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as FoodCategory)}
            style={{
              padding: '7px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              fontSize: 12.5,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'Todos' ? 'Todos' : FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => setCreateModalOpen(true)}
            data-testid="newfood-btn"
          >
            <IconPlus size={13} /> Novo alimento
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 28px 40px' }}>
        <div
          className="foods-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : foods.map((f) => (
                <FoodCard
                  key={f.id}
                  food={f}
                  onEdit={() => setEditingFoodId(f.id)}
                  onDelete={() => setDeletingFood(f)}
                />
              ))}
          {!isLoading && foods.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 40,
                textAlign: 'center',
                color: 'var(--fg-subtle)',
                fontSize: 13,
              }}
            >
              Nenhum alimento encontrado.
            </div>
          )}
        </div>
        <FoodsPagination
          page={currentPage}
          pages={totalPages}
          total={total}
          pageSize={pageSize}
          onChange={setCurrentPage}
        />
      </div>

      {createModalOpen && <CreateFoodModal onClose={() => setCreateModalOpen(false)} />}
      {editingFood && (
        <EditFoodCatalogModal food={editingFood} onClose={() => setEditingFoodId(null)} />
      )}
      {deletingFood && (
        <DeleteConfirmModal
          name={deletingFood.name}
          onClose={() => setDeletingFood(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
