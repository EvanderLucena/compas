import type { TimelineCategory, PatientTimelineEvent } from '../../../types/timeline';

export interface BadgeConfig {
  label: string;
  bg: string;
  color: string;
}

export const BADGE_CONFIG_MAP: Record<string, BadgeConfig> = {
  CONSULTATION: { label: 'Consulta', bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' },
  PLAN_CREATED: { label: 'Plano Criado', bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
  PLAN_UPDATED: { label: 'Plano Ajustado', bg: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
  BIOMETRY: { label: 'Biometria', bg: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' },
  EPISODE_BIOMETRY_CREATED: {
    label: 'Biometria',
    bg: 'rgba(168, 85, 247, 0.12)',
    color: '#9333ea',
  },
  BIOMETRY_ASSESSMENT: { label: 'Biometria', bg: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' },
  MEAL_EXTRACTION: { label: 'WhatsApp Refeição', bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706' },
  PRESCRIPTION: { label: 'Prescrição', bg: 'rgba(6, 182, 212, 0.12)', color: '#0891b2' },
  GOAL_ACHIEVED: { label: 'Meta Atingida', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669' },
  NOTE: { label: 'Anotação', bg: 'rgba(148, 163, 184, 0.12)', color: '#64748b' },
  EPISODE_OPENED: { label: 'Ciclo Aberto', bg: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5' },
  EPISODE_CLOSED: { label: 'Ciclo Concluído', bg: 'rgba(100, 116, 139, 0.12)', color: '#475569' },
};

const DEFAULT_BADGE: BadgeConfig = {
  label: 'Registro',
  bg: 'var(--surface-2)',
  color: 'var(--fg-muted)',
};

export function getBadgeConfig(eventType: string): BadgeConfig {
  return BADGE_CONFIG_MAP[eventType.toUpperCase()] ?? DEFAULT_BADGE;
}

const CATEGORY_KEYWORDS: Record<Exclude<TimelineCategory, 'ALL'>, string[]> = {
  CONSULTATION: ['CONSULTATION', 'APPOINTMENT'],
  PLAN: ['PLAN'],
  BIOMETRY: ['BIOMETRY'],
  MEAL: ['MEAL', 'EXTRACTION', 'WHATSAPP'],
  PRESCRIPTION: ['PRESCRIPTION'],
  GOAL: ['GOAL', 'MILESTONE'],
  NOTE: ['NOTE', 'ALERT'],
};

export function matchesCategory(eventType: string, cat: TimelineCategory): boolean {
  if (cat === 'ALL') return true;
  const keywords = CATEGORY_KEYWORDS[cat] ?? [];
  const upper = eventType.toUpperCase();
  return keywords.some((kw) => upper.includes(kw));
}

export function computeCategoryCounts(
  events: PatientTimelineEvent[],
): Record<TimelineCategory, number> {
  const counts: Record<TimelineCategory, number> = {
    ALL: events.length,
    CONSULTATION: 0,
    PLAN: 0,
    BIOMETRY: 0,
    MEAL: 0,
    PRESCRIPTION: 0,
    GOAL: 0,
    NOTE: 0,
  };

  const cats = Object.keys(CATEGORY_KEYWORDS) as (keyof typeof CATEGORY_KEYWORDS)[];

  for (const ev of events) {
    for (const cat of cats) {
      if (matchesCategory(ev.eventType, cat)) {
        counts[cat]++;
      }
    }
  }

  return counts;
}
