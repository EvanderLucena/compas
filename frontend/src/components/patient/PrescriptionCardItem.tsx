import type { PrescriptionItem } from '../../types/prescription';

export function PrescriptionCardItem({ item }: { item: PrescriptionItem }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 6,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--paper-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{item.name}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'var(--paper-3)',
            color: 'var(--fg-muted)',
          }}
        >
          {item.form}
        </span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
        Dose: <span style={{ color: 'var(--primary, #166534)' }}>{item.dosage}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>⏰ {item.timing}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>⏳ Duração: {item.duration}</div>

      {item.instructions && (
        <div
          style={{
            fontSize: 11,
            fontStyle: 'italic',
            color: 'var(--fg-muted)',
            marginTop: 4,
            paddingTop: 4,
            borderTop: '1px dashed var(--border)',
          }}
        >
          Obs: {item.instructions}
        </div>
      )}
    </div>
  );
}
