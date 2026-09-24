import type {
  PrescriptionCatalogItem,
  PrescriptionItemInput,
  PrescriptionStatus,
} from '../../types/prescription';
import { PrescriptionEditorItemForm } from './PrescriptionEditorItemForm';
import { PrescriptionCatalogPicker } from './PrescriptionCatalogPicker';

interface FormBodyProps {
  title: string;
  setTitle: (v: string) => void;
  status: PrescriptionStatus;
  setStatus: (v: PrescriptionStatus) => void;
  showCatalog: boolean;
  setShowCatalog: (v: boolean) => void;
  catalog: PrescriptionCatalogItem[];
  items: PrescriptionItemInput[];
  onAddItem: (preset?: PrescriptionItemInput) => void;
  onItemChange: (idx: number, it: PrescriptionItemInput) => void;
  onRemoveItem: (idx: number) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export function PrescriptionEditorFormBody({
  title,
  setTitle,
  status,
  setStatus,
  showCatalog,
  setShowCatalog,
  catalog,
  items,
  onAddItem,
  onItemChange,
  onRemoveItem,
  notes,
  setNotes,
}: FormBodyProps) {
  return (
    <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Título da Prescrição
          </label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Status
          </label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as PrescriptionStatus)}
            style={{ width: '100%' }}
          >
            <option value="ACTIVE">Ativa (Em uso)</option>
            <option value="COMPLETED">Concluída</option>
            <option value="ARCHIVED">Arquivada</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          Itens Prescritos ({items.length})
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-subtle"
            onClick={() => setShowCatalog(!showCatalog)}
            style={{ fontSize: 12 }}
          >
            {showCatalog ? 'Ocultar Catálogo' : '+ Selecionar do Catálogo'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onAddItem()}
            style={{ fontSize: 12 }}
          >
            + Item Manual
          </button>
        </div>
      </div>

      {showCatalog && (
        <PrescriptionCatalogPicker
          catalog={catalog}
          onSelect={(preset) => onAddItem(preset)}
          onClose={() => setShowCatalog(false)}
        />
      )}

      {items.map((item, idx) => (
        <PrescriptionEditorItemForm
          key={idx}
          index={idx}
          item={item}
          onChange={onItemChange}
          onRemove={onRemoveItem}
        />
      ))}

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
          Orientações Gerais ao Paciente ou Farmácia (Opcional)
        </label>
        <textarea
          className="input"
          rows={3}
          placeholder="Ex: Sugestão de farmácia de manipulação, cuidados de armazenamento, hidratação mínima recomendada."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
