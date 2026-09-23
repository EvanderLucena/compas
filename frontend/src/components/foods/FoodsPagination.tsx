export interface FoodsPaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}

function calculatePageItems(pages: number, page: number): (number | string)[] {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, i) => i);
  }
  if (page <= 3) {
    return [0, 1, 2, 3, 4, 'ellipsis-end', pages - 1];
  }
  if (page >= pages - 4) {
    return [0, 'ellipsis-start', pages - 5, pages - 4, pages - 3, pages - 2, pages - 1];
  }
  return [0, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', pages - 1];
}

export function FoodsPagination({ page, pages, total, pageSize, onChange }: FoodsPaginationProps) {
  if (pages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const items = calculatePageItems(pages, page);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        marginTop: 8,
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        className="mono"
        style={{ fontSize: 11.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}
      >
        {from}–{to} <span style={{ color: 'var(--fg-muted)' }}>de</span> {total}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          style={{ padding: '4px 8px', opacity: page === 0 ? 0.35 : 1 }}
          title="Página anterior"
        >
          ←
        </button>
        {items.map((item) =>
          typeof item === 'string' ? (
            <span
              key={item}
              style={{
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'var(--fg-subtle)',
                fontFamily: 'var(--font-mono)',
                userSelect: 'none',
              }}
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={item}
              onClick={() => onChange(item)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                fontSize: 12,
                background: item === page ? 'var(--surface-2)' : 'transparent',
                border: item === page ? '1px solid var(--border)' : '1px solid transparent',
                color: item === page ? 'var(--fg)' : 'var(--fg-muted)',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              {item + 1}
            </button>
          ),
        )}
        <button
          type="button"
          className="btn btn-ghost"
          disabled={page === pages - 1}
          onClick={() => onChange(page + 1)}
          style={{ padding: '4px 8px', opacity: page === pages - 1 ? 0.35 : 1 }}
          title="Próxima página"
        >
          →
        </button>
      </div>
    </div>
  );
}
