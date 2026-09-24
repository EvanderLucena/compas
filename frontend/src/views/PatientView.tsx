import * as React from 'react';
import { useParams, Link } from 'react-router';
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
  PrescriptionsTab,
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

function getValidNumber(val: unknown, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

function computeBiometryStats(
  assessments:
    { weight: number; bodyFatPercent?: number | null; assessmentDate: string }[] | undefined,
  fallbackWeight: number,
  fallbackDelta: number,
) {
  const safeWeight = getValidNumber(fallbackWeight, 0);
  const safeDelta = getValidNumber(fallbackDelta, 0);
  if (!assessments?.length) {
    return {
      latestWeight: safeWeight,
      latestBodyFat: null,
      latestDate: null,
      weightDelta: safeDelta,
    };
  }
  const latest = assessments[assessments.length - 1];
  const prev = assessments[assessments.length - 2];
  const latestWeight = getValidNumber(latest?.weight, safeWeight);
  const hasPrev = prev && typeof prev.weight === 'number' && Number.isFinite(prev.weight);
  const delta = hasPrev ? latestWeight - prev.weight : safeDelta;
  const bf = latest?.bodyFatPercent;
  const latestBodyFat = typeof bf === 'number' && Number.isFinite(bf) ? bf : null;
  return {
    latestWeight,
    latestBodyFat,
    latestDate: latest?.assessmentDate ?? null,
    weightDelta: getValidNumber(delta, 0),
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
    case 'prescriptions':
      return (
        <PrescriptionsTab patientId={patientId} patientPhone={patient.whatsapp ?? undefined} />
      );
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

function PatientLoadingState() {
  return (
    <div className="page" style={{ maxWidth: 'none', padding: 40, textAlign: 'center' }}>
      <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando paciente...</p>
    </div>
  );
}

function PatientErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isNotFound =
    (error as { status?: number } | null)?.status === 404 ||
    (error as { response?: { status?: number } } | null)?.response?.status === 404;

  return (
    <div className="page" style={{ maxWidth: 'none', padding: '60px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--coral)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        {isNotFound ? 'Paciente não encontrado' : 'Erro ao carregar paciente'}
      </p>
      <p style={{ color: 'var(--fg-subtle)', fontSize: 14, marginBottom: 20 }}>
        {isNotFound
          ? 'Este paciente não foi encontrado ou você não possui permissão para acessá-lo.'
          : 'Não foi possível carregar os dados do paciente. Verifique sua conexão e tente novamente.'}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {!isNotFound && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
        <Link to="/patients" className={isNotFound ? 'btn btn-primary' : 'btn btn-secondary'}>
          Voltar para lista de pacientes
        </Link>
      </div>
    </div>
  );
}

function PatientEmptyState() {
  return (
    <div className="page" style={{ maxWidth: 'none', padding: '60px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--fg-subtle)', fontSize: 14, marginBottom: 16 }}>
        Sem dados reais deste paciente no momento.
      </p>
      <Link to="/patients" className="btn btn-secondary">
        Voltar para lista de pacientes
      </Link>
    </div>
  );
}

export function PatientView() {
  const { id } = useParams();
  const routePatientId = id ?? null;
  const { data: apiData, isLoading, isError, error, refetch } = usePatient(routePatientId);
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
    return <PatientLoadingState />;
  }
  if (isError) {
    return <PatientErrorState error={error} onRetry={() => void refetch()} />;
  }
  if (!hasRealPatient) {
    return <PatientEmptyState />;
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
