import type { BiometryAssessmentDTO } from '../../types/patient';

const BIOMETRY_SKINFOLD_LABELS: Record<string, string> = {
  peitoral: 'Peitoral',
  axilar_medio: 'Axilar médio',
  triceps: 'Tríceps',
  subescapular: 'Subescapular',
  abdominal: 'Abdominal',
  suprailiaco: 'Suprailíaco',
  coxa: 'Coxa',
};

const BIOMETRY_PERIMETRY_LABELS: Record<string, string> = {
  cintura: 'Cintura',
  abdomen: 'Abdômen',
  quadril: 'Quadril',
  braco_d: 'Braço D',
  braco_e: 'Braço E',
  coxa_d: 'Coxa D',
  coxa_e: 'Coxa E',
  panturrilha_d: 'Panturrilha D',
};

function formatBiometryMeasureLabel(measureKey: string) {
  return (
    BIOMETRY_SKINFOLD_LABELS[measureKey] ?? BIOMETRY_PERIMETRY_LABELS[measureKey] ?? measureKey
  );
}

interface BiometryMeasuresGridProps {
  last: BiometryAssessmentDTO;
  prev?: BiometryAssessmentDTO;
  fmtDate: (iso: string | null | undefined) => string;
}

function SkinfoldsCard({
  skinfolds,
  prevSkinfolds,
  date,
  fmtDate,
}: {
  skinfolds: NonNullable<BiometryAssessmentDTO['skinfolds']>;
  prevSkinfolds?: BiometryAssessmentDTO['skinfolds'];
  date: string;
  fmtDate: (iso: string | null | undefined) => string;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div className="title">Dobras cutâneas</div>
        <div className="sub">PROTOCOLO POLLOCK 7 · ADIPÔMETRO</div>
        <div className="spacer" />
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
          {fmtDate(date)}
        </div>
      </div>
      <div className="card-b">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {skinfolds.map((f, i) => {
            const prevVal = prevSkinfolds?.find((ps) => ps.measureKey === f.measureKey)?.valueMm;
            const d = prevVal != null ? Math.round((f.valueMm - prevVal) * 10) / 10 : 0;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 6,
                }}
              >
                <div style={{ flex: 1, fontSize: 12.5 }}>
                  {formatBiometryMeasureLabel(f.measureKey)}
                </div>
                <div className="mono tnum" style={{ fontSize: 15, fontWeight: 600 }}>
                  {f.valueMm}
                  <span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginLeft: 3 }}>mm</span>
                </div>
                <div
                  className="mono tnum"
                  style={{
                    fontSize: 11,
                    minWidth: 36,
                    textAlign: 'right',
                    color: d < 0 ? 'var(--sage-dim)' : d > 0 ? 'var(--coral)' : 'var(--fg-subtle)',
                  }}
                >
                  {d > 0 ? '+' : ''}
                  {d !== 0 ? d.toFixed(0) : '—'}
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
          }}
        >
          <div>
            <div className="eyebrow">SOMATÓRIO DOBRAS</div>
            <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>
              {skinfolds.reduce((s, f) => s + f.valueMm, 0).toFixed(0)}{' '}
              <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerimetryCard({
  perimetry,
  prevPerimetry,
  date,
  fmtDate,
}: {
  perimetry: NonNullable<BiometryAssessmentDTO['perimetry']>;
  prevPerimetry?: BiometryAssessmentDTO['perimetry'];
  date: string;
  fmtDate: (iso: string | null | undefined) => string;
}) {
  return (
    <div className="card">
      <div className="card-h">
        <div className="title">Perimetria</div>
        <div className="sub">CIRCUNFERÊNCIAS · CM</div>
        <div className="spacer" />
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
          {fmtDate(date)}
        </div>
      </div>
      <div className="card-b tight">
        {perimetry.map((m, i) => {
          const prevVal = prevPerimetry?.find((pp) => pp.measureKey === m.measureKey)?.valueCm;
          const d = prevVal != null ? Math.round((m.valueCm - prevVal) * 10) / 10 : 0;
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 16,
                padding: '12px 18px',
                borderBottom: i === perimetry.length - 1 ? 'none' : '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 13 }}>{formatBiometryMeasureLabel(m.measureKey)}</div>
              <div className="mono tnum" style={{ fontSize: 14, fontWeight: 500 }}>
                {m.valueCm} <span style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>cm</span>
              </div>
              <div
                className="mono tnum"
                style={{
                  fontSize: 11,
                  width: 48,
                  textAlign: 'right',
                  color: d < 0 ? 'var(--sage-dim)' : d > 0 ? 'var(--fg-muted)' : 'var(--fg-subtle)',
                }}
              >
                {d > 0 ? '+' : ''}
                {d.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BiometryMeasuresGrid({ last, prev, fmtDate }: BiometryMeasuresGridProps) {
  const lastSkinfolds = last.skinfolds ?? [];
  const lastPerimetry = last.perimetry ?? [];

  if (lastSkinfolds.length === 0 || lastPerimetry.length === 0) return null;

  return (
    <div
      className="biometry-charts-grid"
      style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 16 }}
    >
      <SkinfoldsCard
        skinfolds={lastSkinfolds}
        prevSkinfolds={prev?.skinfolds}
        date={last.assessmentDate}
        fmtDate={fmtDate}
      />
      <PerimetryCard
        perimetry={lastPerimetry}
        prevPerimetry={prev?.perimetry}
        date={last.assessmentDate}
        fmtDate={fmtDate}
      />
    </div>
  );
}
