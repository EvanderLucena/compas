import { useState, useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { Food } from '../../types/food';
import { FOOD_UNIT_SYMBOLS } from '../../types/food';
import { IconDots, IconEdit, IconTrash } from '../icons';
import { MiniMacro } from './FoodMacroInputs';

function DropdownItem({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
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
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none';
      }}
    >
      {icon} {label}
    </button>
  );
}

function FoodMenuDropdown({
  onEdit,
  onDelete,
  onClose,
  triggerRef,
  isCustom = true,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  isCustom?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, triggerRef]);

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

function FoodCardFooter({
  used,
  isCustom,
  onEdit,
}: {
  used: number;
  isCustom: boolean;
  onEdit: () => void;
}) {
  return (
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
        usado em {used} planos
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ fontSize: 11.5, padding: '3px 6px', color: 'var(--fg-muted)' }}
        onClick={onEdit}
      >
        <IconEdit size={11} /> {isCustom ? 'Editar' : 'Visualizar'}
      </button>
    </div>
  );
}

export interface FoodCardProps {
  food: Food;
  onEdit: () => void;
  onDelete: () => void;
}

export function FoodCard({ food, onEdit, onDelete }: FoodCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
          <button
            ref={triggerRef}
            type="button"
            aria-label="Opções do alimento"
            style={{
              color: 'var(--fg-subtle)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconDots size={14} />
          </button>
          {menuOpen && (
            <FoodMenuDropdown
              triggerRef={triggerRef}
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
      <FoodCardFooter used={food.used} isCustom={Boolean(food.custom)} onEdit={onEdit} />
    </div>
  );
}
