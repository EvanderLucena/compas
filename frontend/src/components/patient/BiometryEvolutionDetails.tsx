import * as React from 'react';
import { useToastStore } from '../../stores/toastStore';
import { IconCopy, IconCheck } from '../icons';
import type { PerimetryDelta } from '../../types/biometry';
import { DeltaBadge } from './BiometryEvolutionSubcomponents';

export function PerimetryDeltasGrid({ deltas }: { deltas: PerimetryDelta[] }) {
  if (!deltas || deltas.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--fg-muted)' }}>
        CIRCUNFERÊNCIAS CORPORAIS (MARCO INICIAL → ATUAL)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {deltas.map((p) => (
          <div
            key={p.measureKey}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--fg)',
                }}
              >
                {p.label}
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                {p.initialCm.toFixed(1)} → {p.currentCm.toFixed(1)} cm
              </div>
            </div>
            <DeltaBadge val={p.deltaCm} unit="cm" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvolutionSynthesisBox({ clinicalSynthesis }: { clinicalSynthesis: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        background: 'color-mix(in srgb, var(--lime) 8%, var(--surface))',
        border: '1px solid color-mix(in srgb, var(--lime) 28%, var(--border))',
        borderLeft: '4px solid var(--lime)',
        padding: '12px 14px',
        borderRadius: '0 6px 6px 0',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--fg)',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>💡 Síntese Clínica da Evolução</span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--fg)',
        }}
      >
        {clinicalSynthesis}
      </p>
    </div>
  );
}

export function EvolutionWhatsAppAction({ whatsappMessage }: { whatsappMessage: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      useToastStore.getState().showSuccess('Mensagem de feedback copiada com sucesso!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      useToastStore.getState().showError('Não foi possível copiar para a área de transferência');
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <button
        type="button"
        className="btn btn-secondary"
        data-testid="btn-copy-biometry-whatsapp"
        onClick={handleCopy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          padding: '7px 14px',
        }}
      >
        {copied ? (
          <>
            <IconCheck size={14} color="var(--sage)" />
            <span style={{ color: 'var(--sage)', fontWeight: 600 }}>Mensagem Copiada!</span>
          </>
        ) : (
          <>
            <IconCopy size={14} />
            <span>Copiar Mensagem para WhatsApp</span>
          </>
        )}
      </button>
    </div>
  );
}
