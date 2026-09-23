import { PlanTitleBlock } from './PlanTitleBlock';
import { PlanPdfActions } from './PlanPdfActions';
import { PlanTargetsBar } from './PlanTargetsBar';
import type { SaveStatus } from '../../stores/planStore';

interface PlanHeaderProps {
  title: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  saveStatus: SaveStatus;
  section: 'meals' | 'extras';
  onSectionChange: (sec: 'meals' | 'extras') => void;
  onUpdateTitle: (title: string) => void;
  onSaveTargets: (targets: {
    kcalTarget: number;
    protTarget: number;
    carbTarget: number;
    fatTarget: number;
  }) => void;
  onDownloadPlanPdf: () => void;
  onDownloadGroceryPdf: () => void;
  downloadingPlan: boolean;
  downloadingGrocery: boolean;
  isReadOnly: boolean;
  onReadOnlyClick: () => void;
}

const SECTION_TABS = [
  { k: 'meals' as const, label: 'Refeições do plano' },
  { k: 'extras' as const, label: 'Opções extras · sem horário' },
];

export function PlanHeader({
  title,
  createdAt,
  updatedAt,
  notes,
  kcalTarget,
  protTarget,
  carbTarget,
  fatTarget,
  saveStatus,
  section,
  onSectionChange,
  onUpdateTitle,
  onSaveTargets,
  onDownloadPlanPdf,
  onDownloadGroceryPdf,
  downloadingPlan,
  downloadingGrocery,
  isReadOnly,
  onReadOnlyClick,
}: PlanHeaderProps) {
  return (
    <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <PlanTitleBlock
          title={title}
          createdAt={createdAt}
          updatedAt={updatedAt}
          isReadOnly={isReadOnly}
          onUpdateTitle={onUpdateTitle}
          onReadOnlyClick={onReadOnlyClick}
        />
        <PlanPdfActions
          onDownloadPlanPdf={onDownloadPlanPdf}
          onDownloadGroceryPdf={onDownloadGroceryPdf}
          downloadingPlan={downloadingPlan}
          downloadingGrocery={downloadingGrocery}
          saveStatus={saveStatus}
        />
      </div>

      <PlanTargetsBar
        kcalTarget={kcalTarget}
        protTarget={protTarget}
        carbTarget={carbTarget}
        fatTarget={fatTarget}
        onSaveTargets={onSaveTargets}
        isReadOnly={isReadOnly}
        onReadOnlyClick={onReadOnlyClick}
      />

      <div
        style={{
          marginTop: 16,
          padding: '10px 12px',
          background: 'var(--surface-2)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--fg-muted)',
          lineHeight: 1.5,
          display: 'flex',
          gap: 10,
        }}
      >
        <span
          className="mono"
          style={{
            color: 'var(--lime-dim)',
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          OBSERVAÇÕES
        </span>
        <span>{notes || 'Sem observações'}</span>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--border)',
          marginBottom: -17,
        }}
      >
        {SECTION_TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => onSectionChange(t.k)}
            style={{
              padding: '10px 14px',
              fontSize: 13,
              color: section === t.k ? 'var(--fg)' : 'var(--fg-muted)',
              fontWeight: section === t.k ? 600 : 400,
              borderBottom: section === t.k ? '2px solid var(--fg)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
