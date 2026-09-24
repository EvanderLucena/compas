import { useState } from 'react';
import type { BiometryComparisonData } from '../../types/biometry';
import { useToastStore } from '../../stores/toastStore';
import { IconCopy } from '../icons';

interface BiometryComparisonFeedbackProps {
  comparison: BiometryComparisonData;
  onDownloadPdf?: () => void;
  downloadingPdf?: boolean;
}

const CLASSIFICATION_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  RECOMPOSICAO_CORPORAL: {
    label: 'Recomposição Corporal (+ Massa / - Gordura)',
    bg: 'var(--sage-dim, rgba(16,185,129,0.15))',
    color: 'var(--sage, #10b981)',
  },
  EMAGRECIMENTO: {
    label: 'Emagrecimento Saudável (Perda de Gordura)',
    bg: 'var(--sage-dim, rgba(16,185,129,0.15))',
    color: 'var(--sage, #10b981)',
  },
  HIPERTROFIA: {
    label: 'Hipertrofia Muscular (Ganho de Massa Magra)',
    bg: 'rgba(59, 130, 246, 0.15)',
    color: 'var(--sky, #3b82f6)',
  },
  REDUCAO_PONDERAL: {
    label: 'Redução Ponderal Geral',
    bg: 'var(--sage-dim, rgba(16,185,129,0.15))',
    color: 'var(--sage, #10b981)',
  },
  AUMENTO_PONDERAL: {
    label: 'Aumento Ponderal',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: 'var(--amber, #f59e0b)',
  },
  MANUTENCAO: {
    label: 'Estabilidade / Manutenção Ponderal',
    bg: 'var(--paper-3)',
    color: 'var(--fg-muted)',
  },
};

export function BiometryComparisonFeedback({
  comparison,
  onDownloadPdf,
  downloadingPdf,
}: BiometryComparisonFeedbackProps) {
  const [copied, setCopied] = useState(false);
  const cfg =
    CLASSIFICATION_CONFIG[comparison.clinicalClassification] ?? CLASSIFICATION_CONFIG.MANUTENCAO;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(comparison.clinicalSynthesis);
      setCopied(true);
      useToastStore.getState().showSuccess('Síntese clínica copiada para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useToastStore.getState().showError('Não foi possível copiar o texto.');
    }
  };

  const handleShareWhatsApp = () => {
    if (!comparison.whatsappFeedbackMessage) return;
    const encoded = encodeURIComponent(comparison.whatsappFeedbackMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--paper-2)' }}>
      {/* Classification Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
          }}
        >
          Classificação Clínica:
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 6,
            backgroundColor: cfg.bg,
            color: cfg.color,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Synthesis Narrative */}
      <div
        className="card"
        style={{
          padding: '16px',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            Síntese Comparativa da Evolução
          </span>
          <button
            type="button"
            className="btn btn-subtle"
            style={{
              fontSize: 12,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={handleCopy}
          >
            <IconCopy size={13} /> {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
          {comparison.clinicalSynthesis}
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {comparison.whatsappFeedbackMessage && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={handleShareWhatsApp}
          >
            📱 Enviar Resumo ao Paciente via WhatsApp
          </button>
        )}
        {onDownloadPdf && (
          <button
            type="button"
            className="btn btn-subtle"
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={onDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? 'Gerando PDF...' : '📄 Baixar Relatório em PDF'}
          </button>
        )}
      </div>
    </div>
  );
}
