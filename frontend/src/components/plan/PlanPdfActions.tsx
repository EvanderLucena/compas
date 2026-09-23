import { IconDownload } from '../icons';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import type { SaveStatus } from '../../stores/planStore';

interface PlanPdfActionsProps {
  onDownloadPlanPdf: () => void;
  onDownloadGroceryPdf: () => void;
  downloadingPlan: boolean;
  downloadingGrocery: boolean;
  saveStatus: SaveStatus;
}

export function PlanPdfActions({
  onDownloadPlanPdf,
  onDownloadGroceryPdf,
  downloadingPlan,
  downloadingGrocery,
  saveStatus,
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
      <SaveStatusIndicator status={saveStatus} />
    </div>
  );
}
