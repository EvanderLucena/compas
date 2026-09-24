import type { FoodSubstitutionItem } from '../../types/substitution';
import { FoodSubstitutionOptionCard } from './FoodSubstitutionOptionCard';

export interface ModalBodyContentProps {
  isPending: boolean;
  isError: boolean;
  substitutions?: FoodSubstitutionItem[];
  onApplySubstitution?: (targetItem: FoodSubstitutionItem) => void;
  onCopySingle: (item: FoodSubstitutionItem) => void;
  isReadOnly?: boolean;
  isApplying?: boolean;
  onRetry?: () => void;
}

export function ModalBodyContent({
  isPending,
  isError,
  substitutions,
  onApplySubstitution,
  onCopySingle,
  isReadOnly,
  isApplying,
  onRetry,
}: ModalBodyContentProps) {
  if (isPending) {
    return (
      <div style={{ flex: 1, padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
        Calculando equivalências e hábitos do paciente...
      </div>
    );
  }
  if (isError) {
    return (
      <div style={{ flex: 1, padding: 30, textAlign: 'center' }}>
        <div style={{ color: 'var(--coral)', marginBottom: 12 }}>
          Falha ao carregar substituições do catálogo TACO.
        </div>
        {onRetry && (
          <button type="button" className="btn btn-secondary text-xs" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    );
  }
  if (!substitutions || substitutions.length === 0) {
    return (
      <div style={{ flex: 1, padding: 30, textAlign: 'center', color: 'var(--fg-muted)' }}>
        Nenhum alimento substituto encontrado com proporção equivalente no catálogo.
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {substitutions.map((sub) => (
        <FoodSubstitutionOptionCard
          key={sub.foodId}
          item={sub}
          onApply={onApplySubstitution}
          onCopySingle={onCopySingle}
          isReadOnly={isReadOnly}
          isApplying={isApplying}
        />
      ))}
    </div>
  );
}
