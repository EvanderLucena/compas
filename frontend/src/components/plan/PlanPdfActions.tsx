import { IconDownload, IconBookmark } from '../icons';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import type { SaveStatus } from '../../stores/planStore';

interface PlanPdfActionsProps {
  onDownloadPlanPdf: () => void;
  onDownloadGroceryPdf: () => void;
  downloadingPlan: boolean;
  downloadingGrocery: boolean;
  saveStatus: SaveStatus;
  onOpenApplyTemplate?: () => void;
  onOpenSaveTemplate?: () => void;
}

export function PlanPdfActions({
  onDownloadPlanPdf,
  onDownloadGroceryPdf,
  downloadingPlan,
  downloadingGrocery,
  saveStatus,
  onOpenApplyTemplate,
  onOpenSaveTemplate,
}: PlanPdfActionsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexShrink: 0,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        className="btn btn-secondary"
        data-testid="btn-download-plan-pdf"
        onClick={onDownloadPlanPdf}
        disabled={downloadingPlan}
        style={{
          fontSize: 12,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        title="Baixar Plano Alimentar Oficial em PDF"
      >
        <IconDownload size={13} /> {downloadingPlan ? 'Baixando...' : 'Plano em PDF'}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        data-testid="btn-download-grocery-pdf"
        onClick={onDownloadGroceryPdf}
        disabled={downloadingGrocery}
        style={{
          fontSize: 12,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        title="Baixar Lista de Compras da Semana em PDF"
      >
        <IconDownload size={13} /> {downloadingGrocery ? 'Baixando...' : 'Lista de Compras'}
      </button>
      {onOpenApplyTemplate && (
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="btn-open-templates"
          onClick={onOpenApplyTemplate}
          style={{
            fontSize: 12,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="Ver e aplicar modelos de plano alimentar"
        >
          <IconBookmark size={13} /> Modelos
        </button>
      )}
      {onOpenSaveTemplate && (
        <button
          type="button"
          className="btn btn-secondary"
          data-testid="btn-save-as-template"
          onClick={onOpenSaveTemplate}
          style={{
            fontSize: 12,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="Salvar o plano atual deste paciente como modelo reutilizável"
        >
          <IconBookmark size={13} /> Salvar Modelo
        </button>
      )}
      <SaveStatusIndicator status={saveStatus} />
    </div>
  );
}
