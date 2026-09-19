import { useState } from 'react';
import {
  useConsumptionPatterns,
  useEvaluateAdherence,
  useAdoptFrequentFood,
} from '../../stores/patientStore';
import { FrequentFoodItemRow } from './FrequentFoodItemRow';
import type { FrequentOffPlanFood, PatientConsumptionPatterns } from '../../types/patient';

interface InsightsTabProps {
  patientId: string;
  adherenceInsight?: string | null;
  onNavigateToPlan?: () => void;
}

export function InsightsTab({ patientId, adherenceInsight, onNavigateToPlan }: InsightsTabProps) {
  const { data: patterns, isLoading: patternsLoading } = useConsumptionPatterns(patientId);

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdherenceCard patientId={patientId} adherenceInsight={adherenceInsight} />
      <ObservedPatternsCard patterns={patterns} isLoading={patternsLoading} />
      <FrequentOffPlanCard
        patientId={patientId}
        patterns={patterns}
        isLoading={patternsLoading}
        onNavigateToPlan={onNavigateToPlan}
      />
    </div>
  );
}

function AdherenceCard({
  patientId,
  adherenceInsight,
}: {
  patientId: string;
  adherenceInsight?: string | null;
}) {
  const evaluateAdherenceMutation = useEvaluateAdherence();

  return (
    <div
      className="card"
      style={{
        borderLeft: '4px solid var(--lime)',
        background: 'var(--surface)',
      }}
    >
      <div className="card-h" style={{ alignItems: 'center' }}>
        <div>
          <div className="title">Diagnóstico Clínico de Adesão</div>
          <div className="sub">AVALIAÇÃO BASEADA NAS REFEIÇÕES DO WHATSAPP</div>
        </div>
        <div className="spacer" />
        <button
          type="button"
          className="btn btn-ghost"
          style={{
            fontSize: 12,
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--lime)',
            borderColor: 'rgba(163, 230, 53, 0.3)',
          }}
          disabled={evaluateAdherenceMutation.isPending}
          onClick={() => evaluateAdherenceMutation.mutate(patientId)}
        >
          {evaluateAdherenceMutation.isPending ? 'Reavaliando...' : '🔄 Reavaliar Adesão com IA'}
        </button>
      </div>
      <div className="card-b" style={{ fontSize: 13.5, color: 'var(--fg)', lineHeight: 1.6 }}>
        {adherenceInsight ||
          'Nenhuma avaliação de adesão recente. Clique em "Reavaliar Adesão com IA" para analisar os registros recentes do paciente.'}
      </div>
    </div>
  );
}

function ObservedPatternsCard({
  patterns,
  isLoading,
}: {
  patterns?: PatientConsumptionPatterns;
  isLoading: boolean;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <div className="title">Padrões observados no consumo</div>
          <div className="sub">ÚLTIMOS 14 DIAS · DADOS EXTRAÍDOS REAIS</div>
        </div>
        <div className="spacer" />
        <div
          className="mono"
          style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.06em' }}
        >
          {patterns ? `${patterns.totalLoggedMeals} REFEIÇÕES ANALISADAS` : 'PROCESSANDO'}
        </div>
      </div>
      <div className="card-b">
        {isLoading ? (
          <div style={{ color: 'var(--fg-subtle)', fontSize: 13 }}>
            Carregando padrões de consumo...
          </div>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {(patterns?.observedPatterns ?? []).map((t, i) => (
              <li key={i} style={{ fontSize: 13.5, display: 'flex', gap: 12, color: 'var(--fg)' }}>
                <span
                  style={{ color: 'var(--lime-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                >
                  0{i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FrequentOffPlanCard({
  patientId,
  patterns,
  isLoading,
  onNavigateToPlan,
}: {
  patientId: string;
  patterns?: PatientConsumptionPatterns;
  isLoading: boolean;
  onNavigateToPlan?: () => void;
}) {
  const adoptMutation = useAdoptFrequentFood();
  const [adoptingFoodName, setAdoptingFoodName] = useState<string | null>(null);

  const handleAdopt = async (food: FrequentOffPlanFood) => {
    if (!food.mealSlotId) {
      if (onNavigateToPlan) onNavigateToPlan();
      return;
    }
    setAdoptingFoodName(food.foodName);
    try {
      await adoptMutation.mutateAsync({
        patientId,
        mealId: food.mealSlotId,
        data: {
          foodName: food.foodName,
          typicalGrams: food.typicalGrams,
          typicalKcal: food.typicalKcal,
          typicalProt: food.typicalProt,
          typicalCarb: food.typicalCarb,
          typicalFat: food.typicalFat,
        },
      });
    } finally {
      setAdoptingFoodName(null);
    }
  };

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <div className="title">Preferências Reais & Alimentos Recorrentes Fora do Cardápio</div>
          <div className="sub">
            Substituições espontâneas detectadas nas refeições reais (últimos 14 dias)
          </div>
        </div>
        <div className="spacer" />
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: 'var(--lime-dim)',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          SINALIZAÇÃO CLÍNICA
        </div>
      </div>
      <div className="card-b">
        {isLoading ? (
          <div style={{ color: 'var(--fg-subtle)', fontSize: 13 }}>
            Analisando alimentos registrados...
          </div>
        ) : !patterns?.frequentOffPlanFoods || patterns.frequentOffPlanFoods.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--fg-muted)',
              fontSize: 13.5,
              background: 'var(--surface-sunken)',
              borderRadius: 8,
            }}
          >
            ✅ <strong>Excelente consistência alimentar:</strong> Nenhum alimento não planejado com
            consumo recorrente identificado nos últimos 14 dias. O paciente está seguindo as opções
            prescritas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Estes alimentos foram consumidos repetidamente pelo paciente e não constam no cardápio
              base. Você pode complementar o plano alimentar adicionando-os como{' '}
              <strong>Opção Alternativa</strong> em cada refeição, mantendo a dieta original 100%
              intacta.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {patterns.frequentOffPlanFoods.map((food, idx) => (
                <FrequentFoodItemRow
                  key={idx}
                  food={food}
                  isAdopting={adoptingFoodName === food.foodName && adoptMutation.isPending}
                  onAdopt={() => handleAdopt(food)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
