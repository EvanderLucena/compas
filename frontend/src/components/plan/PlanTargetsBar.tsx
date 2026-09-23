import { useState } from 'react';
import { IconEdit } from '../icons';
import { DailyMacro } from './PlanMacroCells';
import { parseNumberInput } from '../../utils/numberInput';
import { useToastStore } from '../../stores/toastStore';

interface PlanTargetsBarProps {
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  onSaveTargets: (targets: {
    kcalTarget: number;
    protTarget: number;
    carbTarget: number;
    fatTarget: number;
  }) => void;
  isReadOnly: boolean;
  onReadOnlyClick: () => void;
}

const targetInputStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 500,
  letterSpacing: '-0.02em',
  marginTop: 2,
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--fg)',
  outline: 'none',
  width: 90,
  fontFamily: 'var(--font-mono)',
};

interface TargetsDisplayProps {
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  onStartEdit: () => void;
}

function TargetsDisplay({
  kcalTarget,
  protTarget,
  carbTarget,
  fatTarget,
  onStartEdit,
}: TargetsDisplayProps) {
  return (
    <div
      className="plans-macros-row"
      style={{
        display: 'flex',
        gap: 20,
        marginTop: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      <DailyMacro label="Kcal · meta" value={`${kcalTarget}`} color="var(--ink-contrast)" />
      <DailyMacro label="Proteína" value={`${protTarget}g`} color="var(--sage)" />
      <DailyMacro label="Carboidrato" value={`${carbTarget}g`} color="var(--amber)" />
      <DailyMacro label="Gordura" value={`${fatTarget}g`} color="var(--sky)" />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          onClick={onStartEdit}
          style={{ fontSize: 12, padding: '4px 8px' }}
        >
          <IconEdit size={12} /> Editar metas
        </button>
      </div>
    </div>
  );
}

interface TargetsFormProps {
  values: { kcal: string; prot: string; carb: string; fat: string };
  onChange: React.Dispatch<
    React.SetStateAction<{ kcal: string; prot: string; carb: string; fat: string }>
  >;
  onSave: () => void;
  onCancel: () => void;
}

function TargetsForm({ values, onChange, onSave, onCancel }: TargetsFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="plans-macros-row"
      style={{
        display: 'flex',
        gap: 20,
        marginTop: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
        <div className="eyebrow">Kcal · meta</div>
        <input
          inputMode="decimal"
          autoFocus
          value={values.kcal}
          onChange={(e) => onChange((v) => ({ ...v, kcal: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ ...targetInputStyle, color: 'var(--ink-contrast)' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
        <div className="eyebrow">Proteína</div>
        <input
          inputMode="decimal"
          value={values.prot}
          onChange={(e) => onChange((v) => ({ ...v, prot: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ ...targetInputStyle, color: 'var(--sage)' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
        <div className="eyebrow">Carboidrato</div>
        <input
          inputMode="decimal"
          value={values.carb}
          onChange={(e) => onChange((v) => ({ ...v, carb: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ ...targetInputStyle, color: 'var(--amber)' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
        <div className="eyebrow">Gordura</div>
        <input
          inputMode="decimal"
          value={values.fat}
          onChange={(e) => onChange((v) => ({ ...v, fat: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ ...targetInputStyle, color: 'var(--sky)' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={onSave}>
          Salvar
        </button>
      </div>
    </div>
  );
}

export function PlanTargetsBar({
  kcalTarget,
  protTarget,
  carbTarget,
  fatTarget,
  onSaveTargets,
  isReadOnly,
  onReadOnlyClick,
}: PlanTargetsBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState({ kcal: '', prot: '', carb: '', fat: '' });

  const handleStartEdit = () => {
    if (isReadOnly) {
      onReadOnlyClick();
      return;
    }
    setValues({
      kcal: String(kcalTarget),
      prot: String(protTarget),
      carb: String(carbTarget),
      fat: String(fatTarget),
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const parsed = {
      kcalTarget: parseNumberInput(values.kcal),
      protTarget: parseNumberInput(values.prot),
      carbTarget: parseNumberInput(values.carb),
      fatTarget: parseNumberInput(values.fat),
    };
    const hasInvalid = Object.values(parsed).some((val) => !Number.isFinite(val));
    if (hasInvalid) {
      useToastStore.getState().showError('Preencha metas numéricas válidas antes de salvar');
      return;
    }
    onSaveTargets(parsed);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <TargetsDisplay
        kcalTarget={kcalTarget}
        protTarget={protTarget}
        carbTarget={carbTarget}
        fatTarget={fatTarget}
        onStartEdit={handleStartEdit}
      />
    );
  }

  return (
    <TargetsForm
      values={values}
      onChange={setValues}
      onSave={handleSave}
      onCancel={() => setIsEditing(false)}
    />
  );
}
