import { useState, useRef, useCallback, useEffect } from 'react';
import type { Food } from '../../types/food';
import { mapFoodFromApi, FOOD_UNIT_SYMBOLS } from '../../types/food';
import { listFoods } from '../../api/foods';
import { parseNumberInput, sanitizeNumberInput } from '../../utils/numberInput';
import { IconSearch, IconPlus, IconX } from '../icons';

interface AddFoodModalProps {
  onClose: () => void;
  onAdd: (item: { foodId: string; referenceAmount: number }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function AddFoodModal({ onClose, onAdd, isSubmitting = false, error }: AddFoodModalProps) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [referenceAmount, setReferenceAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((val: string) => {
    setQ(val);
    setSelected(null);
    setReferenceAmount('');
    setAmountError(undefined);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await listFoods({ search: val, page: 0, size: 10 });
        setResults(response.content.map(mapFoodFromApi));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const handleSelectFood = (food: Food) => {
    setSelected(food);
    setReferenceAmount(String(food.referenceAmount));
    setAmountError(undefined);
  };

  const getMacroPreview = () => {
    if (!selected || !referenceAmount) return null;
    const ref = parseNumberInput(referenceAmount);
    if (!Number.isFinite(ref) || ref <= 0) return null;
    const foodRef = selected.referenceAmount;
    if (!foodRef) return null;
    const scale = ref / foodRef;
    return {
      kcal: Math.round(selected.kcal * scale * 10) / 10,
      prot: Math.round(selected.prot * scale * 10) / 10,
      carb: Math.round(selected.carb * scale * 10) / 10,
      fat: Math.round(selected.fat * scale * 10) / 10,
    };
  };

  const macroPreview = getMacroPreview();

  const validateAmount = (val: string): string | undefined => {
    if (!val.trim()) return 'Quantidade é obrigatória.';
    const n = parseNumberInput(val);
    if (n <= 0) return 'Quantidade deve ser maior que zero.';
    return undefined;
  };

  const handleAmountBlur = () => {
    if (referenceAmount) {
      setReferenceAmount(String(parseNumberInput(referenceAmount)));
      const err = validateAmount(referenceAmount);
      setAmountError(err);
    }
  };

  const handleAdd = () => {
    if (!selected) return;
    const err = validateAmount(referenceAmount);
    if (err) {
      setAmountError(err);
      return;
    }
    const amount = parseNumberInput(referenceAmount);
    if (!amount || amount <= 0) return;
    onAdd({
      foodId: selected.id,
      referenceAmount: amount,
    });
    onClose();
  };

  const unitSymbol = selected ? FOOD_UNIT_SYMBOLS[selected.unit] : '';

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
        className="card"
        style={{ width: 'min(520px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Adicionar alimento</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}>
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
          <div className="search" style={{ margin: 0 }}>
            <IconSearch size={13} />
            <input
              autoFocus
              placeholder="Buscar no catálogo…"
              value={q}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {searching && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: '60%',
                      height: 14,
                      background: 'var(--surface-2)',
                      borderRadius: 4,
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  <div
                    style={{
                      width: '20%',
                      height: 14,
                      background: 'var(--surface-2)',
                      borderRadius: 4,
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {!searching && results.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {results.map((f) => {
                const fSymbol = FOOD_UNIT_SYMBOLS[f.unit];
                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFood(f)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: selected?.id === f.id ? 'var(--surface-2)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: selected?.id === f.id ? 600 : 400 }}>
                        {f.name}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--fg-subtle)',
                          marginTop: 2,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {f.category} · ref {f.referenceAmount}
                        {fSymbol}
                      </div>
                    </div>
                    <div
                      className="mono tnum"
                      style={{ fontSize: 11.5, color: 'var(--fg-muted)', flexShrink: 0 }}
                    >
                      {f.kcal} kcal
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!searching && q && results.length === 0 && (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--fg-subtle)',
                textAlign: 'center',
                padding: '12px 0',
              }}
            >
              Nenhum alimento encontrado.
            </div>
          )}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label className="eyebrow" htmlFor="add-ref-amount">
                  Referência
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="add-ref-amount"
                    type="text"
                    inputMode="decimal"
                    value={referenceAmount}
                    onChange={(e) => {
                      setReferenceAmount(sanitizeNumberInput(e.target.value));
                      setAmountError(undefined);
                    }}
                    onBlur={handleAmountBlur}
                    aria-invalid={amountError ? 'true' : undefined}
                    aria-describedby={amountError ? 'add-ref-amount-error' : undefined}
                    placeholder="0"
                    style={{
                      padding: '8px 10px',
                      border: `1px solid ${amountError ? 'var(--coral)' : 'var(--border)'}`,
                      borderRadius: 6,
                      fontSize: 13,
                      background: 'var(--surface)',
                      outline: 'none',
                      color: 'var(--fg)',
                      width: 100,
                      boxSizing: 'border-box',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <span className="mono" style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                    Uni: {unitSymbol}
                  </span>
                  {selected.prep && (
                    <span style={{ fontSize: 12, color: 'var(--fg-subtle)', marginLeft: 4 }}>
                      · {selected.prep}
                    </span>
                  )}
                </div>
                {amountError && (
                  <p
                    id="add-ref-amount-error"
                    className="text-xs text-coral"
                    role="alert"
                    style={{ marginTop: 4 }}
                  >
                    {amountError}
                  </p>
                )}
              </div>
              {macroPreview && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 8,
                    padding: '10px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: 6,
                  }}
                >
                  {(['kcal', 'prot', 'carb', 'fat'] as const).map((k) => (
                    <div key={k}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>
                        {k === 'kcal'
                          ? 'kcal'
                          : k === 'prot'
                            ? 'prot'
                            : k === 'carb'
                              ? 'carb'
                              : 'gord'}
                      </div>
                      <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>
                        {macroPreview[k]}
                        {k !== 'kcal' ? 'g' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="mono"
                style={{ fontSize: 10, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}
              >
                * Valores aproximados — o backend calcula os valores finais
              </div>
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
            className="btn btn-primary"
            disabled={!selected || !referenceAmount || isSubmitting}
            onClick={handleAdd}
            style={{ opacity: selected && referenceAmount && !isSubmitting ? 1 : 0.45 }}
          >
            <IconPlus size={13} /> {isSubmitting ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
