import { useMemo } from 'react';
import { useClinicalRadar, useResolveAttention } from '../stores/clinicalRadarStore';
import { AttentionCard } from '../components/insights/AttentionCard';
import { SentimentSection } from '../components/insights/SentimentSection';
import { InsightsHeader } from '../components/insights/InsightsHeader';
import { RadarKpis } from '../components/insights/RadarKpis';

export function InsightsView() {
  const { data, isLoading, isError, refetch } = useClinicalRadar();
  const resolveMutation = useResolveAttention();

  const totalSentiments = useMemo(() => {
    if (!data?.sentimentDistribution) return 0;
    const { motivated, neutral, struggling, anxious } = data.sentimentDistribution;
    return motivated + neutral + struggling + anxious;
  }, [data?.sentimentDistribution]);

  if (isLoading) {
    return (
      <div className="page" style={{ padding: '24px 32px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Carregando radar...
        </div>
        <p style={{ color: 'var(--fg-muted)' }}>
          Analisando sinais clínicos e emocionais da carteira...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page" style={{ padding: '24px 32px' }}>
        <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 10px', fontWeight: 400 }}>
          Erro ao carregar Radar Clínico
        </h1>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', marginBottom: 16 }}>
          Não foi possível sincronizar as análises do WhatsApp.
        </p>
        <button type="button" className="btn btn-secondary" onClick={() => refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const { summary, attentionQueue, sentimentDistribution } = data;

  return (
    <div className="page" style={{ padding: '24px 32px', maxWidth: 1100 }}>
      <InsightsHeader whatsappConnected={summary.whatsappConnected} />
      <RadarKpis summary={summary} />

      <div className="divider" style={{ margin: '24px 0 16px' }}>
        <span>Fila de Atenção ({attentionQueue.length})</span>
      </div>

      {attentionQueue.length === 0 ? (
        <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>✨</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
            Nenhum paciente necessitando de intervenção urgente
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--fg-muted)',
              maxWidth: 520,
              marginInline: 'auto',
            }}
          >
            As interações recentes estão dentro do fluxo automático e em bom ritmo de adesão. Quando
            um paciente relatar culpa, dúvida fora do escopo ou risco de desengajamento, ele
            aparecerá aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {attentionQueue.map((item) => (
            <AttentionCard
              key={item.messageId}
              item={item}
              isResolving={resolveMutation.isPending}
              onResolve={(msgId) => resolveMutation.mutate(msgId)}
            />
          ))}
        </div>
      )}

      <SentimentSection
        sentimentDistribution={sentimentDistribution}
        totalSentiments={totalSentiments}
      />
    </div>
  );
}
