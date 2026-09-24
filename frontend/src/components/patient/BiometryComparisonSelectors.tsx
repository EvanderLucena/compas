import type { BiometryAssessmentDTO } from '../../types/patient';

interface BiometryComparisonSelectorsProps {
  assessments: BiometryAssessmentDTO[];
  baseId: string;
  targetId: string;
  onSelectBase: (id: string) => void;
  onSelectTarget: (id: string) => void;
  onSwap: () => void;
  onSetPreset: (preset: 'initialVsLatest' | 'prevVsLatest') => void;
  fmtDate: (iso: string | null | undefined) => string;
}

interface DropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  assessments: BiometryAssessmentDTO[];
  tagLast?: boolean;
  tagFirst?: boolean;
  fmtDate: (iso: string | null | undefined) => string;
}

function AssessmentDropdown({
  id,
  label,
  value,
  onChange,
  assessments,
  tagFirst,
  tagLast,
  fmtDate,
}: DropdownProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--fg-muted)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-select"
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {assessments.map((a, idx) => (
          <option key={a.id} value={a.id}>
            {fmtDate(a.assessmentDate)} · {a.weight ? `${a.weight} kg` : 'Sem peso'}
            {tagFirst && idx === 0 ? ' (Marco zero)' : ''}
            {tagLast && idx === assessments.length - 1 ? ' (Mais recente)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BiometryComparisonSelectors({
  assessments,
  baseId,
  targetId,
  onSelectBase,
  onSelectTarget,
  onSwap,
  onSetPreset,
  fmtDate,
}: BiometryComparisonSelectorsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--paper-2)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <AssessmentDropdown
          id="base-assessment-select"
          label="Avaliação Base (Marco Inicial)"
          value={baseId}
          onChange={onSelectBase}
          assessments={assessments}
          tagFirst
          fmtDate={fmtDate}
        />

        <button
          type="button"
          onClick={onSwap}
          title="Inverter avaliações"
          aria-label="Inverter ordem das avaliações"
          style={{
            marginTop: 18,
            padding: '7px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            backgroundColor: 'var(--paper)',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--fg-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ⇄
        </button>

        <AssessmentDropdown
          id="target-assessment-select"
          label="Avaliação Comparada (Retorno)"
          value={targetId}
          onChange={onSelectTarget}
          assessments={assessments}
          tagLast
          fmtDate={fmtDate}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-subtle"
          style={{ fontSize: 12, padding: '4px 10px' }}
          onClick={() => onSetPreset('initialVsLatest')}
        >
          1ª vs Atual (Geral)
        </button>
        {assessments.length >= 3 && (
          <button
            type="button"
            className="btn btn-subtle"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onSetPreset('prevVsLatest')}
          >
            Último Retorno
          </button>
        )}
      </div>
    </div>
  );
}
