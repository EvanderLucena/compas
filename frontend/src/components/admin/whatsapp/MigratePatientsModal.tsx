import { useState, useRef, useId } from 'react';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { IconX, IconAlert, IconWhatsapp } from '../../icons';
import { useMigrateFleetPatients, useWhatsAppFleet } from '../../../stores/adminWhatsappStore';
import type { WhatsAppFleetInstance } from '../../../types/whatsappFleet';

interface MigratePatientsModalProps {
  sourceInstance: WhatsAppFleetInstance;
  onClose: () => void;
}

export function MigratePatientsModal({ sourceInstance, onClose }: MigratePatientsModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const { data: instances } = useWhatsAppFleet();
  const [targetInstanceId, setTargetInstanceId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const migrateMutation = useMigrateFleetPatients();

  // Filter out the source instance and only show active instances
  const availableTargets = (instances || []).filter((i) => i.id !== sourceInstance.id && i.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInstanceId) {
      setErrorMsg('Selecione uma instância de destino');
      return;
    }

    setErrorMsg(null);
    await migrateMutation.mutateAsync({
      sourceId: sourceInstance.id,
      targetId: targetInstanceId,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card"
        style={{
          width: '100%',
          maxWidth: 500,
          background: 'var(--surface)',
          padding: 24,
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(232, 184, 74, 0.15)',
                color: 'var(--amber)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconWhatsapp size={18} />
            </div>
            <div>
              <h2 id={titleId} style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Migrar Pacientes entre Chips
              </h2>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                Reatribuição em massa da frota
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 6, borderRadius: '50%' }}
            title="Fechar"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Warning Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 14px',
            background: 'rgba(232, 184, 74, 0.1)',
            border: '1px solid rgba(232, 184, 74, 0.3)',
            borderRadius: 'var(--radius)',
            marginBottom: 20,
          }}
        >
          <IconAlert size={18} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>
            <strong>Atenção operacional:</strong> Esta ação moverá todos os{' '}
            <span className="mono tnum" style={{ fontWeight: 600 }}>
              {sourceInstance.patientCount}
            </span>{' '}
            pacientes vinculados ao chip <strong>{sourceInstance.name}</strong> para o chip
            selecionado. As mensagens enviadas pela IA passarão a sair pelo novo número.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Chip de Origem (Atual)
            </label>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span className="mono" style={{ fontWeight: 500 }}>
                {sourceInstance.name} ({sourceInstance.phoneNumber || 'sem telefone'})
              </span>
              <span className="mono tnum" style={{ color: 'var(--fg-muted)' }}>
                {sourceInstance.patientCount} pacientes
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Chip de Destino (Receberá os pacientes) *
            </label>
            {availableTargets.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-2)',
                  fontSize: 12,
                  color: 'var(--coral)',
                }}
              >
                Nenhum outro chip ativo disponível na frota para migração. Cadastre um novo chip
                primeiro.
              </div>
            ) : (
              <select
                value={targetInstanceId}
                onChange={(e) => setTargetInstanceId(e.target.value)}
                className="input mono"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius)',
                  border: errorMsg ? '1px solid var(--coral)' : '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                }}
              >
                <option value="">Selecione o chip de destino...</option>
                {availableTargets.map((t) => {
                  const available = Math.max(0, t.maxPatients - t.patientCount);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.phoneNumber || 'sem telefone'} ({t.patientCount}/{t.maxPatients}{' '}
                      pacientes, {available} vagas livres)
                    </option>
                  );
                })}
              </select>
            )}
            {errorMsg && (
              <span style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4, display: 'block' }}>
                {errorMsg}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={migrateMutation.isPending || availableTargets.length === 0}
              style={{
                padding: '8px 20px',
                background: 'var(--coral)',
                color: '#fff',
                border: 'none',
              }}
            >
              {migrateMutation.isPending ? 'Migrando...' : 'Confirmar Migração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
