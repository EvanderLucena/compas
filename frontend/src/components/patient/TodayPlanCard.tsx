import { IconEdit } from '../icons';

interface TodayPlanCardProps {
  mealCount: number;
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  hasTimelineData: boolean;
  onEditPlan: () => void;
}

export function TodayPlanCard({
  mealCount,
  kcalTarget,
  protTarget,
  carbTarget,
  fatTarget,
  hasTimelineData,
  onEditPlan,
}: TodayPlanCardProps) {
  return (
    <div className="card">
      <div className="card-h">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: 'var(--fg)',
            flexShrink: 0,
          }}
        />
        <div className="title">Plano do dia</div>
        <div className="spacer" />
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11.5, padding: '4px 8px' }}
          onClick={onEditPlan}
        >
          <IconEdit size={11} /> Editar
        </button>
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
          <div className="eyebrow">META DIÁRIA</div>
          <div className="mono tnum" style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
            {mealCount} {mealCount === 1 ? 'refeição' : 'refeições'}
          </div>
        </div>
        <div style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, display: 'grid' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow">KCAL</div>
            <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, marginTop: 2 }}>
              {kcalTarget.toLocaleString('pt-BR')}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow">PROTEÍNA</div>
            <div
              className="mono tnum"
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: 'var(--sage-dim)',
                marginTop: 2,
              }}
            >
              {protTarget}g
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow">CARBOIDRATO</div>
            <div
              className="mono tnum"
              style={{ fontSize: 20, fontWeight: 500, color: 'var(--carb)', marginTop: 2 }}
            >
              {carbTarget}g
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow">GORDURA</div>
            <div
              className="mono tnum"
              style={{ fontSize: 20, fontWeight: 500, color: 'var(--sky)', marginTop: 2 }}
            >
              {fatTarget}g
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--fg-muted)',
            lineHeight: 1.5,
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
            OBSERVAÇÕES
          </span>
          {hasTimelineData
            ? 'Observações baseadas nos registros do paciente.'
            : 'Sem observações registradas até o momento.'}
        </div>
      </div>
    </div>
  );
}
