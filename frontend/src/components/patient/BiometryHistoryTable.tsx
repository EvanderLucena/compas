import type { BiometryAssessmentDTO } from '../../types/patient';

interface BiometryHistoryTableProps {
  list: BiometryAssessmentDTO[];
  fmtDate: (iso: string | null | undefined) => string;
}

export function BiometryHistoryTable({ list, fmtDate }: BiometryHistoryTableProps) {
  return (
    <div className="card">
      <div className="card-h">
        <div className="title">Histórico de avaliações</div>
        <div className="sub">APPEND-ONLY · AUDITORIA CLÍNICA</div>
      </div>
      <div
        className="biometry-table-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr',
          padding: '10px 18px',
          borderBottom: '1px solid var(--border)',
          gap: 12,
        }}
      >
        {['Data', 'Peso', '% Gordura', 'Magra', '% Água', 'TMB'].map((h, i) => (
          <div key={i} className="eyebrow" style={{ fontSize: 10 }}>
            {h}
          </div>
        ))}
      </div>
      {[...list].reverse().map((b, i, arr) => (
        <div
          key={b.id ?? i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr',
            padding: '12px 18px',
            borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border)',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: 'var(--fg)' }}>
            {fmtDate(b.assessmentDate)}
          </div>
          <div className="mono tnum" style={{ fontSize: 12.5, fontWeight: 500 }}>
            {b.weight} kg
          </div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--carb)' }}>
            {b.bodyFatPercent ?? '—'}
            {b.bodyFatPercent != null ? '%' : ''}
          </div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--sage-dim)' }}>
            {b.leanMassKg ?? '—'}
            {b.leanMassKg != null ? ' kg' : ''}
          </div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--sky)' }}>
            {b.waterPercent ?? '—'}
            {b.waterPercent != null ? '%' : ''}
          </div>
          <div className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {b.bmrKcal ?? '—'}
            {b.bmrKcal != null ? ' kcal' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
