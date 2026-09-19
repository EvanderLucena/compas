import { IconPlus } from '../icons';
import type { FrequentOffPlanFood } from '../../types/patient';

interface FrequentFoodItemRowProps {
  food: FrequentOffPlanFood;
  isAdopting: boolean;
  onAdopt: () => void;
}

const cardStyle = {
  padding: '16px 20px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
} as const;

const badgeStyle = {
  fontSize: 11.5,
  padding: '2px 8px',
  borderRadius: 4,
  background: 'var(--surface-sunken)',
  color: 'var(--fg-muted)',
} as const;

export function FrequentFoodItemRow({ food, isAdopting, onAdopt }: FrequentFoodItemRowProps) {
  const hasMacros = food.typicalProt > 0 || food.typicalCarb > 0 || food.typicalFat > 0;
  const portionText =
    food.typicalGrams > 0
      ? `Porção típica: ${food.typicalGrams}g · ~${food.typicalKcal} kcal`
      : 'Porção não especificada';

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg)' }}>{food.foodName}</span>
          <span
            className="mono"
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(163, 230, 53, 0.12)',
              color: 'var(--lime-dim)',
              fontWeight: 600,
            }}
          >
            {food.consumptionCount}x no período
          </span>
          <span style={badgeStyle}>{food.commonMealLabel}</span>
          <span style={badgeStyle}>{food.category}</span>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{
            fontSize: 12,
            padding: '6px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
          disabled={isAdopting}
          onClick={onAdopt}
        >
          {isAdopting ? (
            'Adicionando ao Plano...'
          ) : (
            <>
              <IconPlus size={13} />
              Adicionar como Opção Alternativa
            </>
          )}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 12.5,
          color: 'var(--fg-muted)',
        }}
      >
        <span className="mono" style={{ color: 'var(--fg)' }}>
          {portionText}
        </span>
        {hasMacros && (
          <>
            <span>·</span>
            <span>
              Prot: {food.typicalProt}g | Carb: {food.typicalCarb}g | Gord: {food.typicalFat}g
            </span>
          </>
        )}
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: 'var(--fg)',
          background: 'var(--surface-sunken)',
          padding: '10px 14px',
          borderRadius: 6,
          borderLeft: '3px solid var(--lime-dim)',
          lineHeight: 1.5,
        }}
      >
        💡 <strong>Julgamento Clínico:</strong> {food.clinicalRationale}
      </div>
    </div>
  );
}
