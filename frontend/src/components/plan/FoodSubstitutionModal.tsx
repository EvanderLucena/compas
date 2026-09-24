import { useEffect, useRef } from 'react';
import type { MealFood } from '../../types/plan';
import type { FoodSubstitutionItem } from '../../types/substitution';
import { useFoodSubstitutionCalculator } from '../../stores/substitutionStore';
import { useToastStore } from '../../stores/toastStore';
import { useModalA11y } from '../../hooks/useModalA11y';
import { FoodSubstitutionOptionCard } from './FoodSubstitutionOptionCard';

interface FoodSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceFood: MealFood | null;
  patientId?: string | null;
  onApplySubstitution?: (targetItem: FoodSubstitutionItem) => void;
  isReadOnly?: boolean;
  isApplying?: boolean;
}

function SourceFoodHeader({ food }: { food: MealFood }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--paper-3)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
          }}
        >
          Alimento de Origem
        </span>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
          {food.referenceAmount}
          {food.unit ? food.unit.toLowerCase() : 'g'} de {food.foodName}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--fg-muted)',
        }}
      >
        <span>
          <strong>{food.kcal}</strong> kcal
        </span>
        <span>
          <strong>{food.prot}g</strong> P
        </span>
        <span>
          <strong>{food.carb}g</strong> C
        </span>
        <span>
          <strong>{food.fat}g</strong> G
        </span>
      </div>
    </div>
  );
}

function ModalTitleBar({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h3
          id="substitution-title"
          style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}
        >
          Substituições Inteligentes · Tabela TACO
        </h3>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          Opções equivalentes com base nutricional e preferências do paciente
        </span>
      </div>
      <button
        type="button"
        className="btn btn-subtle"
        onClick={onClose}
        style={{ fontSize: 18, padding: '2px 8px' }}
      >
        ✕
      </button>
    </div>
  );
}

interface ModalBodyContentProps {
  isPending: boolean;
  isError: boolean;
  substitutions?: FoodSubstitutionItem[];
  onApplySubstitution?: (targetItem: FoodSubstitutionItem) => void;
  onCopySingle: (item: FoodSubstitutionItem) => void;
  isReadOnly?: boolean;
  isApplying?: boolean;
}

function ModalBodyContent({
  isPending,
  isError,
  substitutions,
  onApplySubstitution,
  onCopySingle,
  isReadOnly,
  isApplying,
}: ModalBodyContentProps) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {isPending ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
          Calculando equivalências e hábitos do paciente...
        </div>
      ) : isError ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--coral)' }}>
          Falha ao carregar substituições do catálogo TACO.
        </div>
      ) : !substitutions || substitutions.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--fg-muted)' }}>
          Nenhum alimento substituto encontrado com proporção equivalente no catálogo.
        </div>
      ) : (
        substitutions.map((sub) => (
          <FoodSubstitutionOptionCard
            key={sub.foodId}
            item={sub}
            onApply={onApplySubstitution}
            onCopySingle={onCopySingle}
            isReadOnly={isReadOnly}
            isApplying={isApplying}
          />
        ))
      )}
    </div>
  );
}

interface ModalFooterProps {
  onCopyAll: () => void;
  onClose: () => void;
  disabled: boolean;
}

function ModalFooter({ onCopyAll, onClose, disabled }: ModalFooterProps) {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--paper-2)',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <button
        type="button"
        className="btn btn-primary"
        onClick={onCopyAll}
        disabled={disabled}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        📋 Copiar Todas as Opções para WhatsApp
      </button>

      <button type="button" className="btn btn-subtle" onClick={onClose} style={{ fontSize: 12 }}>
        Fechar
      </button>
    </div>
  );
}

export function FoodSubstitutionModal({
  isOpen,
  onClose,
  sourceFood,
  patientId,
  onApplySubstitution,
  isReadOnly,
  isApplying,
}: FoodSubstitutionModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const showToastSuccess = useToastStore((s) => s.showSuccess);
  const showToastError = useToastStore((s) => s.showError);
  const { mutate, data, isPending, isError } = useFoodSubstitutionCalculator(patientId);

  useEffect(() => {
    if (isOpen && sourceFood) {
      mutate({
        foodId: sourceFood.foodId,
        sourceFoodName: sourceFood.foodName,
        sourceAmount: sourceFood.referenceAmount,
        sourceUnit: sourceFood.unit,
        sourceKcal: sourceFood.kcal,
        sourceProt: sourceFood.prot,
        sourceCarb: sourceFood.carb,
        sourceFat: sourceFood.fat,
        limit: 8,
      });
    }
  }, [isOpen, sourceFood, mutate]);

  if (!isOpen || !sourceFood) return null;

  const handleCopyAll = () => {
    if (data?.whatsappMessage) {
      navigator.clipboard.writeText(data.whatsappMessage);
      showToastSuccess('Texto completo com substituições copiado para o WhatsApp!');
    } else {
      showToastError('Nenhuma mensagem gerada para copiar.');
    }
  };

  const handleCopySingle = (item: FoodSubstitutionItem) => {
    const text = `🥗 Substituição: ${item.householdPortion} de ${item.name} (${item.kcal} kcal | ${item.prot}g P | ${item.carb}g C | ${item.fat}g G)`;
    navigator.clipboard.writeText(text);
    showToastSuccess(`Substituição de ${item.name} copiada!`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="substitution-title"
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--paper)',
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <ModalTitleBar onClose={onClose} />
        <SourceFoodHeader food={sourceFood} />
        <ModalBodyContent
          isPending={isPending}
          isError={isError}
          substitutions={data?.substitutions}
          onApplySubstitution={onApplySubstitution}
          onCopySingle={handleCopySingle}
          isReadOnly={isReadOnly}
          isApplying={isApplying}
        />
        <ModalFooter
          onCopyAll={handleCopyAll}
          onClose={onClose}
          disabled={Boolean(isApplying || !data || data.substitutions.length === 0)}
        />
      </div>
    </div>
  );
}
