import { useState } from 'react';
import type { TimelineEvent } from '../../types/patient';
import { IconPlus, IconX, IconCheck } from '../icons';
import { usePatchExtraction } from '../../stores/whatsappStore';

interface ExtractionRow {
  name: string;
  kcal: number | string;
  prot: number | string;
  carb: number | string;
  fat: number | string;
}

interface ExtractionEditorProps {
  ev: TimelineEvent;
  extractionId: string;
  patientId: string;
  onClose: () => void;
}

export function ExtractionEditor({ ev, extractionId, patientId, onClose }: ExtractionEditorProps) {
  const [items, setItems] = useState<ExtractionRow[]>(
    ev.rawItems && ev.rawItems.length > 0
      ? ev.rawItems.map((item) => ({
          name: item.name,
          kcal: item.kcal,
          prot: item.prot,
          carb: item.carb,
          fat: item.fat,
        }))
      : ev.items.map((name, i) => ({
          name,
          kcal: i === 0 ? (ev.macros?.kcal ?? 0) : 0,
          prot: i === 0 ? (ev.macros?.prot ?? 0) : 0,
          carb: i === 0 ? (ev.macros?.carb ?? 0) : 0,
          fat: i === 0 ? (ev.macros?.fat ?? 0) : 0,
        })),
  );
  const patchExtraction = usePatchExtraction(patientId);

  const totals = items.reduce(
    (a, x) => ({
      kcal: a.kcal + (Number(x.kcal) || 0),
      prot: a.prot + (Number(x.prot) || 0),
      carb: a.carb + (Number(x.carb) || 0),
      fat: a.fat + (Number(x.fat) || 0),
    }),
    { kcal: 0, prot: 0, carb: 0, fat: 0 },
  );

  const update = (i: number, k: keyof ExtractionRow, v: string) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));

  const addItem = () => setItems([...items, { name: '', kcal: 0, prot: 0, carb: 0, fat: 0 }]);

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!extractionId || !patientId) return;

    const payload = {
      items: items.map((item) => ({
        name: String(item.name),
        kcal: Number(item.kcal) || 0,
        prot: Number(item.prot) || 0,
        carb: Number(item.carb) || 0,
        fat: Number(item.fat) || 0,
        grams: null as number | null,
      })),
    };

    patchExtraction.mutate(
      { extractionId, payload },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid var(--border)',
    borderRadius: 5,
    fontSize: 12.5,
    background: 'var(--surface)',
    outline: 'none',
    color: 'var(--fg)',
    width: '100%',
  };

  return (
    <div
      style={{
        margin: '0 22px 18px 106px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div className="eyebrow">
          CORREÇÃO DE EXTRAÇÃO · {ev.time} · {ev.meal}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', flex: 1 }}>
          Ajuste os alimentos e macros se a IA errou na leitura.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 0.7fr 0.7fr 0.7fr 0.7fr 28px',
          gap: 8,
          padding: '8px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {['Alimento identificado', 'Kcal', 'Prot (g)', 'Carb (g)', 'Gord (g)', ''].map((h, i) => (
          <div key={i} className="eyebrow" style={{ fontSize: 9.5 }}>
            {h}
          </div>
        ))}
      </div>

      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 0.7fr 0.7fr 0.7fr 0.7fr 28px',
            gap: 8,
            padding: '8px 14px',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          <input
            value={it.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            style={inputStyle}
          />
          {(['kcal', 'prot', 'carb', 'fat'] as const).map((k) => (
            <input
              key={k}
              value={it[k]}
              onChange={(e) => update(i, k, e.target.value)}
              className="mono tnum"
              style={inputStyle}
            />
          ))}
          <button
            onClick={() => removeItem(i)}
            style={{ color: 'var(--fg-subtle)', padding: 4 }}
            title="Remover"
          >
            <IconX size={12} />
          </button>
        </div>
      ))}

      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={addItem} style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          <IconPlus size={11} style={{ verticalAlign: '-2px', marginRight: 4 }} /> Adicionar
          alimento
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 0.7fr 0.7fr 0.7fr 0.7fr 28px',
          gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div className="eyebrow" style={{ fontSize: 10, paddingLeft: 2 }}>
          TOTAL CORRIGIDO
        </div>
        {[totals.kcal, totals.prot, totals.carb, totals.fat].map((v, i) => (
          <div key={i} className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>
            {v}
          </div>
        ))}
        <div />
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={patchExtraction.isPending}
        >
          <IconCheck size={12} /> {patchExtraction.isPending ? 'Salvando...' : 'Salvar correção'}
        </button>
      </div>
    </div>
  );
}
