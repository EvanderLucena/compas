interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = currentPage * 6 + 1;
  const to = Math.min((currentPage + 1) * 6, from + 5);

  const getPageItems = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    if (currentPage <= 3) {
      return [0, 1, 2, 3, 4, 'ellipsis-end', totalPages - 1];
    }
    if (currentPage >= totalPages - 4) {
      return [
        0,
        'ellipsis-start',
        totalPages - 5,
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
      ];
    }
    return [
      0,
      'ellipsis-start',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis-end',
      totalPages - 1,
    ];
  };

  const items = getPageItems();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        padding: '12px 4px',
      }}
    >
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
        {from}–{to}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="btn btn-ghost"
          style={{ padding: '5px 10px', opacity: currentPage === 0 ? 0.3 : 1 }}
          title="Página anterior"
        >
          ←
        </button>
        {items.map((item) =>
          typeof item === 'string' ? (
            <span
              key={item}
              style={{
                minWidth: 32,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12.5,
                color: 'var(--fg-subtle)',
                fontFamily: 'var(--font-mono)',
                userSelect: 'none',
              }}
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              style={{
                padding: '5px 10px',
                borderRadius: 5,
                fontSize: 12.5,
                border: item === currentPage ? '1px solid var(--fg)' : '1px solid var(--border)',
                background: item === currentPage ? 'var(--ink)' : 'var(--surface)',
                color: item === currentPage ? 'var(--paper)' : 'var(--fg)',
                fontFamily: 'var(--font-mono)',
                minWidth: 32,
                cursor: 'pointer',
              }}
            >
              {item + 1}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="btn btn-ghost"
          style={{ padding: '5px 10px', opacity: currentPage === totalPages - 1 ? 0.3 : 1 }}
          title="Próxima página"
        >
          →
        </button>
      </div>
    </div>
  );
}
