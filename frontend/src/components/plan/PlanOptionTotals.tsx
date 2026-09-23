import { TotalCell } from './PlanMacroCells';

interface OptionTotalsData {
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
}

interface PlanOptionTotalsProps {
  optionName: string;
  totals: OptionTotalsData;
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
}

export function PlanOptionTotals({
  optionName,
  totals,
  kcalTarget,
  protTarget,
  carbTarget,
  fatTarget,
}: PlanOptionTotalsProps) {
  return (
    <div
      className="plans-totals-grid"
      style={{
        marginTop: 16,
        padding: '14px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <div>
        <div className="eyebrow">TOTAL DA OPÇÃO</div>
        <div className="serif" style={{ fontSize: 18, letterSpacing: '-0.01em', marginTop: 2 }}>
          {optionName}
        </div>
      </div>
      <TotalCell label="Kcal" actual={totals.kcal} target={kcalTarget} />
      <TotalCell
        label="Proteína"
        actual={totals.prot}
        target={protTarget}
        unit="g"
        color="var(--sage)"
      />
      <TotalCell
        label="Carboidrato"
        actual={totals.carb}
        target={carbTarget}
        unit="g"
        color="var(--amber)"
      />
      <TotalCell
        label="Gordura"
        actual={totals.fat}
        target={fatTarget}
        unit="g"
        color="var(--sky)"
      />
      <TotalCell label="Fibra" actual={totals.fiber} target={0} unit="g" color="var(--lime-dim)" />
    </div>
  );
}
