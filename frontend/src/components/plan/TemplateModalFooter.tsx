import { IconCheck, IconAlert } from '../icons';
import type { PlanTemplateResponse } from '../../api/planTemplates';

interface TemplateModalFooterProps {
  confirmApply: boolean;
  activeTemplate: PlanTemplateResponse | null;
  isApplying: boolean;
  onCancelConfirm: () => void;
  onClose: () => void;
  onApply: () => void;
}

export function TemplateModalFooter({
  confirmApply,
  activeTemplate,
  isApplying,
  onCancelConfirm,
  onClose,
  onApply,
}: TemplateModalFooterProps) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        flexShrink: 0,
      }}
    >
      {confirmApply ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--coral)',
            fontSize: 12,
          }}
        >
          <IconAlert size={16} />
          <span>Substituirá todo o plano atual deste paciente! Confirma a aplicação?</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          {activeTemplate
            ? `Modelo selecionado: ${activeTemplate.name}`
            : 'Nenhum modelo selecionado'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {confirmApply ? (
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancelConfirm}
              disabled={isApplying}
            >
              Voltar
            </button>
            <button
              type="button"
              data-testid="btn-confirm-apply-template"
              className="btn btn-primary"
              onClick={onApply}
              disabled={isApplying}
              style={{ background: 'var(--coral)', borderColor: 'var(--coral)', color: '#fff' }}
            >
              <IconCheck size={14} />
              {isApplying ? 'Aplicando...' : 'Sim, Aplicar Modelo'}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Fechar
            </button>
            <button
              type="button"
              data-testid="btn-apply-template"
              className="btn btn-primary"
              onClick={onApply}
              disabled={!activeTemplate || isApplying}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IconCheck size={14} />
              Aplicar neste Paciente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
