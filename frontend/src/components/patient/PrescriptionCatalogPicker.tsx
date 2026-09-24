import type { PrescriptionCatalogItem, PrescriptionItemInput } from '../../types/prescription';

interface PrescriptionCatalogPickerProps {
  catalog: PrescriptionCatalogItem[];
  onSelect: (item: PrescriptionItemInput) => void;
  onClose: () => void;
}

export function PrescriptionCatalogPicker({
  catalog,
  onSelect,
  onClose,
}: PrescriptionCatalogPickerProps) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 8,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--paper)',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          Catálogo Clínico de Suplementos & Fórmulas
        </span>
        <button
          type="button"
          className="btn btn-subtle"
          onClick={onClose}
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          Fechar
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8,
        }}
      >
        {catalog.map((catItem) => (
          <button
            key={catItem.id}
            type="button"
            className="btn btn-subtle"
            onClick={() => {
              onSelect({
                name: catItem.name,
                category: catItem.category,
                dosage: catItem.defaultDosage,
                form: catItem.defaultForm,
                timing: catItem.defaultTiming,
                duration: catItem.defaultDuration,
                isContinuous: catItem.isContinuous,
                instructions: catItem.instructions,
              });
              onClose();
            }}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>
              {catItem.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
              {catItem.defaultDosage} · {catItem.defaultForm}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
