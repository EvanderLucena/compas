import type { FoodSubstitutionItem } from '../../types/substitution';

interface FoodSubstitutionOptionCardProps {
  item: FoodSubstitutionItem;
  onApply?: (item: FoodSubstitutionItem) => void;
  onCopySingle: (item: FoodSubstitutionItem) => void;
  isReadOnly?: boolean;
  isApplying?: boolean;
}

function CardHeader({ item }: { item: FoodSubstitutionItem }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        flexWrap: 'wrap',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{item.name}</span>
        {item.isPatientHabit && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--sage, #10b981)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            ⭐ {item.habitBadge ?? 'Hábito do paciente'}
          </span>
        )}
      </div>

      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 4,
          backgroundColor: 'var(--surface-2)',
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {item.matchScore}% compatível
      </span>
    </div>
  );
}

function MacroPillGrid({ item }: { item: FoodSubstitutionItem }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        padding: '6px 8px',
        borderRadius: 6,
        backgroundColor: 'var(--paper)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
        marginBottom: 10,
      }}
    >
      <div>
        <span style={{ color: 'var(--fg-muted)', display: 'block', fontSize: 9.5 }}>KCAL</span>
        <strong>{item.kcal}</strong>
      </div>
      <div>
        <span style={{ color: 'var(--fg-muted)', display: 'block', fontSize: 9.5 }}>PROT</span>
        <strong>{item.prot}g</strong>
      </div>
      <div>
        <span style={{ color: 'var(--fg-muted)', display: 'block', fontSize: 9.5 }}>CARB</span>
        <strong>{item.carb}g</strong>
      </div>
      <div>
        <span style={{ color: 'var(--fg-muted)', display: 'block', fontSize: 9.5 }}>GORD</span>
        <strong>{item.fat}g</strong>
      </div>
      <div>
        <span style={{ color: 'var(--fg-muted)', display: 'block', fontSize: 9.5 }}>FIBRA</span>
        <strong>{item.fiber}g</strong>
      </div>
    </div>
  );
}

export function FoodSubstitutionOptionCard({
  item,
  onApply,
  onCopySingle,
  isReadOnly,
  isApplying,
}: FoodSubstitutionOptionCardProps) {
  const isPositiveDelta = item.deltaKcal >= 0;
  const deltaSign = isPositiveDelta ? '+' : '';

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        border: item.isPatientHabit
          ? '1.5px solid var(--sage, #10b981)'
          : '1px solid var(--border)',
        backgroundColor: item.isPatientHabit ? 'rgba(16, 185, 129, 0.04)' : 'var(--paper-2)',
        marginBottom: 10,
      }}
    >
      <CardHeader item={item} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          fontSize: 12.5,
          color: 'var(--fg)',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        <div>
          <span style={{ fontWeight: 600 }}>Porção sugerida: </span>
          <span style={{ color: 'var(--lime-dark, #047857)', fontWeight: 700 }}>
            {item.householdPortion}
          </span>
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: isPositiveDelta ? 'var(--coral, #ef4444)' : 'var(--sage, #10b981)',
            fontWeight: 600,
          }}
        >
          {deltaSign}
          {item.deltaKcal} kcal em relação ao original
        </div>
      </div>

      <MacroPillGrid item={item} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          className="btn btn-subtle"
          onClick={() => onCopySingle(item)}
          style={{ fontSize: 11.5, padding: '3px 8px' }}
        >
          📋 Copiar
        </button>
        {onApply && !isReadOnly && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onApply(item)}
            disabled={isApplying}
            style={{
              fontSize: 11.5,
              padding: '3px 10px',
              opacity: isApplying ? 0.7 : 1,
              cursor: isApplying ? 'not-allowed' : 'pointer',
            }}
          >
            {isApplying ? 'Substituindo...' : 'Substituir no Plano'}
          </button>
        )}
      </div>
    </div>
  );
}
