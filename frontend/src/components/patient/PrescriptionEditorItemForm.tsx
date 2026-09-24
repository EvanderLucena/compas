import type { PrescriptionCategory, PrescriptionItemInput } from '../../types/prescription';

interface PrescriptionEditorItemFormProps {
  index: number;
  item: PrescriptionItemInput;
  onChange: (index: number, updated: PrescriptionItemInput) => void;
  onRemove: (index: number) => void;
}

const CATEGORIES: { value: PrescriptionCategory; label: string }[] = [
  { value: 'SUPPLEMENT', label: 'Suplemento' },
  { value: 'VITAMIN_MINERAL', label: 'Vitamina / Mineral' },
  { value: 'PHYTOTHERAPY', label: 'Fitoterápico' },
  { value: 'MANIPULATED', label: 'Manipulado' },
  { value: 'HABIT', label: 'Hábito / Hidratação' },
  { value: 'OTHER', label: 'Outro' },
];

const FORMS = ['Pó', 'Cápsula', 'Gotas', 'Comprimido', 'Sachê', 'Líquido', 'Outro'];

function ItemDoseFormRow({
  item,
  updateField,
}: {
  item: PrescriptionItemInput;
  updateField: (field: keyof PrescriptionItemInput, value: unknown) => void;
}) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: 10, marginBottom: 8 }}
    >
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg-muted)',
            marginBottom: 4,
          }}
        >
          Posologia / Dose *
        </label>
        <input
          type="text"
          className="input"
          placeholder="Ex: 5g, 2 cápsulas"
          value={item.dosage}
          onChange={(e) => updateField('dosage', e.target.value)}
          style={{ width: '100%', fontSize: 13 }}
          required
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg-muted)',
            marginBottom: 4,
          }}
        >
          Forma Farmacêutica
        </label>
        <select
          className="input"
          value={item.form}
          onChange={(e) => updateField('form', e.target.value)}
          style={{ width: '100%', fontSize: 13 }}
        >
          {FORMS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg-muted)',
            marginBottom: 4,
          }}
        >
          Duração
        </label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Uso contínuo, 60 dias"
          value={item.duration ?? 'Uso contínuo'}
          onChange={(e) => updateField('duration', e.target.value)}
          style={{ width: '100%', fontSize: 13 }}
        />
      </div>
    </div>
  );
}

function ItemHeaderRow({ index, onRemove }: { index: number; onRemove: (index: number) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>Item #{index + 1}</span>
      <button
        type="button"
        className="btn btn-subtle"
        onClick={() => onRemove(index)}
        style={{ fontSize: 12, padding: '2px 8px', color: 'var(--coral)' }}
      >
        Remover
      </button>
    </div>
  );
}

function ItemInstructionsRow({
  instructions,
  onChange,
}: {
  instructions: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--fg-muted)',
          marginBottom: 4,
        }}
      >
        Observações Clínicas / Manipulação (Opcional)
      </label>
      <input
        type="text"
        className="input"
        placeholder="Ex: Preferir matéria-prima com selo Creapure; dissolver em 200ml."
        value={instructions}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', fontSize: 13 }}
      />
    </div>
  );
}

export function PrescriptionEditorItemForm({
  index,
  item,
  onChange,
  onRemove,
}: PrescriptionEditorItemFormProps) {
  const updateField = (field: keyof PrescriptionItemInput, value: unknown) => {
    onChange(index, { ...item, [field]: value });
  };

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 8,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--paper-2)',
        marginBottom: 12,
      }}
    >
      <ItemHeaderRow index={index} onRemove={onRemove} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 8 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--fg-muted)',
              marginBottom: 4,
            }}
          >
            Nome do Item / Suplemento *
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Creatina Monohidratada"
            value={item.name}
            onChange={(e) => updateField('name', e.target.value)}
            style={{ width: '100%', fontSize: 13 }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--fg-muted)',
              marginBottom: 4,
            }}
          >
            Categoria
          </label>
          <select
            className="input"
            value={item.category}
            onChange={(e) => updateField('category', e.target.value as PrescriptionCategory)}
            style={{ width: '100%', fontSize: 13 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ItemDoseFormRow item={item} updateField={updateField} />

      <div style={{ marginBottom: 8 }}>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg-muted)',
            marginBottom: 4,
          }}
        >
          Horário / Instrução de Tomada *
        </label>
        <input
          type="text"
          className="input"
          placeholder="Ex: Logo após o treino com água ou fruta"
          value={item.timing}
          onChange={(e) => updateField('timing', e.target.value)}
          style={{ width: '100%', fontSize: 13 }}
          required
        />
      </div>

      <ItemInstructionsRow
        instructions={item.instructions ?? ''}
        onChange={(val) => updateField('instructions', val)}
      />
    </div>
  );
}
