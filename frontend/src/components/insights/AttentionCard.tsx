import { useNavigate } from 'react-router';
import type { AttentionItem } from '../../types/clinicalRadar';
import { useNavigationStore } from '../../stores/navigationStore';

interface AttentionCardProps {
  item: AttentionItem;
  isResolving: boolean;
  onResolve: (messageId: string) => void;
}

function AttentionBadges({
  urgencyPercent,
  isStruggling,
}: {
  urgencyPercent: number;
  isStruggling: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        className="mono"
        style={{
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 6,
          background: 'color-mix(in srgb, var(--coral) 15%, transparent)',
          color: 'var(--coral)',
          fontWeight: 600,
        }}
      >
        {urgencyPercent >= 80 ? 'Atenção imediata' : 'Atenção recomendada'}
      </span>
      {isStruggling && (
        <span
          className="mono"
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'color-mix(in srgb, var(--amber) 15%, transparent)',
            color: 'var(--amber)',
            fontWeight: 600,
          }}
        >
          Dificuldade relatada
        </span>
      )}
    </div>
  );
}

function AttentionActions({
  waLink,
  isResolving,
  onResolve,
}: {
  waLink: string;
  isResolving: boolean;
  onResolve: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="btn btn-secondary"
        style={{
          fontSize: 12,
          padding: '6px 14px',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        Abrir WhatsApp
      </a>
      <button
        type="button"
        className="btn btn-primary"
        style={{ fontSize: 12, padding: '6px 14px' }}
        disabled={isResolving}
        onClick={onResolve}
      >
        Marcar como Resolvido
      </button>
    </div>
  );
}

export function AttentionCard({ item, isResolving, onResolve }: AttentionCardProps) {
  const navigate = useNavigate();
  const { setView, setActivePatientId } = useNavigationStore();

  const urgencyPercent = item.attentionScore ? Math.round(Number(item.attentionScore) * 100) : 85;
  const isStruggling = item.sentiment?.includes('struggling') || item.sentiment?.includes('guilty');

  const phoneClean = item.patientWhatsapp.replace(/\D/g, '');
  const waLink =
    phoneClean.length >= 12 && phoneClean.startsWith('55')
      ? `https://wa.me/${phoneClean}`
      : `https://wa.me/55${phoneClean}`;

  const handleOpenPatient = () => {
    if (!item.patientId) return;
    setActivePatientId(item.patientId);
    setView('patient');
    navigate(`/patient/${item.patientId}`);
  };

  return (
    <div
      className="card"
      data-testid={`attention-card-${item.messageId}`}
      style={{
        padding: '18px 20px',
        borderLeft: `4px solid ${isStruggling ? 'var(--coral)' : 'var(--amber)'}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{item.patientName}</span>
            {item.patientId && (
              <button
                type="button"
                data-testid="btn-ver-prontuario"
                onClick={handleOpenPatient}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--lime-dim, #2563eb)',
                  textDecoration: 'none',
                }}
              >
                Ver prontuário →
              </button>
            )}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 2 }}>
            {new Date(item.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <AttentionBadges urgencyPercent={urgencyPercent} isStruggling={Boolean(isStruggling)} />
      </div>

      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          padding: '10px 14px',
          borderRadius: 6,
          fontSize: 13.5,
          fontStyle: 'italic',
          color: 'var(--fg)',
          marginBottom: 12,
          lineHeight: 1.45,
        }}
      >
        "{item.messageSnippet}"
      </div>

      <AttentionActions
        waLink={waLink}
        isResolving={isResolving}
        onResolve={() => onResolve(item.messageId)}
      />
    </div>
  );
}
