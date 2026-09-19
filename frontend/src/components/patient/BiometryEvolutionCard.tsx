import { useBiometryEvolutionSummary } from '../../stores/clinicalStore';
import { EvolutionHeader, EvolutionMetricsGrid } from './BiometryEvolutionSubcomponents';
import {
  PerimetryDeltasGrid,
  EvolutionSynthesisBox,
  EvolutionWhatsAppAction,
} from './BiometryEvolutionDetails';

interface BiometryEvolutionCardProps {
  patientId: string;
}

export function BiometryEvolutionCard({ patientId }: BiometryEvolutionCardProps) {
  const { data: summary, isLoading } = useBiometryEvolutionSummary(patientId);

  if (isLoading || !summary || summary.assessmentCount === 0) {
    return null;
  }

  const isMultiple = summary.assessmentCount >= 2;

  return (
    <div
      className="card"
      data-testid="biometry-evolution-card"
      style={{
        marginBottom: 16,
        border: '1px solid var(--paper-3)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <EvolutionHeader summary={summary} isMultiple={isMultiple} />
      <div className="card-b" style={{ padding: '16px 20px' }}>
        <EvolutionMetricsGrid summary={summary} isMultiple={isMultiple} />
        {isMultiple && <PerimetryDeltasGrid deltas={summary.perimetryDeltas} />}
        <EvolutionSynthesisBox clinicalSynthesis={summary.clinicalSynthesis} />
        {summary.whatsappFeedbackMessage && (
          <EvolutionWhatsAppAction whatsappMessage={summary.whatsappFeedbackMessage} />
        )}
      </div>
    </div>
  );
}
