export interface CrnRegionOption {
  code: string;
  label: string;
}

export const CRN_REGIONS: CrnRegionOption[] = [
  { code: 'CRN-1', label: 'CRN-1 (DF, GO, MT, TO)' },
  { code: 'CRN-2', label: 'CRN-2 (RS)' },
  { code: 'CRN-3', label: 'CRN-3 (SP, MS)' },
  { code: 'CRN-4', label: 'CRN-4 (RJ, ES)' },
  { code: 'CRN-5', label: 'CRN-5 (BA, SE)' },
  { code: 'CRN-6', label: 'CRN-6 (AL, PB, PE, RN)' },
  { code: 'CRN-7', label: 'CRN-7 (AC, AM, AP, PA, RO, RR)' },
  { code: 'CRN-8', label: 'CRN-8 (PR)' },
  { code: 'CRN-9', label: 'CRN-9 (MG)' },
  { code: 'CRN-10', label: 'CRN-10 (SC)' },
  { code: 'CRN-11', label: 'CRN-11 (CE, MA, PI)' },
  { code: 'Outro', label: 'Outro Conselho / Provisório' },
];

const UF_TO_CRN: Record<string, string> = {
  DF: 'CRN-1',
  GO: 'CRN-1',
  MT: 'CRN-1',
  TO: 'CRN-1',
  RS: 'CRN-2',
  SP: 'CRN-3',
  MS: 'CRN-3',
  RJ: 'CRN-4',
  ES: 'CRN-4',
  BA: 'CRN-5',
  SE: 'CRN-5',
  AL: 'CRN-6',
  PB: 'CRN-6',
  PE: 'CRN-6',
  RN: 'CRN-6',
  AC: 'CRN-7',
  AM: 'CRN-7',
  AP: 'CRN-7',
  PA: 'CRN-7',
  RO: 'CRN-7',
  RR: 'CRN-7',
  PR: 'CRN-8',
  MG: 'CRN-9',
  SC: 'CRN-10',
  CE: 'CRN-11',
  MA: 'CRN-11',
  PI: 'CRN-11',
};

export function normalizeCrnRegion(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (UF_TO_CRN[upper]) {
    return UF_TO_CRN[upper];
  }
  const match = CRN_REGIONS.find((r) => r.code.toUpperCase() === upper);
  if (match) return match.code;
  return trimmed;
}

export const CLINICAL_SPECIALTIES = [
  { value: 'Emagrecimento & Obesidade', label: 'Emagrecimento & Obesidade' },
  { value: 'Nutrição Esportiva', label: 'Nutrição Esportiva & Performance' },
  { value: 'Saúde da Mulher & Fertilidade', label: 'Saúde da Mulher & Fertilidade' },
  { value: 'Nutrição Clínica', label: 'Nutrição Clínica & Doenças Crônicas' },
  { value: 'Nutrição Comportamental', label: 'Nutrição Comportamental & Transtornos' },
  { value: 'Materno-Infantil', label: 'Materno-Infantil (Gestantes & Crianças)' },
  { value: 'Vegetarianismo & Veganismo', label: 'Vegetarianismo & Veganismo' },
  { value: 'Nutrição Funcional', label: 'Nutrição Funcional & Longevidade' },
  { value: 'Outra', label: 'Outra especialidade' },
];

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}
