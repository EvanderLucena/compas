export function PlanSkeleton() {
  return (
    <div
      className="plans-grid"
      style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}
    >
      <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
        <div style={{ padding: '0 6px 10px' }}>
          <div
            style={{ width: 100, height: 10, background: 'var(--surface-2)', borderRadius: 3 }}
          />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 6, marginBottom: 4 }}>
            <div
              style={{
                width: '60%',
                height: 13,
                background: 'var(--surface-2)',
                borderRadius: 3,
                marginBottom: 6,
              }}
            />
            <div
              style={{ width: '40%', height: 11, background: 'var(--surface-2)', borderRadius: 3 }}
            />
          </div>
        ))}
      </div>
      <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
        <div
          style={{
            width: 200,
            height: 26,
            background: 'var(--surface-2)',
            borderRadius: 4,
            marginBottom: 18,
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{ width: 120, height: 32, background: 'var(--surface-2)', borderRadius: 6 }}
            />
          ))}
        </div>
        <div className="card">
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '2.2fr 1fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
              gap: 10,
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{ height: 10, background: 'var(--surface-2)', borderRadius: 2 }}
              />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '8px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '2.2fr 1fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
                gap: 10,
              }}
            >
              {Array.from({ length: 9 }).map((_, j) => (
                <div
                  key={j}
                  style={{ height: 14, background: 'var(--surface-2)', borderRadius: 3 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
