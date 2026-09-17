import { useState } from 'react';
import type { TimelineEvent } from '../../types/patient';
import { IconEdit } from '../icons';
import { ExtractionEditor } from './ExtractionEditor';

interface TimelineProps {
  items: TimelineEvent[];
  patientId?: string;
  emptyTitle?: string;
}

interface TimelineFoodListProps {
  ev: TimelineEvent;
  itemKey: string;
}

function TimelineFoodList({ ev, itemKey }: TimelineFoodListProps) {
  if (ev.rawItems && ev.rawItems.length > 0) {
    return (
      <ul
        style={{
          margin: '6px 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {ev.rawItems.map((it, j) => (
          <li
            key={`${itemKey}-item-${j}`}
            style={{ fontSize: 13, color: 'var(--fg)', display: 'flex', gap: 8 }}
          >
            <span style={{ color: 'var(--fg-subtle)' }}>·</span>
            <span>
              {it.name}
              {it.grams != null && it.grams > 0 && (
                <span style={{ color: 'var(--fg-muted)', fontSize: 12, marginLeft: 4 }}>
                  ({it.grams}g)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      style={{
        margin: '6px 0 0',
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {ev.items.map((it, j) => (
        <li
          key={`${itemKey}-item-${j}`}
          style={{ fontSize: 13, color: 'var(--fg)', display: 'flex', gap: 8 }}
        >
          <span style={{ color: 'var(--fg-subtle)' }}>·</span>
          {it}
        </li>
      ))}
    </ul>
  );
}

interface TimelineRowProps {
  ev: TimelineEvent;
  isLast: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onCloseEdit: () => void;
  patientId?: string;
}

function TimelineRow({
  ev,
  isLast,
  isEditing,
  onToggleEdit,
  onCloseEdit,
  patientId,
}: TimelineRowProps) {
  const key = ev.extractionId ?? `${ev.time}-${ev.meal}`;

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70px 20px 1fr 170px',
          gap: 14,
          padding: '18px 22px',
        }}
      >
        <div style={{ paddingTop: 2 }}>
          <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>
            {ev.time}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--fg-subtle)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            {ev.meal}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 6,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--lime-dim)',
              border: '2px solid var(--lime-dim)',
              boxShadow: '0 0 0 3px rgba(156,191,43,0.13)',
            }}
          />
          {!isLast && (
            <div
              style={{
                width: 1,
                flex: 1,
                background: 'var(--border)',
                marginTop: 4,
                minHeight: 20,
              }}
            />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Registro</div>
            <div className="chip ai" style={{ padding: '1px 6px' }}>
              <span className="d" />
              EXTRAÍDO IA
            </div>
          </div>
          <TimelineFoodList ev={ev} itemKey={key} />
          {ev.label && (
            <details style={{ marginTop: 8, fontSize: 11, color: 'var(--fg-subtle)' }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                Ver texto recebido
              </summary>
              <div
                style={{
                  marginTop: 4,
                  padding: '6px 10px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--fg-muted)',
                  fontSize: 11.5,
                  fontStyle: 'italic',
                }}
              >
                "{ev.label}"
              </div>
            </details>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {ev.macros && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto',
                columnGap: 10,
                rowGap: 2,
                fontSize: 11.5,
                textAlign: 'right',
              }}
            >
              <span style={{ color: 'var(--fg-muted)' }}>kcal</span>
              <span className="mono tnum" style={{ fontWeight: 600 }}>
                {ev.macros.kcal}
              </span>
              <span style={{ color: 'var(--fg-muted)' }}>prot</span>
              <span className="mono tnum">{ev.macros.prot}g</span>
              <span style={{ color: 'var(--fg-muted)' }}>carb</span>
              <span className="mono tnum">{ev.macros.carb}g</span>
              <span style={{ color: 'var(--fg-muted)' }}>gord</span>
              <span className="mono tnum">{ev.macros.fat}g</span>
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{
              fontSize: 11,
              padding: '3px 6px',
              color: isEditing ? 'var(--fg)' : 'var(--fg-subtle)',
            }}
            onClick={onToggleEdit}
          >
            <IconEdit size={10} /> {isEditing ? 'Fechar' : 'Corrigir extração'}
          </button>
        </div>
      </div>

      {isEditing && (
        <ExtractionEditor
          ev={ev}
          extractionId={ev.extractionId ?? ''}
          patientId={patientId ?? ''}
          onClose={onCloseEdit}
        />
      )}
    </div>
  );
}

export function Timeline({ items, patientId, emptyTitle }: TimelineProps) {
  const reported = items.filter((ev) => ev.kind === 'log');
  const [editing, setEditing] = useState<string | null>(null);

  if (reported.length === 0) {
    return (
      <div
        style={{
          padding: '40px 22px',
          textAlign: 'center',
          color: 'var(--fg-muted)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 14px',
          }}
        >
          <span style={{ fontSize: 18 }}>🍽️</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 6 }}>
          {emptyTitle || 'Nenhum registro hoje'}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
          Quando o paciente enviar refeições pelo WhatsApp, elas aparecerão aqui com os macros
          estimados pela IA.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {reported.map((ev, i) => {
        const key = ev.extractionId ?? `${ev.time}-${ev.meal}`;
        return (
          <TimelineRow
            key={key}
            ev={ev}
            isLast={i === reported.length - 1}
            isEditing={editing === key}
            onToggleEdit={() => setEditing(editing === key ? null : key)}
            onCloseEdit={() => setEditing(null)}
            patientId={patientId}
          />
        );
      })}
    </div>
  );
}
