interface FoodErrorBannerProps {
  error: string | null;
}

export function FoodErrorBanner({ error }: FoodErrorBannerProps) {
  if (!error) return null;
  return (
    <div
      role="alert"
      style={{
        padding: '10px 12px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid var(--coral)',
        borderRadius: 6,
        color: 'var(--coral)',
        fontSize: 13,
      }}
    >
      {error}
    </div>
  );
}
