import { MacroRings } from '../viz';
import type { MacroTarget } from '../../types/patient';

interface TodayReportedCardProps {
  timelineCount: number;
  hasTimelineData: boolean;
  reportedMacrosToday: MacroTarget;
}

export function TodayReportedCard({
  timelineCount,
  hasTimelineData,
  reportedMacrosToday,
}: TodayReportedCardProps) {
  return (
    <div className="card">
      <div className="card-h">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--lime-dim)',
            boxShadow: '0 0 0 3px rgba(156,191,43,0.2)',
            flexShrink: 0,
          }}
        />
        <div className="title">Consumo reportado</div>
        <div className="spacer" />
        <div className="chip ai">
          <span className="d" />
          {hasTimelineData
            ? `${timelineCount} ${timelineCount === 1 ? 'registro' : 'registros'}`
            : '0 registros'}
        </div>
      </div>
      <div className="card-b">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
          }}
        >
          <div className="eyebrow">
            {hasTimelineData ? 'EXTRAÍDO ATÉ AGORA' : 'AGUARDANDO REGISTROS'}
          </div>
          <div
            className="mono"
            style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.06em' }}
          >
            VIA WHATSAPP
          </div>
        </div>
        <MacroRings macros={reportedMacrosToday} size={64} />
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--fg-muted)',
            lineHeight: 1.55,
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'var(--fg-subtle)',
              marginRight: 6,
            }}
          >
            NOTA
          </span>
          {hasTimelineData
            ? 'Macros estimados pela IA a partir do texto do paciente. Edite qualquer registro se houver erro de extração.'
            : 'Assim que o paciente enviar mensagens no WhatsApp, os dados aparecem aqui.'}
        </div>
      </div>
    </div>
  );
}
