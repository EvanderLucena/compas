export type PatientStatus = 'ontrack' | 'warning' | 'danger';
export type ObjectiveOption =
  | 'EMAGRECIMENTO'
  | 'HIPERTROFIA'
  | 'CONTROLE_GLICEMICO'
  | 'PERFORMANCE_ESPORTIVA'
  | 'REEDUCACAO_ALIMENTAR'
  | 'CONTROLE_PRESSAO'
  | 'SAUDE_GERAL';

export const OBJECTIVE_LABELS: Record<string, string> = {
  EMAGRECIMENTO: 'Emagrecimento',
  HIPERTROFIA: 'Hipertrofia',
  CONTROLE_GLICEMICO: 'Controle glicêmico',
  PERFORMANCE_ESPORTIVA: 'Performance esportiva',
  REEDUCACAO_ALIMENTAR: 'Reeducação alimentar',
  CONTROLE_PRESSAO: 'Controle pressão',
  SAUDE_GERAL: 'Saúde geral',
};

export const OBJECTIVE_KEYS = Object.keys(OBJECTIVE_LABELS) as ObjectiveOption[];

export const REVERSE_OBJECTIVE_LABELS: Record<string, ObjectiveOption> = Object.fromEntries(
  Object.entries(OBJECTIVE_LABELS).map(([k, v]) => [v, k as ObjectiveOption]),
) as Record<string, ObjectiveOption>;

export const STATUS_LABELS: Record<PatientStatus, string> = {
  ontrack: 'On-track',
  warning: 'Atenção',
  danger: 'Crítico',
};

export const STATUS_COLORS: Record<PatientStatus, string> = {
  ontrack: 'var(--sage)',
  warning: 'var(--amber)',
  danger: 'var(--coral)',
};

export interface MacroValues {
  target: number;
  actual: number;
}

export interface MacroTarget {
  kcal: MacroValues;
  prot: MacroValues;
  carb: MacroValues;
  fat: MacroValues;
}

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  birthDate: string | null;
  sex: string;
  heightCm: number | null;
  whatsapp: string | null;
  objective: string;
  status: PatientStatus;
  adherence: number;
  weight: number;
  weightDelta: number;
  tag: string;
  active?: boolean;
  aiAdherenceInsight?: string | null;
}

export interface PatientApiResponse {
  id: string;
  name: string;
  initials: string;
  age: number;
  birthDate: string | null;
  sex: string | null;
  heightCm: number | null;
  whatsapp: string | null;
  objective: string;
  status: 'ONTRACK' | 'WARNING' | 'DANGER';
  adherence: number;
  weight: number;
  weightDelta: number;
  tag: string;
  active: boolean;
  aiAdherenceInsight?: string | null;
}

export interface PatientListApiResponse {
  content: PatientApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const toFiniteNumber = (val: unknown, fallback = 0): number =>
  typeof val === 'number' && Number.isFinite(val) ? val : fallback;

const resolveInitials = (p: PatientApiResponse): string =>
  p.initials || (p.name ? p.name.substring(0, 2).toUpperCase() : '--');

const resolveObjective = (objective?: string | null): string =>
  !objective ? 'Sem objetivo' : (OBJECTIVE_LABELS[objective] ?? objective);

export function mapPatientFromApi(p: PatientApiResponse): Patient {
  return {
    id: p.id,
    name: p.name || 'Paciente sem nome',
    initials: resolveInitials(p),
    age: toFiniteNumber(p.age),
    birthDate: p.birthDate ?? null,
    sex: p.sex ?? '',
    heightCm: p.heightCm ?? null,
    whatsapp: p.whatsapp ?? null,
    objective: resolveObjective(p.objective),
    status: (p.status ? p.status.toLowerCase() : 'warning') as PatientStatus,
    adherence: toFiniteNumber(p.adherence),
    weight: toFiniteNumber(p.weight),
    weightDelta: toFiniteNumber(p.weightDelta),
    tag: p.tag || '',
    active: typeof p.active === 'boolean' ? p.active : true,
    aiAdherenceInsight: p.aiAdherenceInsight ?? null,
  };
}

export interface BiometricEntry {
  date: string;
  weight: number;
  fat: number;
  lean: number;
  water: number;
  visceral: number;
  bmr: number;
}

export interface SkinfoldEntry {
  name: string;
  value: number;
  delta: number;
}

export interface SkinfoldData {
  date: string;
  method: string;
  folds: SkinfoldEntry[];
}

export interface PerimetryMeasure {
  name: string;
  value: number;
  delta: number;
}

export interface PerimetryData {
  date: string;
  measures: PerimetryMeasure[];
}

export interface TimelineMacro {
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface TimelineEvent {
  time: string;
  meal: string;
  label: string;
  kind: 'plan' | 'log' | 'pending' | 'upcoming';
  items: string[];
  macros: TimelineMacro;
  status?: PatientStatus | 'pending';
  adherence?: number | null;
  aiNote?: string;
  hasMessage?: boolean;
  offPlan?: boolean;
  extractionId?: string;
  rawItems?: Array<{
    name: string;
    kcal: number;
    prot: number;
    carb: number;
    fat: number;
    grams?: number | null;
    sortOrder?: number;
  }>;
}

export interface DetailedPatient extends Patient {
  height: number;
  since: string;
  macrosToday: MacroTarget;
  biometry: BiometricEntry[];
  skinfolds: SkinfoldData;
  perimetry: PerimetryData;
  weekAdherence: number[];
  weekMacroFill: number[];
  timeline: TimelineEvent[];
  aiSummary: string;
}

export interface DashboardKPIs {
  activePatients: number;
  onTrackPatients: number;
  attentionPatients: number;
  criticalPatients: number;
  averageAdherence: number;
  assessedInLast30Days: number;
  pendingAssessmentCount: number;
}

export interface RecentEvaluation {
  patientId: string;
  patientName: string;
  initials: string;
  assessmentDate: string;
  weight: number;
  bodyFatPercent: number;
  status: PatientStatus;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recentEvaluations: RecentEvaluation[];
}

export interface BiometryAssessmentDTO {
  id: string;
  assessmentDate: string;
  weight: number;
  bodyFatPercent: number | null;
  leanMassKg: number | null;
  waterPercent: number | null;
  visceralFatLevel: number | null;
  bmrKcal: number | null;
  notes: string | null;
  skinfolds: { measureKey: string; valueMm: number; sortOrder: number }[];
  perimetry: { measureKey: string; valueCm: number; sortOrder: number }[];
}

export interface CreateBiometryAssessmentRequest {
  assessmentDate: string;
  weight: number;
  bodyFatPercent: number | null;
  leanMassKg?: number | null;
  waterPercent?: number | null;
  visceralFatLevel?: number | null;
  bmrKcal?: number | null;
  notes?: string | null;
  skinfolds?: { measureKey: string; valueMm: number; sortOrder: number }[];
  perimetry?: { measureKey: string; valueCm: number; sortOrder: number }[];
}

export interface UpdateBiometryAssessmentRequest {
  assessmentDate?: string | null;
  weight?: number | null;
  bodyFatPercent?: number | null;
  leanMassKg?: number | null;
  waterPercent?: number | null;
  visceralFatLevel?: number | null;
  bmrKcal?: number | null;
  notes?: string | null;
  skinfolds?: { measureKey: string; valueMm: number; sortOrder: number }[];
  perimetry?: { measureKey: string; valueCm: number; sortOrder: number }[];
}

export interface HistoryEpisodeListItem {
  episodeId: string;
  startDate: string;
  endDate: string | null;
  hasBiometry: boolean;
  assessmentCount: number;
  durationDays: number;
}

export interface TimelineEventDTO {
  id: string;
  eventType: string;
  eventAt: string;
  title: string;
  description: string | null;
  sourceRef: string | null;
}

export interface HistorySnapshot {
  episodeId: string;
  startDate: string;
  endDate: string | null;
  episodeObjective: string | null;
  mealSlotCount: number;
  foodItemCount: number;
  assessments: BiometryAssessmentDTO[];
  timelineEvents: TimelineEventDTO[];
}

export type * from './consumption';
