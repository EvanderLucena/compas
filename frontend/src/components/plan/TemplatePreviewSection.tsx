import type { PlanTemplateMeal, PlanTemplateResponse } from '../../api/planTemplates';

interface TemplatePreviewSectionProps {
  template: PlanTemplateResponse | null;
}

function MacroTargetsRow({ template }: { template: PlanTemplateResponse }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--surface)',
          borderRadius: 6,
          border: '1px solid var(--border)',
        }}
      >
        <div className="eyebrow">Energia</div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
          {template.kcalTarget} <span style={{ fontSize: 11 }}>kcal</span>
        </div>
      </div>
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--surface)',
          borderRadius: 6,
          border: '1px solid var(--border)',
        }}
      >
        <div className="eyebrow">Proteína</div>
        <div
          className="mono"
          style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--coral)' }}
        >
          {template.protTarget} <span style={{ fontSize: 11 }}>g</span>
        </div>
      </div>
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--surface)',
          borderRadius: 6,
          border: '1px solid var(--border)',
        }}
      >
        <div className="eyebrow">Carboidrato</div>
        <div
          className="mono"
          style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--amber)' }}
        >
          {template.carbTarget} <span style={{ fontSize: 11 }}>g</span>
        </div>
      </div>
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--surface)',
          borderRadius: 6,
          border: '1px solid var(--border)',
        }}
      >
        <div className="eyebrow">Gordura</div>
        <div
          className="mono"
          style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--sky)' }}
        >
          {template.fatTarget} <span style={{ fontSize: 11 }}>g</span>
        </div>
      </div>
    </div>
  );
}

function MealsPreviewList({ meals }: { meals: PlanTemplateMeal[] }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Refeições Incluídas ({meals.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {meals.map((m, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 14px',
              background: 'var(--surface)',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg)' }}>{m.label}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {m.time}
              </span>
            </div>
            {m.options?.[0]?.items && m.options[0].items.length > 0 && (
              <div
                style={{ marginTop: 6, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.4 }}
              >
                {m.options[0].items
                  .map((it) => `${it.foodName} (${it.referenceAmount} ${it.unit})`)
                  .join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TemplatePreviewSection({ template }: TemplatePreviewSectionProps) {
  if (!template) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
        Selecione um modelo à esquerda para ver a pré-visualização.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        background: 'var(--surface-2)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>
            {template.name}
          </h3>
          {template.isSystem && (
            <span
              className="mono"
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(202,240,68,0.15)',
                color: 'var(--lime-dim)',
                border: '1px solid var(--lime-dim)',
              }}
            >
              Padrão do Sistema
            </span>
          )}
        </div>
        {template.description && (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            {template.description}
          </p>
        )}
      </div>

      <MacroTargetsRow template={template} />

      <MealsPreviewList meals={template.meals ?? []} />

      {template.extras && template.extras.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Itens Extras ({template.extras.length})
          </div>
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--surface)',
              borderRadius: 6,
              border: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--fg-muted)',
            }}
          >
            {template.extras.map((ex) => `${ex.name} (${ex.quantity})`).join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
}
