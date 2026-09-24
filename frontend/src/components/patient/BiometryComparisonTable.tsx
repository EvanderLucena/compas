import { useState } from 'react';
import type { BiometryComparisonData, SkinfoldDelta, PerimetryDelta } from '../../types/biometry';

interface BiometryComparisonTableProps {
  comparison: BiometryComparisonData;
}

type TableTab = 'all' | 'composition' | 'skinfolds' | 'perimetry';

function fmtNum(n: number | null | undefined, unit: string = '', decimals: number = 1): string {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(decimals)} ${unit}`.trim();
}

function fmtDeltaCell(
  delta: number | null | undefined,
  unit: string = '',
  invertGood: boolean = false,
  decimals: number = 1,
) {
  if (delta === null || delta === undefined)
    return <span style={{ color: 'var(--fg-muted)' }}>—</span>;
  const num = Number(delta);
  if (num === 0) return <span style={{ color: 'var(--fg-muted)' }}>0.0 {unit}</span>;
  const sign = num > 0 ? '+' : '';
  const isPositive = num > 0;
  const isGood = invertGood ? !isPositive : isPositive;
  const color = isGood ? 'var(--sage, #10b981)' : 'var(--coral, #ef4444)';

  return (
    <span style={{ color, fontWeight: 600 }}>
      {sign}
      {num.toFixed(decimals)} {unit}
    </span>
  );
}

function CompositionRows({ comp }: { comp: BiometryComparisonData }) {
  return (
    <>
      <tr style={{ backgroundColor: 'var(--paper-2)' }}>
        <td
          colSpan={4}
          style={{
            padding: '8px 12px',
            fontWeight: 700,
            fontSize: 11,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
          }}
        >
          Composição Corporal
        </td>
      </tr>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 12px', fontWeight: 500 }}>Peso Corporal</td>
        <td style={{ padding: '8px 12px' }}>{fmtNum(comp.baseWeight, 'kg')}</td>
        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{fmtNum(comp.targetWeight, 'kg')}</td>
        <td style={{ padding: '8px 12px' }}>{fmtDeltaCell(comp.weightDelta, 'kg', true)}</td>
      </tr>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 12px', fontWeight: 500 }}>Gordura Corporal (%)</td>
        <td style={{ padding: '8px 12px' }}>{fmtNum(comp.baseBodyFatPercent, '%')}</td>
        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
          {fmtNum(comp.targetBodyFatPercent, '%')}
        </td>
        <td style={{ padding: '8px 12px' }}>{fmtDeltaCell(comp.bodyFatDelta, '%', true)}</td>
      </tr>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 12px', fontWeight: 500 }}>Massa Gorda Estimada</td>
        <td style={{ padding: '8px 12px' }}>{fmtNum(comp.baseFatMassKg, 'kg')}</td>
        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
          {fmtNum(comp.targetFatMassKg, 'kg')}
        </td>
        <td style={{ padding: '8px 12px' }}>{fmtDeltaCell(comp.fatMassDelta, 'kg', true)}</td>
      </tr>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 12px', fontWeight: 500 }}>Massa Magra</td>
        <td style={{ padding: '8px 12px' }}>{fmtNum(comp.baseLeanMassKg, 'kg')}</td>
        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
          {fmtNum(comp.targetLeanMassKg, 'kg')}
        </td>
        <td style={{ padding: '8px 12px' }}>{fmtDeltaCell(comp.leanMassDelta, 'kg', false)}</td>
      </tr>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '8px 12px', fontWeight: 500 }}>Água Corporal</td>
        <td style={{ padding: '8px 12px' }}>{fmtNum(comp.baseWaterPercent, '%')}</td>
        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
          {fmtNum(comp.targetWaterPercent, '%')}
        </td>
        <td style={{ padding: '8px 12px' }}>{fmtDeltaCell(comp.waterDelta, '%', false)}</td>
      </tr>
      {comp.baseVisceralFat !== null && comp.targetVisceralFat !== null && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '8px 12px', fontWeight: 500 }}>Gordura Visceral (Nível)</td>
          <td style={{ padding: '8px 12px' }}>{comp.baseVisceralFat}</td>
          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{comp.targetVisceralFat}</td>
          <td style={{ padding: '8px 12px' }}>
            {fmtDeltaCell(comp.visceralFatDelta, '', true, 0)}
          </td>
        </tr>
      )}
      {comp.baseBmrKcal !== null && comp.targetBmrKcal !== null && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '8px 12px', fontWeight: 500 }}>Taxa Metabólica Basal (TMB)</td>
          <td style={{ padding: '8px 12px' }}>{comp.baseBmrKcal} kcal</td>
          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{comp.targetBmrKcal} kcal</td>
          <td style={{ padding: '8px 12px' }}>
            {fmtDeltaCell(comp.bmrDeltaKcal, 'kcal', false, 0)}
          </td>
        </tr>
      )}
    </>
  );
}

function SkinfoldsRows({
  deltas,
  baseSum,
  targetSum,
  deltaSum,
}: {
  deltas: SkinfoldDelta[];
  baseSum: number | null;
  targetSum: number | null;
  deltaSum: number | null;
}) {
  return (
    <>
      <tr style={{ backgroundColor: 'var(--paper-2)' }}>
        <td
          colSpan={4}
          style={{
            padding: '8px 12px',
            fontWeight: 700,
            fontSize: 11,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
          }}
        >
          Dobras Cutâneas (Protocolo Pollock)
        </td>
      </tr>
      {deltas.map((s) => (
        <tr key={s.measureKey} style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{s.label}</td>
          <td style={{ padding: '8px 12px' }}>{fmtNum(s.initialMm, 'mm')}</td>
          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{fmtNum(s.currentMm, 'mm')}</td>
          <td style={{ padding: '8px 12px' }}>{fmtDeltaCell(s.deltaMm, 'mm', true)}</td>
        </tr>
      ))}
      {baseSum !== null && (
        <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--paper-2)' }}>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>Σ Somatória de Dobras</td>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{fmtNum(baseSum, 'mm')}</td>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{fmtNum(targetSum, 'mm')}</td>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>
            {fmtDeltaCell(deltaSum, 'mm', true)}
          </td>
        </tr>
      )}
    </>
  );
}

function PerimetryRows({
  deltas,
  baseRcq,
  targetRcq,
  deltaRcq,
}: {
  deltas: PerimetryDelta[];
  baseRcq: number | null;
  targetRcq: number | null;
  deltaRcq: number | null;
}) {
  return (
    <>
      <tr style={{ backgroundColor: 'var(--paper-2)' }}>
        <td
          colSpan={4}
          style={{
            padding: '8px 12px',
            fontWeight: 700,
            fontSize: 11,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
          }}
        >
          Perimetria / Circunferências
        </td>
      </tr>
      {deltas.map((p) => {
        const isWaistOrAbdomen = ['cintura', 'abdomen', 'quadril'].includes(
          p.measureKey.toLowerCase(),
        );
        return (
          <tr key={p.measureKey} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.label}</td>
            <td style={{ padding: '8px 12px' }}>{fmtNum(p.initialCm, 'cm')}</td>
            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{fmtNum(p.currentCm, 'cm')}</td>
            <td style={{ padding: '8px 12px' }}>
              {fmtDeltaCell(p.deltaCm, 'cm', isWaistOrAbdomen)}
            </td>
          </tr>
        );
      })}
      {baseRcq !== null && targetRcq !== null && (
        <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--paper-2)' }}>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>Relação Cintura-Quadril (RCQ)</td>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{fmtNum(baseRcq, '', 2)}</td>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{fmtNum(targetRcq, '', 2)}</td>
          <td style={{ padding: '8px 12px', fontWeight: 700 }}>
            {fmtDeltaCell(deltaRcq, '', true, 2)}
          </td>
        </tr>
      )}
    </>
  );
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
        Todas as Medidas
      </button>
      <button
        type="button"
        className={`btn ${activeTab === 'composition' ? 'btn-primary' : 'btn-subtle'}`}
        style={{ fontSize: 12, padding: '4px 12px' }}
        onClick={() => onSelectTab('composition')}
      >
        Composição
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
                Base ({comparison.baseDate ?? 'Inicial'})
              </th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--fg-muted)' }}>
                Retorno ({comparison.targetDate ?? 'Atual'})
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
