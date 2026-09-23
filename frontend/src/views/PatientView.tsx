import * as React from 'react';
import { useParams } from 'react-router';
import { usePatient } from '../stores/patientStore';
import { usePlan } from '../stores/planStore';
import { mapPatientFromApi } from '../types/patient';
import type { DetailedPatient } from '../types/patient';
import type { MealPlan } from '../types/plan';
import { useAuthStore } from '../stores/authStore';
import {
  EditPatientModal,
  InsightsTab,
  TodayTab,
  BiometryTab,
  HistoryTab,
  PatientHeader,
} from '../components/patient';
import type { Tab } from '../components/patient/PatientHeader';
import { usePatientBiometry } from '../stores/clinicalStore';
import { PlansView } from './PlansView';

const DEFAULT_PATIENT_FIELDS: DetailedPatient = {
  id: '',
  name: 'Paciente sem dados',
  initials: '--',
  age: 0,
  birthDate: null,
  sex: '',
  heightCm: 0,
  whatsapp: null,
  objective: 'Sem objetivo definido',
  status: 'warning',
  adherence: 0,
  weight: 0,
  weightDelta: 0,
  tag: '',
  active: false,
  height: 0,
  since: '',
  macrosToday: {
    kcal: { target: 0, actual: 0 },
    prot: { target: 0, actual: 0 },
    carb: { target: 0, actual: 0 },
    fat: { target: 0, actual: 0 },
  },
  biometry: [],
  skinfolds: { date: '', method: '', folds: [] },
  perimetry: { date: '', measures: [] },
  weekAdherence: [],
  weekMacroFill: [],
  timeline: [],
  aiSummary: '',
};

function buildDetailedPatient(
  mapped: ReturnType<typeof mapPatientFromApi> | null,
): DetailedPatient {
  if (!mapped) return DEFAULT_PATIENT_FIELDS;
  return {
    ...DEFAULT_PATIENT_FIELDS,
    ...mapped,
    height: mapped.heightCm ?? 0,
    heightCm: mapped.heightCm ?? 0,
    aiSummary: mapped.aiAdherenceInsight || '',
  };
}

function computeBiometryStats(
  assessments:
    { weight: number; bodyFatPercent?: number | null; assessmentDate: string }[] | undefined,
  fallbackWeight: number,
  fallbackDelta: number,
) {
  if (!assessments || assessments.length === 0) {
    return {
      latestWeight: fallbackWeight,
      latestBodyFat: null,
      latestDate: null,
      weightDelta: Number.isFinite(fallbackDelta) ? fallbackDelta : 0,
    };
  }
  const latest = assessments[assessments.length - 1];
  const previous = assessments.length > 1 ? assessments[assessments.length - 2] : null;
  const latestWeight = latest.weight ?? fallbackWeight;
  const weightDelta =
    previous != null
      ? latestWeight - previous.weight
      : Number.isFinite(fallbackDelta)
        ? fallbackDelta
        : 0;
  return {
    latestWeight,
    latestBodyFat: latest.bodyFatPercent ?? null,
    latestDate: latest.assessmentDate ?? null,
    weightDelta,
  };
}

function PatientTabContent({
  tab,
  patient,
  patientId,
  plan,
  onSetTab,
}: {
  tab: Tab;
  patient: DetailedPatient;
  patientId: string;
  plan: MealPlan | null;
  onSetTab: (t: Tab) => void;
}) {
  switch (tab) {
    case 'today':
      return <TodayTab patient={patient} patientId={patientId} plan={plan} onSetTab={onSetTab} />;
    case 'plan':
      return <PlansView patientId={patientId} />;
    case 'biometry':
      return <BiometryTab patientId={patientId} patientStatus={patient.status} />;
    case 'insights':
      return (
        <InsightsTab
          patientId={patientId}
          adherenceInsight={patient.aiSummary}
          onNavigateToPlan={() => onSetTab('plan')}
        />
      );
    case 'history':
      return <HistoryTab patientId={patientId} />;
  }
}

export function PatientView() {
  const { id } = useParams();
  const routePatientId = id ?? null;
  const { data: apiData, isLoading, isError } = usePatient(routePatientId);
  const { data: biometryAssessments } = usePatientBiometry(routePatientId);
  const { data: plan } = usePlan(routePatientId);
  const [tab, setTab] = React.useState<Tab>('today');
  const [editOpen, setEditOpen] = React.useState(false);
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  const mappedApiData = apiData ? mapPatientFromApi(apiData) : null;
  const hasRealPatient = mappedApiData !== null;
  const patient = React.useMemo(() => buildDetailedPatient(mappedApiData), [mappedApiData]);
  const { latestWeight, latestBodyFat, latestDate, weightDelta } = React.useMemo(
    () => computeBiometryStats(biometryAssessments, patient.weight, patient.weightDelta),
    [biometryAssessments, patient.weight, patient.weightDelta],
  );
  const patientId = id ?? patient.id;

  if (isLoading) {
    return (
      <div className="page" style={{ maxWidth: 'none', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando paciente...</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="page" style={{ maxWidth: 'none', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--coral)', fontSize: 14 }}>
          Erro ao carregar paciente. Tente novamente.
        </p>
      </div>
    );
  }
  if (!hasRealPatient) {
    return (
      <div className="page" style={{ maxWidth: 'none', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>
          Sem dados reais deste paciente no momento.
        </p>
      </div>
    );
  }

  const handleEditPatient = () => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    setEditOpen(true);
  };

  return (
    <div className="page" style={{ maxWidth: 'none', padding: 0 }}>
      <PatientHeader
        patient={patient}
        patientId={patientId}
        tab={tab}
        onSetTab={setTab}
        latestBiometryWeight={latestWeight}
        latestBiometryBodyFat={latestBodyFat}
        latestBiometryDate={latestDate}
        latestWeightDelta={weightDelta}
        onEditPatient={handleEditPatient}
      />
      <PatientTabContent
        tab={tab}
        patient={patient}
        patientId={patientId}
        plan={plan ?? null}
        onSetTab={setTab}
      />

      {editOpen && <EditPatientModal patient={patient} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
