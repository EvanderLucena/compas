import type { Food } from '../../types/food';
import { FoodCard } from './FoodCard';
import { SkeletonCard } from './SkeletonCard';

export interface FoodGridProps {
  isLoading: boolean;
  isError: boolean;
  foods: Food[];
  onRefetch: () => void;
  onEditFood: (food: Food) => void;
  onDeleteFood: (food: Food) => void;
}

export function FoodGrid({
  isLoading,
  isError,
  foods,
  onRefetch,
  onEditFood,
  onDeleteFood,
}: FoodGridProps) {
  return (
    <div
      className="foods-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 12,
      }}
    >
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
      ) : isError ? (
        <div
          style={{
            gridColumn: '1 / -1',
            padding: 40,
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--coral)', marginBottom: 12, fontSize: 14 }}>
            Erro ao carregar catálogo de alimentos.
          </p>
          <button type="button" className="btn btn-secondary" onClick={onRefetch}>
            Tentar novamente
          </button>
        </div>
      ) : (
        foods.map((f) => (
          <FoodCard
            key={f.id}
            food={f}
            onEdit={() => onEditFood(f)}
            onDelete={() => onDeleteFood(f)}
          />
        ))
      )}
      {!isLoading && !isError && foods.length === 0 && (
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
  );
}
