export interface SkinfoldEntry {
  name: string;
  value: number;
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

export interface PerimetryDelta {
  measureKey: string;
  label: string;
  initialCm: number;
  currentCm: number;
  deltaCm: number;
}

export interface BiometryEvolutionSummary {
  assessmentCount: number;
  initialAssessmentDate: string | null;
  latestAssessmentDate: string | null;
  initialWeight: number | null;
  currentWeight: number | null;
  weightDelta: number | null;
  initialBodyFatPercent: number | null;
  currentBodyFatPercent: number | null;
  bodyFatDelta: number | null;
  initialLeanMassKg: number | null;
  currentLeanMassKg: number | null;
  leanMassDelta: number | null;
  initialFatMassKg: number | null;
  currentFatMassKg: number | null;
  fatMassDelta: number | null;
  perimetryDeltas: PerimetryDelta[];
  clinicalSynthesis: string;
  whatsappFeedbackMessage: string;
}

export interface SkinfoldDelta {
  measureKey: string;
  label: string;
  initialMm: number | null;
  currentMm: number | null;
  deltaMm: number | null;
  deltaPercent: number | null;
}

export interface BiometryComparisonData {
  baseAssessmentId: string;
  targetAssessmentId: string;
  baseDate: string | null;
  targetDate: string | null;
  daysBetween: number;
  baseWeight: number | null;
  targetWeight: number | null;
  weightDelta: number | null;
  weightDeltaPercent: number | null;
  baseBodyFatPercent: number | null;
  targetBodyFatPercent: number | null;
  bodyFatDelta: number | null;
  baseLeanMassKg: number | null;
  targetLeanMassKg: number | null;
  leanMassDelta: number | null;
  baseFatMassKg: number | null;
  targetFatMassKg: number | null;
  fatMassDelta: number | null;
  baseWaterPercent: number | null;
  targetWaterPercent: number | null;
  waterDelta: number | null;
  baseVisceralFat: number | null;
  targetVisceralFat: number | null;
  visceralFatDelta: number | null;
  baseBmrKcal: number | null;
  targetBmrKcal: number | null;
  bmrDeltaKcal: number | null;
  baseSkinfoldsSumMm: number | null;
  targetSkinfoldsSumMm: number | null;
  skinfoldsSumDeltaMm: number | null;
  skinfoldsSumDeltaPercent: number | null;
  skinfoldDeltas: SkinfoldDelta[];
  baseWaistHipRatio: number | null;
  targetWaistHipRatio: number | null;
  waistHipRatioDelta: number | null;
  perimetryDeltas: PerimetryDelta[];
  clinicalClassification: string;
  clinicalSynthesis: string;
  whatsappFeedbackMessage: string;
}
