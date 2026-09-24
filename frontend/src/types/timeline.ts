export type TimelineCategory =
  'ALL' | 'CONSULTATION' | 'PLAN' | 'BIOMETRY' | 'MEAL' | 'PRESCRIPTION' | 'GOAL' | 'NOTE';

export interface PatientTimelineEvent {
  id: string;
  episodeId: string;
  episodeTitle: string;
  currentEpisode: boolean;
  eventType: string;
  eventAt: string;
  title: string;
  description: string | null;
  sourceRef: string | null;
  metadataJson: string | null;
}

export interface CreateTimelineNoteRequest {
  title: string;
  description?: string;
  eventAt?: string;
}
