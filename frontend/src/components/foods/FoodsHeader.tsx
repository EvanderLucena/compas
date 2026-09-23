import type { FoodCategory, FoodCategoryKey } from '../../types/food';
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS } from '../../types/food';
import { IconSearch, IconPlus } from '../icons';

export interface FoodsHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: FoodCategory;
  onCategoryFilterChange: (val: FoodCategory) => void;
  onNewFood: () => void;
}

export function FoodsHeader({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  onNewFood,
}: FoodsHeaderProps) {
  return (
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
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value as FoodCategory)}
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
          type="button"
          className="btn btn-primary"
          onClick={onNewFood}
          data-testid="newfood-btn"
        >
          <IconPlus size={13} /> Novo alimento
        </button>
      </div>
    </div>
  );
}
