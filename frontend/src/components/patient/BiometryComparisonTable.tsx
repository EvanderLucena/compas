import { useState } from 'react';
import type { BiometryComparisonData } from '../../types/biometry';
import { CompositionRows, SkinfoldsRows, PerimetryRows } from './BiometryComparisonRows';

interface BiometryComparisonTableProps {
  comparison: BiometryComparisonData;
}

type TableTab = 'all' | 'composition' | 'skinfolds' | 'perimetry';

function fmtDatePtBr(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

function TableTabsNav({
  activeTab,
  onSelectTab,
  hasSkinfolds,
  skinfoldsCount,
  hasPerimetry,
  perimetryCount,
}: {
  activeTab: TableTab;
  onSelectTab: (tab: TableTab) => void;
  hasSkinfolds: boolean;
  skinfoldsCount: number;
  hasPerimetry: boolean;
  perimetryCount: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--paper-2)',
      }}
    >
      <button
        type="button"
        className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-subtle'}`}
        style={{ fontSize: 12, padding: '4px 12px' }}
        onClick={() => onSelectTab('all')}
      >
        Todas as Métricas
      </button>
      <button
        type="button"
        className={`btn ${activeTab === 'composition' ? 'btn-primary' : 'btn-subtle'}`}
        style={{ fontSize: 12, padding: '4px 12px' }}
        onClick={() => onSelectTab('composition')}
      >
        Composição Corporal
      </button>
      {hasSkinfolds && (
        <button
          type="button"
          className={`btn ${activeTab === 'skinfolds' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: 12, padding: '4px 12px' }}
          onClick={() => onSelectTab('skinfolds')}
        >
          Dobras ({skinfoldsCount})
        </button>
      )}
      {hasPerimetry && (
        <button
          type="button"
          className={`btn ${activeTab === 'perimetry' ? 'btn-primary' : 'btn-subtle'}`}
          style={{ fontSize: 12, padding: '4px 12px' }}
          onClick={() => onSelectTab('perimetry')}
        >
          Circunferências ({perimetryCount})
        </button>
      )}
    </div>
  );
}

function TableBodyRows({
  activeTab,
  comparison,
}: {
  activeTab: TableTab;
  comparison: BiometryComparisonData;
}) {
  const showComposition = activeTab === 'all' || activeTab === 'composition';
  const showSkinfolds =
    (activeTab === 'all' || activeTab === 'skinfolds') && comparison.skinfoldDeltas.length > 0;
  const showPerimetry =
    (activeTab === 'all' || activeTab === 'perimetry') && comparison.perimetryDeltas.length > 0;

  return (
    <tbody>
      {showComposition && <CompositionRows comp={comparison} />}
      {showSkinfolds && (
        <SkinfoldsRows
          deltas={comparison.skinfoldDeltas}
          baseSum={comparison.baseSkinfoldsSumMm}
          targetSum={comparison.targetSkinfoldsSumMm}
          deltaSum={comparison.skinfoldsSumDeltaMm}
        />
      )}
      {showPerimetry && (
        <PerimetryRows
          deltas={comparison.perimetryDeltas}
          baseRcq={comparison.baseWaistHipRatio}
          targetRcq={comparison.targetWaistHipRatio}
          deltaRcq={comparison.waistHipRatioDelta}
        />
      )}
    </tbody>
  );
}

export function BiometryComparisonTable({ comparison }: BiometryComparisonTableProps) {
  const [activeTab, setActiveTab] = useState<TableTab>('all');

  return (
    <div style={{ backgroundColor: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
      <TableTabsNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasSkinfolds={comparison.skinfoldDeltas.length > 0}
        skinfoldsCount={comparison.skinfoldDeltas.length}
        hasPerimetry={comparison.perimetryDeltas.length > 0}
        perimetryCount={comparison.perimetryDeltas.length}
      />

      <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--fg-muted)' }}>
                Parâmetro
              </th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--fg-muted)' }}>
                Base ({comparison.baseDate ? fmtDatePtBr(comparison.baseDate) : 'Inicial'})
              </th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--fg-muted)' }}>
                Retorno ({comparison.targetDate ? fmtDatePtBr(comparison.targetDate) : 'Atual'})
              </th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--fg-muted)' }}>
                Variação (Δ)
              </th>
            </tr>
          </thead>
          <TableBodyRows activeTab={activeTab} comparison={comparison} />
        </table>
      </div>
    </div>
  );
}
