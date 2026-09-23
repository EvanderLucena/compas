import { KPI } from '../KPI';
import { IconWhatsapp, IconMeal } from '../icons';

interface HomeKpiGridProps {
  activePatients: number;
  patientCountText: string;
  avgAdherence: number;
  assessedInLast30Days: number;
  dangerCount: number;
  whatsappStatus?: {
    extractionsToday?: number;
    activePatientsCount?: number;
  } | null;
  isWhatsappLoading: boolean;
}

export function HomeKpiGrid({
  activePatients,
  patientCountText,
  avgAdherence,
  assessedInLast30Days,
  dangerCount,
  whatsappStatus,
  isWhatsappLoading,
}: HomeKpiGridProps) {
  const extractionsVal = isWhatsappLoading ? '...' : String(whatsappStatus?.extractionsToday ?? 0);
  const activeWaVal = isWhatsappLoading ? '...' : String(whatsappStatus?.activePatientsCount ?? 0);

  return (
    <div
      className="home-kpi-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
        marginBottom: 18,
      }}
    >
      <KPI label="Pacientes ativos" value={String(activePatients)} sub={patientCountText} />
      <KPI label="Adesão média" value={`${avgAdherence}%`} sub="média da carteira" />
      <KPI label="Avaliados 30d" value={String(assessedInLast30Days)} sub="últimos 30 dias" />
      <KPI
        label="Sem registro há >3 dias"
        value={String(dangerCount)}
        sub="contato recomendado"
        danger
      />
      <KPI
        label="Refeições extraídas hoje"
        value={extractionsVal}
        sub="via WhatsApp"
        icon={<IconWhatsapp size={18} />}
      />
      <KPI
        label="Pacientes ativos no WhatsApp"
        value={activeWaVal}
        sub="ativaram WhatsApp"
        icon={<IconMeal size={18} />}
      />
    </div>
  );
}
