interface TemplateFiltersBarProps {
  typeFilter: 'all' | 'system' | 'custom';
  categoryFilter: string;
  onTypeFilterChange: (type: 'all' | 'system' | 'custom') => void;
  onCategoryFilterChange: (category: string) => void;
}

export function TemplateFiltersBar({
  typeFilter,
  categoryFilter,
  onTypeFilterChange,
  onCategoryFilterChange,
}: TemplateFiltersBarProps) {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'var(--surface-2)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {(
          [
            { id: 'all', label: 'Todos' },
            { id: 'system', label: 'Compas (Padrão)' },
            { id: 'custom', label: 'Meus Modelos' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn ${typeFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => onTypeFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Categoria:</span>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--fg)',
          }}
        >
          <option value="ALL">Todas as categorias</option>
          <option value="EQUILIBRIO">Equilíbrio</option>
          <option value="EMAGRECIMENTO">Emagrecimento</option>
          <option value="HIPERTROFIA">Hipertrofia</option>
          <option value="LOW CARB">Low Carb</option>
          <option value="VEGETARIANO">Vegetariano</option>
          <option value="GERAL">Geral</option>
        </select>
      </div>
    </div>
  );
}
