import { useState, useRef, useId } from 'react';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { IconX, IconUsers, IconWhatsapp } from '../../icons';
import { useInstancePatients } from '../../../stores/adminWhatsappStore';
import type { WhatsAppFleetInstance } from '../../../types/whatsappFleet';

interface InstancePatientsModalProps {
  instance: WhatsAppFleetInstance;
  onClose: () => void;
}

export function InstancePatientsModal({ instance, onClose }: InstancePatientsModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const { data, isLoading } = useInstancePatients(instance.id, page, pageSize);

  const patients = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? instance.patientCount;

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
          maxWidth: 640,
          background: 'var(--surface)',
          padding: 24,
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
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
                background: 'var(--surface-2)',
                color: 'var(--fg)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconUsers size={18} />
            </div>
            <div>
              <h2 id={titleId} style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                Pacientes Vinculados
              </h2>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {instance.name} ({totalElements} pacientes)
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

        {/* Table Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            margin: '8px 0',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          {isLoading ? (
            <div
              style={{ padding: 32, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}
            >
              Carregando lista de pacientes...
            </div>
          ) : patients.length === 0 ? (
            <div
              style={{ padding: 32, textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 13 }}
            >
              Nenhum paciente vinculado a este chip no momento.
            </div>
          ) : (
            <table
              style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <th style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--fg-muted)' }}>
                    Paciente
                  </th>
                  <th style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--fg-muted)' }}>
                    WhatsApp
                  </th>
                  <th style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--fg-muted)' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 14px' }} className="mono">
                      {p.whatsapp ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconWhatsapp size={13} style={{ color: 'var(--sage)' }} />
                          {p.whatsapp}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--fg-subtle)' }}>Sem número</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'var(--surface-2)',
                          color: 'var(--fg-muted)',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with Pagination */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
          }}
        >
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
            Página {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--border)' }}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--border)' }}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
