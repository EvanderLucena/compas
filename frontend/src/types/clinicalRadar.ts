export interface AttentionItem {
  messageId: string;
  patientId: string | null;
  patientName: string;
  patientWhatsapp: string;
  messageSnippet: string;
  intent: string | null;
  intentConfidence: number | null;
  sentiment: string | null;
  sentimentConfidence: number | null;
  attentionScore: number | null;
  createdAt: string;
}

export interface RadarSummary {
  totalPatients: number;
  requiringAttentionCount: number;
  strugglingCount: number;
  todayExtractionsCount: number;
  whatsappConnected: boolean;
}

export interface SentimentDistribution {
  motivated: number;
  neutral: number;
  struggling: number;
  anxious: number;
}

export interface ClinicalRadarData {
  summary: RadarSummary;
  attentionQueue: AttentionItem[];
  sentimentDistribution: SentimentDistribution;
}
