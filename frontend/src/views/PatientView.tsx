import * as React from 'react';
import { useParams } from 'react-router';
import { usePatient } from '../stores/patientStore';
import { usePlan } from '../stores/planStore';
import { mapPatientFromApi } from '../types/patient';
import type {
  BiometryAssessmentDTO,
  DetailedPatient,
  HistoryEpisodeListItem,
  MacroTarget,
} from '../types/patient';
import { IconEdit, IconPlus, IconDownload } from '../components/icons';
import { downloadPatientDocument } from '../api/documents';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';
import {
  EditPatientModal,
  Timeline,
  NewBiometryModal,
  MultiLineChart,
  StatusReviewModal,
  WhatsAppActivationRow,
  InsightsTab,
  BiometryEvolutionCard,
} from '../components/patient';
import { MacroRings, WeekBars, LineChart } from '../components/viz';
import {
  usePatientBiometry,
  useCreateBiometry,
  usePatientHistoryEpisodes,
  useHistoricalEpisode,
} from '../stores/clinicalStore';
import {
  useExtractions,
  mapExtractionsToTimelineEvents,
  toLocalDateString,
} from '../stores/whatsappStore';
import { PlansView } from './PlansView';
import type { PatientStatus } from '../types/patient';
import type { MealPlan } from '../types/plan';

type Tab = 'today' | 'plan' | 'biometry' | 'insights' | 'history';

const BIOMETRY_SKINFOLD_LABELS: Record<string, string> = {
  peitoral: 'Peitoral',
  axilar_medio: 'Axilar médio',
  triceps: 'Tríceps',
  subescapular: 'Subescapular',
  abdominal: 'Abdominal',
  suprailiaco: 'Suprailíaco',
  coxa: 'Coxa',
};

const BIOMETRY_PERIMETRY_LABELS: Record<string, string> = {
  cintura: 'Cintura',
  abdomen: 'Abdômen',
  quadril: 'Quadril',
  braco_d: 'Braço D',
  braco_e: 'Braço E',
  coxa_d: 'Coxa D',
  coxa_e: 'Coxa E',
  panturrilha_d: 'Panturrilha D',
};

function formatBiometryMeasureLabel(measureKey: string) {
  return (
    BIOMETRY_SKINFOLD_LABELS[measureKey] ?? BIOMETRY_PERIMETRY_LABELS[measureKey] ?? measureKey
  );
}

export function PatientView() {
  const { id } = useParams();
  const routePatientId = id ?? null;
  const { data: apiData, isLoading, isError } = usePatient(id ?? null);
  const { data: biometryAssessments } = usePatientBiometry(routePatientId);
  const { data: plan } = usePlan(routePatientId);
  const [tab, setTab] = React.useState<Tab>('today');
  const [editOpen, setEditOpen] = React.useState(false);
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  const mappedApiData = apiData ? mapPatientFromApi(apiData) : null;
  const hasRealPatient = mappedApiData !== null;

  const patient: DetailedPatient = {
    id: mappedApiData?.id ?? '',
    name: mappedApiData?.name ?? 'Paciente sem dados',
    initials: mappedApiData?.initials ?? '--',
    age: mappedApiData?.age ?? 0,
    birthDate: mappedApiData?.birthDate ?? null,
    sex: mappedApiData?.sex ?? '',
    heightCm: mappedApiData?.heightCm ?? 0,
    whatsapp: mappedApiData?.whatsapp ?? null,
    objective: mappedApiData?.objective ?? 'Sem objetivo definido',
    status: mappedApiData?.status ?? 'warning',
    adherence: mappedApiData?.adherence ?? 0,
    weight: mappedApiData?.weight ?? 0,
    weightDelta: mappedApiData?.weightDelta ?? 0,
    tag: mappedApiData?.tag ?? '',
    active: mappedApiData?.active ?? false,
    height: mappedApiData?.heightCm ?? 0,
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
    aiSummary: mappedApiData?.aiAdherenceInsight || '',
  };

  const fallbackLatestBiometryWeight = patient.weight;
  const fallbackPreviousBiometryWeight = null;
  const latestBiometryWeight =
    biometryAssessments?.[biometryAssessments.length - 1]?.weight ?? fallbackLatestBiometryWeight;
  const latestBiometryBodyFat =
    biometryAssessments?.[biometryAssessments.length - 1]?.bodyFatPercent ?? null;
  const latestBiometryDate =
    biometryAssessments?.[biometryAssessments.length - 1]?.assessmentDate ?? null;
  const previousBiometryWeight =
    biometryAssessments && biometryAssessments.length > 1
      ? (biometryAssessments[biometryAssessments.length - 2]?.weight ?? null)
      : fallbackPreviousBiometryWeight;
  const latestWeightDelta =
    previousBiometryWeight != null
      ? latestBiometryWeight - previousBiometryWeight
      : Number.isFinite(patient.weightDelta)
        ? patient.weightDelta
        : 0;
  const patientId = id ?? patient.id;
  const ageLabel =
    Number.isFinite(patient.age) && patient.age > 0 ? `${patient.age} anos` : 'Idade não informada';
  const sexLabel =
    patient.sex === 'F' ? 'Feminino' : patient.sex === 'M' ? 'Masculino' : 'Sexo não informado';
  const heightLabel =
    patient.heightCm != null && patient.heightCm > 0
      ? `${patient.heightCm} cm`
      : 'Altura não informada';

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

  return (
    <div className="page" style={{ maxWidth: 'none', padding: 0 }}>
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
        <div
          className="patient-header-row"
          style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 22,
              fontWeight: 600,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {patient.initials}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background:
                  patient.status === 'ontrack'
                    ? 'var(--sage)'
                    : patient.status === 'warning'
                      ? 'var(--amber)'
                      : 'var(--coral)',
                border: '3px solid var(--bg)',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div
              className="eyebrow"
              style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
            >
              <span>
                Paciente · {patient.id.toUpperCase()} · acompanhamento desde {patient.since}
              </span>
              {!patient.active && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: 'var(--coral)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  IA Pausada
                </span>
              )}
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 36,
                margin: '4px 0 6px',
                fontWeight: 400,
                letterSpacing: '-0.02em',
              }}
            >
              {patient.name}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                fontSize: 12.5,
                color: 'var(--fg-muted)',
                alignItems: 'center',
              }}
            >
              <span>
                {ageLabel} · {sexLabel}
              </span>
              <span>·</span>
              <span>
                {heightLabel} · {latestBiometryWeight} kg
              </span>
              <span>·</span>
              <span style={{ color: 'var(--fg)' }}>{patient.objective}</span>
              <button
                data-testid="btn-edit-patient-header"
                className="btn btn-ghost"
                style={{ fontSize: 11.5, padding: '3px 8px', marginLeft: 4 }}
                onClick={() => {
                  if (isReadOnly) {
                    openReadOnlyModal();
                    return;
                  }
                  setEditOpen(true);
                }}
              >
                <IconEdit size={11} /> Editar
              </button>
            </div>
          </div>
          <div
            className="patient-header-stats-row"
            style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}
          >
            <HeaderStat label="Adesão 7d" value={`${patient.adherence}%`} status={patient.status} />
            <div
              className="patient-header-dividers"
              style={{ width: 1, height: 44, background: 'var(--border)' }}
            />
            <HeaderStat
              label="Peso"
              value={`${latestBiometryWeight.toFixed(1)} kg`}
              sub={`${latestWeightDelta >= 0 ? '+' : ''}${latestWeightDelta.toFixed(1)} kg / 30d`}
              good={latestWeightDelta <= 0}
            />
            <div
              className="patient-header-dividers"
              style={{ width: 1, height: 44, background: 'var(--border)' }}
            />
            <HeaderStat
              label="% gordura"
              value={latestBiometryBodyFat != null ? `${latestBiometryBodyFat}%` : '—'}
              sub={
                latestBiometryDate
                  ? new Date(latestBiometryDate).toLocaleDateString('pt-BR')
                  : 'Sem avaliação'
              }
            />
          </div>
        </div>

        <WhatsAppActivationRow
          patient={patient}
          patientId={patientId}
          onEditPatient={() => {
            if (isReadOnly) {
              openReadOnlyModal();
              return;
            }
            setEditOpen(true);
          }}
        />

        <div
          className="patient-tab-row"
          style={{
            display: 'flex',
            gap: 2,
            marginTop: 20,
            borderBottom: '1px solid var(--border)',
            marginBottom: -21,
          }}
        >
          {[
            { k: 'today' as Tab, label: 'Hoje' },
            { k: 'plan' as Tab, label: 'Plano' },
            { k: 'biometry' as Tab, label: 'Biometria' },
            { k: 'insights' as Tab, label: 'Inteligência' },
            { k: 'history' as Tab, label: 'Histórico' },
          ].map((t) => (
            <button
              data-testid={`patient-tab-${t.k}`}
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: tab === t.k ? 'var(--fg)' : 'var(--fg-muted)',
                fontWeight: tab === t.k ? 600 : 400,
                borderBottom: tab === t.k ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: -1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'today' && (
        <TodayTab patient={patient} patientId={patientId} plan={plan ?? null} onSetTab={setTab} />
      )}
      {tab === 'plan' && <PlansView patientId={patientId} />}
      {tab === 'biometry' && <BiometryTab patientId={patientId} patientStatus={patient.status} />}
      {tab === 'insights' && (
        <InsightsTab
          patientId={patientId}
          adherenceInsight={patient.aiSummary}
          onNavigateToPlan={() => setTab('plan')}
        />
      )}
      {tab === 'history' && <HistoryTab patientId={patientId} />}

      {editOpen && <EditPatientModal patient={patient} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function TodayTab({
  patient,
  patientId,
  plan,
  onSetTab,
}: {
  patient: DetailedPatient;
  patientId: string;
  plan: MealPlan | null;
  onSetTab: (t: Tab) => void;
}) {
  const todayStr = React.useMemo(() => toLocalDateString(), []);
  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr);
  const isToday = selectedDate === todayStr;

  const dateInfo = React.useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const today = new Date();
    const todayFormatted = toLocalDateString(today);

    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const yesterdayFormatted = toLocalDateString(yesterday);

    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
    const shortMonth = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

    if (selectedDate === todayFormatted) {
      return {
        label: `Hoje · ${day} de ${monthName}`,
        short: 'hoje',
        dayOfWeekIndex: (d.getDay() + 6) % 7,
      };
    }
    if (selectedDate === yesterdayFormatted) {
      return {
        label: `Ontem · ${day} de ${monthName}`,
        short: 'ontem',
        dayOfWeekIndex: (d.getDay() + 6) % 7,
      };
    }
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return {
      label: `${capWeekday}, ${day} de ${monthName}`,
      short: `${day} de ${shortMonth}`,
      dayOfWeekIndex: (d.getDay() + 6) % 7,
    };
  }, [selectedDate]);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d - 1);
    setSelectedDate(toLocalDateString(date));
  };

  const handleNextDay = () => {
    if (selectedDate >= todayStr) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + 1);
    const nextFormatted = toLocalDateString(date);
    if (nextFormatted <= todayStr) {
      setSelectedDate(nextFormatted);
    }
  };

  const {
    data: extractions,
    isLoading: extractionsLoading,
    isError: extractionsError,
  } = useExtractions(patientId, selectedDate);

  const extractionEvents = React.useMemo(
    () => (extractions ? mapExtractionsToTimelineEvents(extractions) : []),
    [extractions],
  );
  const timelineEvents = React.useMemo(
    () => (isToday ? [...extractionEvents, ...patient.timeline] : extractionEvents),
    [extractionEvents, patient.timeline, isToday],
  );

  const kcalTarget = plan?.kcalTarget ?? patient.macrosToday.kcal.target;
  const protTarget = plan?.protTarget ?? patient.macrosToday.prot.target;
  const carbTarget = plan?.carbTarget ?? patient.macrosToday.carb.target;
  const fatTarget = plan?.fatTarget ?? patient.macrosToday.fat.target;

  const reportedMacrosToday: MacroTarget = React.useMemo(() => {
    let actualKcal = 0;
    let actualProt = 0;
    let actualCarb = 0;
    let actualFat = 0;

    if (extractions && extractions.length > 0) {
      actualKcal = Math.round(
        extractions.reduce((sum, ex) => sum + (Number(ex.totalKcal) || 0), 0),
      );
      actualProt = Math.round(
        extractions.reduce((sum, ex) => sum + (Number(ex.totalProt) || 0), 0),
      );
      actualCarb = Math.round(
        extractions.reduce((sum, ex) => sum + (Number(ex.totalCarb) || 0), 0),
      );
      actualFat = Math.round(extractions.reduce((sum, ex) => sum + (Number(ex.totalFat) || 0), 0));
    } else if (isToday) {
      const logs = timelineEvents.filter((ev) => ev.kind === 'log' && ev.macros);
      if (logs.length > 0) {
        actualKcal = Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.kcal || 0), 0));
        actualProt = Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.prot || 0), 0));
        actualCarb = Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.carb || 0), 0));
        actualFat = Math.round(logs.reduce((sum, ev) => sum + (ev.macros?.fat || 0), 0));
      } else {
        actualKcal = patient.macrosToday.kcal.actual;
        actualProt = patient.macrosToday.prot.actual;
        actualCarb = patient.macrosToday.carb.actual;
        actualFat = patient.macrosToday.fat.actual;
      }
    }

    return {
      kcal: { target: kcalTarget, actual: actualKcal },
      prot: { target: protTarget, actual: actualProt },
      carb: { target: carbTarget, actual: actualCarb },
      fat: { target: fatTarget, actual: actualFat },
    };
  }, [
    extractions,
    timelineEvents,
    patient.macrosToday,
    isToday,
    kcalTarget,
    protTarget,
    carbTarget,
    fatTarget,
  ]);

  const mealCount = plan?.meals?.length ?? 6;
  const timelineCount = timelineEvents.filter((ev) => ev.kind === 'log').length;
  const hasTimelineData = timelineCount > 0;

  const weekMacroFill = React.useMemo(() => {
    if (patient.weekMacroFill && patient.weekMacroFill.length === 7) {
      return patient.weekMacroFill;
    }
    const fillRatio =
      kcalTarget > 0 ? Math.min(1, reportedMacrosToday.kcal.actual / kcalTarget) : 0;
    const fill = [0, 0, 0, 0, 0, 0, 0];
    fill[dateInfo.dayOfWeekIndex] = fillRatio;
    return fill;
  }, [patient.weekMacroFill, kcalTarget, reportedMacrosToday.kcal.actual, dateInfo.dayOfWeekIndex]);

  return (
    <div>
      <div style={{ padding: '24px 28px' }}>
        {/* Barra de navegação por data com mini calendário */}
        <div
          className="today-date-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 20,
            padding: '10px 14px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              data-testid="btn-prev-day"
              className="btn btn-ghost"
              style={{ padding: '5px 10px', fontSize: 13 }}
              onClick={handlePrevDay}
              title="Ver dia anterior"
            >
              ◀
            </button>

            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '5px 14px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                title="Clique para abrir o calendário e escolher outra data"
              >
                <span style={{ fontSize: 14 }}>📅</span>
                <span>{dateInfo.label}</span>
                <span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginLeft: 4 }}>▼</span>
                <input
                  type="date"
                  data-testid="date-picker-input"
                  value={selectedDate}
                  max={todayStr}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                />
              </label>
            </div>

            <button
              data-testid="btn-next-day"
              className="btn btn-ghost"
              style={{ padding: '5px 10px', fontSize: 13, opacity: isToday ? 0.35 : 1 }}
              onClick={handleNextDay}
              disabled={isToday}
              title={isToday ? 'Você já está no dia de hoje' : 'Ver próximo dia'}
            >
              ▶
            </button>

            {!isToday && (
              <button
                data-testid="btn-go-today"
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px', marginLeft: 4 }}
                onClick={() => setSelectedDate(todayStr)}
              >
                Voltar para Hoje
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--fg-muted)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isToday ? 'var(--lime-dim)' : 'var(--fg-subtle)',
              }}
            />
            <span>{isToday ? 'Monitoramento em tempo real' : 'Visualizando dados históricos'}</span>
          </div>
        </div>

        <div
          className="today-cards-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}
        >
          {/* LEFT: Plano do dia */}
          <div className="card">
            <div className="card-h">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: 'var(--fg)',
                  flexShrink: 0,
                }}
              />
              <div className="title">Plano do dia</div>
              <div className="spacer" />
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11.5, padding: '4px 8px' }}
                onClick={() => onSetTab('plan')}
              >
                <IconEdit size={11} /> Editar
              </button>
            </div>
            <div className="card-b">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 14,
                }}
              >
                <div className="eyebrow">META DIÁRIA</div>
                <div className="mono tnum" style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
                  {mealCount} {mealCount === 1 ? 'refeição' : 'refeições'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">KCAL</div>
                  <div
                    className="mono tnum"
                    style={{ fontSize: 20, fontWeight: 500, marginTop: 2 }}
                  >
                    {kcalTarget.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">PROTEÍNA</div>
                  <div
                    className="mono tnum"
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: 'var(--sage-dim)',
                      marginTop: 2,
                    }}
                  >
                    {protTarget}g
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">CARBOIDRATO</div>
                  <div
                    className="mono tnum"
                    style={{ fontSize: 20, fontWeight: 500, color: 'var(--carb)', marginTop: 2 }}
                  >
                    {carbTarget}g
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">GORDURA</div>
                  <div
                    className="mono tnum"
                    style={{ fontSize: 20, fontWeight: 500, color: 'var(--sky)', marginTop: 2 }}
                  >
                    {fatTarget}g
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--fg-muted)',
                  lineHeight: 1.5,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: 'var(--fg-subtle)',
                    marginRight: 6,
                  }}
                >
                  OBSERVAÇÕES
                </span>
                {hasTimelineData
                  ? 'Observações baseadas nos registros do paciente.'
                  : 'Sem observações registradas até o momento.'}
              </div>
            </div>
          </div>

          {/* RIGHT: Consumo reportado */}
          <div className="card">
            <div className="card-h">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--lime-dim)',
                  boxShadow: '0 0 0 3px rgba(156,191,43,0.2)',
                  flexShrink: 0,
                }}
              />
              <div className="title">Consumo reportado</div>
              <div className="spacer" />
              <div className="chip ai">
                <span className="d" />
                {hasTimelineData
                  ? `${timelineCount} ${timelineCount === 1 ? 'registro' : 'registros'}`
                  : '0 registros'}
              </div>
            </div>
            <div className="card-b">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 14,
                }}
              >
                <div className="eyebrow">
                  {hasTimelineData ? 'EXTRAÍDO ATÉ AGORA' : 'AGUARDANDO REGISTROS'}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.06em' }}
                >
                  VIA WHATSAPP
                </div>
              </div>
              <MacroRings macros={reportedMacrosToday} size={64} />
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                  fontSize: 12,
                  color: 'var(--fg-muted)',
                  lineHeight: 1.55,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: 'var(--fg-subtle)',
                    marginRight: 6,
                  }}
                >
                  NOTA
                </span>
                {hasTimelineData
                  ? 'Macros estimados pela IA a partir do texto do paciente. Edite qualquer registro se houver erro de extração.'
                  : 'Assim que o paciente enviar mensagens no WhatsApp, os dados aparecem aqui.'}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly adherence */}
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-h">
            <div className="title">Adesão semanal</div>
            <div className="sub">SEG — DOM</div>
          </div>
          <div className="card-b">
            <WeekBars values={weekMacroFill} height={42} activeIndex={dateInfo.dayOfWeekIndex} />
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="card-h">
            <div className="title">Refeições reportadas · {dateInfo.short}</div>
            <div className="sub">
              {isToday ? 'SOMENTE REGISTROS DO PACIENTE' : `DATA: ${dateInfo.label.toUpperCase()}`}
            </div>
            <div className="spacer" />
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-muted)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-dim)' }}
              />{' '}
              Extraído via WhatsApp
            </div>
          </div>
          <div className="card-b tight">
            {extractionsLoading && (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  color: 'var(--fg-subtle)',
                  fontSize: 14,
                }}
              >
                Carregando extrações...
              </div>
            )}
            {extractionsError && !extractionsLoading && (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--coral)', fontSize: 13 }}>
                  Erro ao carregar extrações do WhatsApp.
                </p>
                <p style={{ color: 'var(--fg-muted)', fontSize: 11 }}>Mostrando dados locais.</p>
              </div>
            )}
            {!extractionsLoading && (
              <Timeline
                items={timelineEvents}
                patientId={patientId}
                emptyTitle={`Nenhum registro em ${dateInfo.short}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderStat({
  label,
  value,
  sub,
  status,
  good,
}: {
  label: string;
  value: string;
  sub?: string;
  status?: string;
  good?: boolean;
}) {
  const color =
    status === 'ontrack'
      ? 'var(--sage-dim)'
      : status === 'warning'
        ? 'var(--carb)'
        : status === 'danger'
          ? 'var(--coral-dim)'
          : good
            ? 'var(--sage-dim)'
            : 'var(--fg)';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minWidth: 68,
        whiteSpace: 'nowrap',
      }}
    >
      <div className="eyebrow">{label}</div>
      <div
        className="mono tnum"
        style={{ fontSize: 20, fontWeight: 500, color, letterSpacing: '-0.02em', marginTop: 2 }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function BiometryTab({
  patientId,
  patientStatus,
}: {
  patientId: string;
  patientStatus: PatientStatus;
}) {
  const { data: assessments, isLoading } = usePatientBiometry(patientId);
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);
  const [metric, setMetric] = React.useState('all');
  const [newEvalOpen, setNewEvalOpen] = React.useState(false);
  const [statusReviewOpen, setStatusReviewOpen] = React.useState(false);
  const createBiometry = useCreateBiometry(patientId);

  const list: BiometryAssessmentDTO[] = assessments ?? [];
  const last = list[list.length - 1] as BiometryAssessmentDTO | undefined;
  const prev = list.length >= 2 ? list[list.length - 2] : undefined;

  const metricCfg: Record<string, { label: string; unit?: string; color?: string }> = {
    all: { label: 'Todas' },
    weight: { label: 'Peso', unit: 'kg', color: 'var(--ink-contrast)' },
    fat: { label: 'Gordura', unit: '%', color: 'var(--carb)' },
    lean: { label: 'Massa', unit: 'kg', color: 'var(--sage-dim)' },
    water: { label: 'Água', unit: '%', color: 'var(--sky)' },
  };

  const handleSaveSuccess = () => {
    setNewEvalOpen(false);
    setStatusReviewOpen(true);
  };

  const [downloadingBiometry, setDownloadingBiometry] = React.useState(false);

  const handleDownloadBiometryPdf = async () => {
    try {
      setDownloadingBiometry(true);
      await downloadPatientDocument(patientId, 'biometry', `evolucao-biometrica-${patientId}.pdf`);
      useToastStore.getState().showSuccess('Relatório biométrico em PDF baixado com sucesso!');
    } catch {
      useToastStore.getState().showError('Erro ao baixar o relatório biométrico em PDF.');
    } finally {
      setDownloadingBiometry(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando biometria...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 16 }}>
            Nenhuma avaliação registrada ainda
          </p>
          <button
            className="btn btn-primary"
            data-testid="btn-new-biometry"
            onClick={() => {
              if (isReadOnly) {
                openReadOnlyModal();
                return;
              }
              setNewEvalOpen(true);
            }}
          >
            <IconPlus size={13} /> Registrar primeira avaliação
          </button>
        </div>
        {newEvalOpen && (
          <NewBiometryModal
            createMutation={createBiometry}
            onSuccess={handleSaveSuccess}
            onClose={() => setNewEvalOpen(false)}
          />
        )}
        {statusReviewOpen && (
          <StatusReviewModal
            patientId={patientId}
            currentStatus={patientStatus}
            onClose={() => setStatusReviewOpen(false)}
          />
        )}
      </div>
    );
  }

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const lastSkinfolds = last?.skinfolds ?? [];
  const lastPerimetry = last?.perimetry ?? [];
  const delta = (
    cur: number | null | undefined,
    prev: number | null | undefined,
  ): number | undefined => {
    if (cur == null || prev == null) return undefined;
    const d = cur - prev;
    return Math.round(d * 10) / 10;
  };
  const weightDelta = delta(last?.weight, prev?.weight);
  const bodyFatDelta = delta(last?.bodyFatPercent, prev?.bodyFatPercent);
  const leanMassDelta = delta(last?.leanMassKg, prev?.leanMassKg);

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Última avaliação */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div
          className="biometry-latest-grid"
          style={{
            padding: '18px 22px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <div>
            <div className="eyebrow">ÚLTIMA AVALIAÇÃO</div>
            <div
              className="serif"
              style={{ fontSize: 22, margin: '4px 0 0', letterSpacing: '-0.01em' }}
            >
              {fmtDate(last!.assessmentDate)}
            </div>
          </div>
          <div
            className="biometry-latest-cells"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 20,
              paddingLeft: 20,
              borderLeft: '1px solid var(--border)',
            }}
          >
            <BioCell
              label="Peso"
              value={last!.weight}
              unit="kg"
              delta={weightDelta}
              good={weightDelta != null && weightDelta <= 0}
            />
            <BioCell
              label="% Gordura"
              value={last!.bodyFatPercent ?? 0}
              unit="%"
              delta={bodyFatDelta}
              good={bodyFatDelta != null && bodyFatDelta < 0}
            />
            <BioCell
              label="Massa magra"
              value={last!.leanMassKg ?? 0}
              unit="kg"
              delta={leanMassDelta}
              good={leanMassDelta != null && leanMassDelta > 0}
            />
            <BioCell label="% Água" value={last!.waterPercent ?? 0} unit="%" />
            <BioCell label="Gordura visceral" value={last!.visceralFatLevel ?? 0} sub="nível" />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="btn-download-biometry-pdf"
              onClick={handleDownloadBiometryPdf}
              disabled={downloadingBiometry}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Baixar Relatório de Evolução Biométrica em PDF"
            >
              <IconDownload size={13} /> {downloadingBiometry ? 'Baixando...' : 'Relatório em PDF'}
            </button>
            <button
              className="btn btn-primary"
              data-testid="btn-new-biometry"
              onClick={() => {
                if (isReadOnly) {
                  openReadOnlyModal();
                  return;
                }
                setNewEvalOpen(true);
              }}
            >
              <IconPlus size={13} /> Nova avaliação
            </button>
          </div>
        </div>
      </div>

      {/* Card de Inteligência da Evolução Corporal */}
      <BiometryEvolutionCard patientId={patientId} />

      {/* Evolução chart */}
      {list.length >= 2 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h">
            <div className="title">Evolução · {list.length} avaliações</div>
            <div className="sub">
              {fmtDate(list[0].assessmentDate)} → {fmtDate(last!.assessmentDate).toUpperCase()}
            </div>
            <div className="spacer" />
            <div className="seg" style={{ height: 26 }}>
              {Object.keys(metricCfg).map((k) => (
                <button
                  key={k}
                  className={metric === k ? 'active' : ''}
                  onClick={() => setMetric(k)}
                >
                  {metricCfg[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="card-b">
            {metric === 'all' ? (
              <MultiLineChart
                data={list.map((a) => ({
                  date: fmtDate(a.assessmentDate),
                  weight: a.weight,
                  fat: a.bodyFatPercent ?? 0,
                  lean: a.leanMassKg ?? 0,
                  water: a.waterPercent ?? 0,
                  visceral: a.visceralFatLevel ?? 0,
                  bmr: a.bmrKcal ?? 0,
                }))}
                metrics={[
                  { key: 'weight', color: 'var(--ink-contrast)', label: 'Peso', unit: 'kg' },
                  { key: 'fat', color: 'var(--carb)', label: 'Gordura', unit: '%' },
                  { key: 'lean', color: 'var(--sage-dim)', label: 'Massa', unit: 'kg' },
                  { key: 'water', color: 'var(--sky)', label: 'Água', unit: '%' },
                ]}
              />
            ) : (
              <LineChart
                data={list.map((a) => ({
                  date: fmtDate(a.assessmentDate),
                  weight: a.weight,
                  fat: a.bodyFatPercent ?? 0,
                  lean: a.leanMassKg ?? 0,
                  water: a.waterPercent ?? 0,
                  visceral: a.visceralFatLevel ?? 0,
                  bmr: a.bmrKcal ?? 0,
                }))}
                width={900}
                height={200}
                yKey={metric}
                color={metricCfg[metric].color}
                fill="rgba(11,12,10,0.05)"
                unit={metricCfg[metric].unit || ''}
              />
            )}
          </div>
        </div>
      )}

      {/* Dobras cutâneas + Perimetria */}
      {lastSkinfolds.length > 0 && lastPerimetry.length > 0 && (
        <div
          className="biometry-charts-grid"
          style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 16 }}
        >
          {lastSkinfolds.length > 0 && (
            <div className="card">
              <div className="card-h">
                <div className="title">Dobras cutâneas</div>
                <div className="sub">PROTOCOLO POLLOCK 7 · ADIPÔMETRO</div>
                <div className="spacer" />
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                  {fmtDate(last!.assessmentDate)}
                </div>
              </div>
              <div className="card-b">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {lastSkinfolds.map((f, i) => {
                    const prevVal = prev?.skinfolds?.find(
                      (ps) => ps.measureKey === f.measureKey,
                    )?.valueMm;
                    const d = prevVal != null ? Math.round((f.valueMm - prevVal) * 10) / 10 : 0;
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          background: 'var(--surface-2)',
                          borderRadius: 6,
                        }}
                      >
                        <div style={{ flex: 1, fontSize: 12.5 }}>
                          {formatBiometryMeasureLabel(f.measureKey)}
                        </div>
                        <div className="mono tnum" style={{ fontSize: 15, fontWeight: 600 }}>
                          {f.valueMm}
                          <span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginLeft: 3 }}>
                            mm
                          </span>
                        </div>
                        <div
                          className="mono tnum"
                          style={{
                            fontSize: 11,
                            minWidth: 36,
                            textAlign: 'right',
                            color:
                              d < 0
                                ? 'var(--sage-dim)'
                                : d > 0
                                  ? 'var(--coral)'
                                  : 'var(--fg-subtle)',
                          }}
                        >
                          {d > 0 ? '+' : ''}
                          {d !== 0 ? d.toFixed(0) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div className="eyebrow">SOMATÓRIO DOBRAS</div>
                    <div
                      className="mono tnum"
                      style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}
                    >
                      {lastSkinfolds.reduce((s, f) => s + f.valueMm, 0).toFixed(0)}{' '}
                      <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {lastPerimetry.length > 0 && (
            <div className="card">
              <div className="card-h">
                <div className="title">Perimetria</div>
                <div className="sub">CIRCUNFERÊNCIAS · CM</div>
                <div className="spacer" />
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                  {fmtDate(last!.assessmentDate)}
                </div>
              </div>
              <div className="card-b tight">
                {lastPerimetry.map((m, i) => {
                  const prevVal = prev?.perimetry?.find(
                    (pp) => pp.measureKey === m.measureKey,
                  )?.valueCm;
                  const d = prevVal != null ? Math.round((m.valueCm - prevVal) * 10) / 10 : 0;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: 16,
                        padding: '12px 18px',
                        borderBottom:
                          i === lastPerimetry.length - 1 ? 'none' : '1px solid var(--border)',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontSize: 13 }}>{formatBiometryMeasureLabel(m.measureKey)}</div>
                      <div className="mono tnum" style={{ fontSize: 14, fontWeight: 500 }}>
                        {m.valueCm}{' '}
                        <span style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>cm</span>
                      </div>
                      <div
                        className="mono tnum"
                        style={{
                          fontSize: 11,
                          width: 48,
                          textAlign: 'right',
                          color:
                            d < 0
                              ? 'var(--sage-dim)'
                              : d > 0
                                ? 'var(--fg-muted)'
                                : 'var(--fg-subtle)',
                        }}
                      >
                        {d > 0 ? '+' : ''}
                        {d.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Histórico de avaliações */}
      <div className="card">
        <div className="card-h">
          <div className="title">Histórico de avaliações</div>
          <div className="sub">APPEND-ONLY · AUDITORIA CLÍNICA</div>
        </div>
        <div
          className="biometry-table-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr',
            padding: '10px 18px',
            borderBottom: '1px solid var(--border)',
            gap: 12,
          }}
        >
          {['Data', 'Peso', '% Gordura', 'Magra', '% Água', 'TMB'].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 10 }}>
              {h}
            </div>
          ))}
        </div>
        {[...list].reverse().map((b, i, arr) => (
          <div
            key={b.id ?? i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr',
              padding: '12px 18px',
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border)',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div className="mono" style={{ fontSize: 12, color: 'var(--fg)' }}>
              {fmtDate(b.assessmentDate)}
            </div>
            <div className="mono tnum" style={{ fontSize: 12.5, fontWeight: 500 }}>
              {b.weight} kg
            </div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--carb)' }}>
              {b.bodyFatPercent ?? '—'}
              {b.bodyFatPercent != null ? '%' : ''}
            </div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--sage-dim)' }}>
              {b.leanMassKg ?? '—'}
              {b.leanMassKg != null ? ' kg' : ''}
            </div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--sky)' }}>
              {b.waterPercent ?? '—'}
              {b.waterPercent != null ? '%' : ''}
            </div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              {b.bmrKcal ?? '—'}
              {b.bmrKcal != null ? ' kcal' : ''}
            </div>
          </div>
        ))}
      </div>
      {newEvalOpen && (
        <NewBiometryModal
          createMutation={createBiometry}
          onSuccess={handleSaveSuccess}
          onClose={() => setNewEvalOpen(false)}
        />
      )}
      {statusReviewOpen && (
        <StatusReviewModal
          patientId={patientId}
          currentStatus={patientStatus}
          onClose={() => setStatusReviewOpen(false)}
        />
      )}
    </div>
  );
}

function BioCell({
  label,
  value,
  unit,
  sub,
  delta,
  good,
}: {
  label: string;
  value: number;
  unit?: string;
  sub?: string;
  delta?: number;
  good?: boolean;
}) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
        <div
          className="mono tnum"
          style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          {value}
        </div>
        {unit && <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{unit}</div>}
      </div>
      {delta !== undefined && (
        <div
          className="mono tnum"
          style={{
            fontSize: 10.5,
            color: good ? 'var(--sage-dim)' : 'var(--fg-muted)',
            marginTop: 1,
          }}
        >
          {delta > 0 ? '+' : ''}
          {delta} vs. anterior
        </div>
      )}
      {sub && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ patientId }: { patientId: string }) {
  const { data: episodes, isLoading } = usePatientHistoryEpisodes(patientId);
  const [selectedEpisodeId, setSelectedEpisodeId] = React.useState<string | null>(null);
  const { data: snapshot, isLoading: snapshotLoading } = useHistoricalEpisode(
    patientId,
    selectedEpisodeId,
  );

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando histórico...</p>
      </div>
    );
  }

  const episodeList: HistoryEpisodeListItem[] = episodes ?? [];

  if (episodeList.length === 0) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            Nenhum episódio fechado encontrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">Episódios finalizados</div>
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>
          <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--fg)' }}>
            {episodeList.length}
          </span>{' '}
          {episodeList.length === 1 ? 'episódio' : 'episódios'} · clique para ver detalhes
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {episodeList.map((ep) => (
          <div
            key={ep.episodeId}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() =>
              setSelectedEpisodeId(selectedEpisodeId === ep.episodeId ? null : ep.episodeId)
            }
          >
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {fmtDate(ep.startDate)} → {fmtDate(ep.endDate)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                  {ep.durationDays} dias · {ep.assessmentCount}{' '}
                  {ep.assessmentCount === 1 ? 'avaliação' : 'avaliações'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {ep.hasBiometry ? (
                  <span className="chip ontrack">
                    <span className="d" />
                    Com biometria
                  </span>
                ) : (
                  <span
                    className="chip"
                    style={{ background: 'var(--surface-2)', color: 'var(--fg-subtle)' }}
                  >
                    Sem biometria
                  </span>
                )}
                <span style={{ color: 'var(--fg-subtle)', fontSize: 16 }}>
                  {selectedEpisodeId === ep.episodeId ? '▴' : '▾'}
                </span>
              </div>
            </div>

            {selectedEpisodeId === ep.episodeId && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {snapshotLoading && (
                  <div
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      color: 'var(--fg-subtle)',
                      fontSize: 13,
                    }}
                  >
                    Carregando...
                  </div>
                )}
                {snapshot && !snapshotLoading && (
                  <div style={{ padding: '14px 18px' }}>
                    {snapshot.assessments.length > 0 ? (
                      <div style={{ marginBottom: 16 }}>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>
                          AVALIAÇÕES BIOMÉTRICAS
                        </div>
                        {snapshot.assessments.map((a) => (
                          <div
                            key={a.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr 1fr',
                              gap: 12,
                              padding: '10px 12px',
                              background: 'var(--surface-2)',
                              borderRadius: 6,
                              marginBottom: 6,
                            }}
                          >
                            <div>
                              <div className="eyebrow">DATA</div>
                              <div className="mono tnum" style={{ fontSize: 12 }}>
                                {fmtDate(a.assessmentDate)}
                              </div>
                            </div>
                            <div>
                              <div className="eyebrow">PESO</div>
                              <div className="mono tnum" style={{ fontSize: 12 }}>
                                {a.weight} kg
                              </div>
                            </div>
                            <div>
                              <div className="eyebrow">% GORDURA</div>
                              <div className="mono tnum" style={{ fontSize: 12 }}>
                                {a.bodyFatPercent ?? '—'}
                                {a.bodyFatPercent != null ? '%' : ''}
                              </div>
                            </div>
                            <div>
                              <div className="eyebrow">MASSA MAGRA</div>
                              <div className="mono tnum" style={{ fontSize: 12 }}>
                                {a.leanMassKg ?? '—'}
                                {a.leanMassKg != null ? ' kg' : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '14px 0',
                          textAlign: 'center',
                          color: 'var(--fg-subtle)',
                          fontSize: 13,
                        }}
                      >
                        Sem avaliação registrada no período
                      </div>
                    )}

                    {snapshot.timelineEvents.length > 0 ? (
                      <div>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>
                          EVENTOS
                        </div>
                        {snapshot.timelineEvents.map((ev) => (
                          <div
                            key={ev.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '120px 1fr',
                              gap: 12,
                              padding: '10px 12px',
                              borderBottom: '1px solid var(--border)',
                              alignItems: 'start',
                            }}
                          >
                            <div
                              className="mono"
                              style={{ fontSize: 11, color: 'var(--fg-subtle)' }}
                            >
                              {fmtDateTime(ev.eventAt)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                              {ev.description && (
                                <div
                                  style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}
                                >
                                  {ev.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '18px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: 'var(--fg-subtle)', marginBottom: 4 }}>
                          Sem eventos no período
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
                          Avaliações, planos e registros aparecem aqui
                        </div>
                      </div>
                    )}

                    {snapshot.episodeObjective && (
                      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fg-muted)' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.06em',
                            color: 'var(--fg-subtle)',
                            marginRight: 6,
                          }}
                        >
                          OBJETIVO
                        </span>
                        {snapshot.episodeObjective}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
