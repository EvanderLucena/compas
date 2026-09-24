import type { Tab } from './PatientHeader';

const TABS: { k: Tab; label: string }[] = [
  { k: 'today', label: 'Hoje' },
  { k: 'plan', label: 'Plano' },
  { k: 'biometry', label: 'Biometria' },
  { k: 'prescriptions', label: 'Prescrições' },
  { k: 'insights', label: 'Inteligência' },
  { k: 'history', label: 'Histórico' },
];

export function PatientTabNav({ tab, onSetTab }: { tab: Tab; onSetTab: (t: Tab) => void }) {
  return (
    <div
      className="patient-tab-row"
      style={{
        display: 'flex',
        gap: 2,
        marginTop: 20,
        borderBottom: '1px solid var(--border)',
        marginBottom: -21,
      }}
    >
      {TABS.map((t) => (
        <button
          data-testid={`patient-tab-${t.k}`}
          key={t.k}
          onClick={() => onSetTab(t.k)}
          style={{
            padding: '10px 14px',
            fontSize: 13,
            color: tab === t.k ? 'var(--fg)' : 'var(--fg-muted)',
            fontWeight: tab === t.k ? 600 : 400,
            borderBottom: tab === t.k ? '2px solid var(--fg)' : '2px solid transparent',
            marginBottom: -1,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
