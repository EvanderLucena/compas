export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            width: '60%',
            height: 14,
            background: 'var(--surface-2)',
            borderRadius: 4,
            marginBottom: 8,
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div
          style={{
            width: '40%',
            height: 12,
            background: 'var(--surface-2)',
            borderRadius: 4,
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 28,
                background: 'var(--surface-2)',
                borderRadius: 4,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
