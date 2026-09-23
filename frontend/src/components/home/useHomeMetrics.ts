import { useMemo } from 'react';
import type { Patient, DashboardData } from '../../types/patient';

function computeStatusCounts(kpis?: DashboardData['kpis'], activePats: Patient[] = []) {
  return {
    onTrack: kpis?.onTrackPatients ?? activePats.filter((p) => p.status === 'ontrack').length,
    warning: kpis?.attentionPatients ?? activePats.filter((p) => p.status === 'warning').length,
    danger: kpis?.criticalPatients ?? activePats.filter((p) => p.status === 'danger').length,
  };
}

function computeAvgAdherence(kpis?: DashboardData['kpis'], activePats: Patient[] = []) {
  if (kpis?.averageAdherence !== undefined) {
    return kpis.averageAdherence;
  }
  if (activePats.length === 0) {
    return 0;
  }
  return Math.round(activePats.reduce((sum, p) => sum + p.adherence, 0) / activePats.length);
}

function formatHeaderDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function useHomeMetrics(
  kpis?: DashboardData['kpis'],
  activePats: Patient[] = [],
  totalElements = 0,
) {
  return useMemo(() => {
    const { onTrack, warning, danger } = computeStatusCounts(kpis, activePats);
    const avgAdherence = computeAvgAdherence(kpis, activePats);
    const activePatientsCount = kpis?.activePatients ?? totalElements;
    const countSuffix = activePats.length === 1 ? 'paciente' : 'pacientes';
    const patientCountText = `${activePats.length} ${countSuffix}`;
    const headerDate = formatHeaderDate();

    return {
      onTrack,
      warning,
      danger,
      avgAdherence,
      activePatientsCount,
      patientCountText,
      headerDate,
    };
  }, [kpis, activePats, totalElements]);
}
