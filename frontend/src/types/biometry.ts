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
