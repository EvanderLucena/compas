import type { SentimentDistribution } from '../../types/clinicalRadar';

interface SentimentSectionProps {
  sentimentDistribution: SentimentDistribution;
  totalSentiments: number;
}

function SentimentBarItem({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontWeight: 500 }}>{label}</span>
        </div>
        <span className="mono tnum" style={{ color: 'var(--fg-muted)', fontSize: 12 }}>
          {count} ({percentage}%)
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export function SentimentSection({
  sentimentDistribution,
  totalSentiments,
}: SentimentSectionProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div className="card" style={{ padding: '20px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Bússola Emocional (Últimos 14 dias)
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
          Clima e Sentimento da Carteira
        </div>

        <SentimentBarItem
          label="Motivado e Confiante"
          count={sentimentDistribution.motivated}
          total={totalSentiments}
          color="var(--sage)"
        />
        <SentimentBarItem
          label="Neutro / Rotina Normal"
          count={sentimentDistribution.neutral}
          total={totalSentiments}
          color="#64748b"
        />
        <SentimentBarItem
          label="Com Dificuldade / Culpa"
          count={sentimentDistribution.struggling}
          total={totalSentiments}
          color="var(--coral)"
        />
        <SentimentBarItem
          label="Ansioso / Em Dúvida"
          count={sentimentDistribution.anxious}
          total={totalSentiments}
          color="var(--amber)"
        />
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Acompanhamento Ativo
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
          Como a triagem apoia sua conduta
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          O sistema monitora continuamente os relatos recebidos no WhatsApp e prioriza situações que
          merecem um contato profissional mais próximo.
        </p>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--sage)', fontWeight: 700 }}>✔</span>
            <span>
              <strong>Apoio contra abandono:</strong> pacientes desmotivados ou com sentimento de
              culpa são priorizados para resgate antes da desistência.
            </span>
          </div>
          <div style={{ fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--sage)', fontWeight: 700 }}>✔</span>
            <span>
              <strong>Segurança nutricional:</strong> queixas de desconforto gástrico ou fome
              intensa chegam diretamente à sua fila de atenção.
            </span>
          </div>
          <div style={{ fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--sage)', fontWeight: 700 }}>✔</span>
            <span>
              <strong>Contato ágil:</strong> abra o WhatsApp do paciente direto do alerta para
              enviar um áudio ou mensagem de acolhimento.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
