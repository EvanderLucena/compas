import { IconTrash } from '../icons';
import type { PlanTemplateResponse } from '../../api/planTemplates';

interface TemplateListSectionProps {
  templates: PlanTemplateResponse[];
  activeTemplateId: string | null;
  isLoading: boolean;
  onSelect: (tmpl: PlanTemplateResponse) => void;
  onDelete: (tmpl: PlanTemplateResponse, e: React.MouseEvent) => void;
}

export function TemplateListSection({
  templates,
  activeTemplateId,
  isLoading,
  onSelect,
  onDelete,
}: TemplateListSectionProps) {
  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
        Carregando modelos...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>
        Nenhum modelo encontrado com estes filtros.
      </div>
    );
  }

  return (
    <div
      style={{
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--surface)',
      }}
    >
      {templates.map((t) => {
        const isSelected = activeTemplateId === t.id;
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            data-testid={`template-item-${t.id}`}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: isSelected ? '2px solid var(--lime)' : '1px solid var(--border)',
              background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg)' }}>{t.name}</div>
              {t.isSystem ? (
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(202,240,68,0.15)',
                    color: 'var(--lime-dim)',
                    border: '1px solid var(--lime-dim)',
                    flexShrink: 0,
                  }}
                >
                  SISTEMA
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => onDelete(t, e)}
                  title="Excluir modelo"
                  className="btn btn-ghost"
                  style={{ padding: 4, color: 'var(--fg-muted)' }}
                >
                  <IconTrash size={13} />
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 6,
                fontSize: 11,
                color: 'var(--fg-muted)',
              }}
            >
              <span className="mono" style={{ color: 'var(--fg)' }}>
                {t.kcalTarget} kcal
              </span>
              <span>·</span>
              <span>{t.meals?.length ?? 0} refeições</span>
              <span>·</span>
              <span style={{ textTransform: 'capitalize' }}>{t.category.toLowerCase()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
