import * as React from 'react';
import { useNavigate } from 'react-router';
import { usePatients } from '../stores/patientStore';
import { useAuthStore } from '../stores/authStore';
import { useDashboard } from '../stores/clinicalStore';
import { useWhatsAppStatus } from '../stores/whatsappStore';
import { mapPatientFromApi } from '../types/patient';
import { HomeHeader, HomeKpiGrid, HomePatientGrid, useHomeMetrics } from '../components/home';

const PAGE_SIZE = 8;

export function HomeView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = usePatients();
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useDashboard();
  const { data: whatsappStatus, isLoading: isWhatsappLoading } = useWhatsAppStatus();

  const activePats = React.useMemo(() => (data?.content ?? []).map(mapPatientFromApi), [data]);
  const patientSlice = activePats.slice(0, PAGE_SIZE);

  const kpis = dashboardData?.kpis;
  const metrics = useHomeMetrics(kpis, activePats, data?.totalElements);

  if (isLoading || isDashboardLoading) {
    return <div className="page">Carregando painel...</div>;
  }

  if (isError || isDashboardError) {
    return <div className="page">Erro ao carregar dados do painel.</div>;
  }

  if (!kpis || activePats.length === 0) {
    return (
      <div className="page">
        <h1 className="serif" style={{ fontSize: 34, margin: 0, fontWeight: 400 }}>
          Sem dados agregados disponíveis
        </h1>
        <p style={{ color: 'var(--fg-muted)', marginTop: 10 }}>
          Assim que houver pacientes e eventos clínicos, o resumo da carteira aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <HomeHeader
        userName={user?.name}
        headerDate={metrics.headerDate}
        onTrack={metrics.onTrack}
        warning={metrics.warning}
        danger={metrics.danger}
      />
      <HomeKpiGrid
        activePatients={metrics.activePatientsCount}
        patientCountText={metrics.patientCountText}
        avgAdherence={metrics.avgAdherence}
        assessedInLast30Days={metrics.assessedInLast30Days}
        dangerCount={metrics.danger}
        whatsappStatus={whatsappStatus}
        isWhatsappLoading={isWhatsappLoading}
      />
      <HomePatientGrid
        patients={patientSlice}
        patientCountText={metrics.patientCountText}
        isLoading={isLoading}
        onNavigate={(id) => navigate(`/patient/${id}`)}
      />
    </div>
  );
}
