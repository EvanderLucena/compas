import { useState } from 'react';
import {
  IconWhatsapp,
  IconQrCode,
  IconRefresh,
  IconUsers,
  IconDots,
  IconAlert,
  IconEdit,
  IconTrash,
} from '../../icons';
import type { WhatsAppFleetInstance, WhatsAppInstanceStatus } from '../../../types/whatsappFleet';

interface FleetInstanceCardProps {
  instance: WhatsAppFleetInstance;
  onConnect: (instance: WhatsAppFleetInstance) => void;
  onSync: (instance: WhatsAppFleetInstance) => void;
  onRestart: (instance: WhatsAppFleetInstance) => void;
  onDisconnect: (instance: WhatsAppFleetInstance) => void;
  onMigrate: (instance: WhatsAppFleetInstance) => void;
  onViewPatients: (instance: WhatsAppFleetInstance) => void;
  onEdit: (instance: WhatsAppFleetInstance) => void;
  onDelete: (instance: WhatsAppFleetInstance) => void;
  isSyncing?: boolean;
}

const STATUS_CONFIG: Record<
  WhatsAppInstanceStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  CONNECTED: {
    label: 'Conectado',
    color: 'var(--sage)',
    bg: 'var(--sage-dim, rgba(127, 183, 126, 0.15))',
    border: 'rgba(127, 183, 126, 0.3)',
  },
  CONNECTING: {
    label: 'Conectando...',
    color: 'var(--amber)',
    bg: 'rgba(232, 184, 74, 0.15)',
    border: 'rgba(232, 184, 74, 0.3)',
  },
  DISCONNECTED: {
    label: 'Desconectado',
    color: 'var(--coral)',
    bg: 'var(--coral-dim, rgba(255, 107, 74, 0.15))',
    border: 'rgba(255, 107, 74, 0.3)',
  },
  BANNED: {
    label: 'Banido / Bloqueado',
    color: 'var(--coral)',
    bg: 'rgba(255, 107, 74, 0.25)',
    border: 'var(--coral)',
  },
  DISABLED: {
    label: 'Desativado',
    color: 'var(--fg-subtle)',
    bg: 'var(--surface-2)',
    border: 'var(--border)',
  },
};

export function FleetInstanceCard({
  instance,
  onConnect,
  onSync,
  onRestart,
  onDisconnect,
  onMigrate,
  onViewPatients,
  onEdit,
  onDelete,
  isSyncing,
}: FleetInstanceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[instance.status] || STATUS_CONFIG.DISCONNECTED;
  const isConnected = instance.status === 'CONNECTED';
  const pct = Math.min(instance.capacityPercentage, 100);

  const formatPhone = (phone?: string | null) => {
    if (!phone) return 'Número não configurado';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 13 && digits.startsWith('55')) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 12 && digits.startsWith('55')) {
      return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    return phone;
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        position: 'relative',
        border: instance.isNearCapacity ? '1px solid var(--amber)' : undefined,
      }}
    >
      {/* Header: Name + Status Badge + Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: statusCfg.color,
                display: 'inline-block',
                boxShadow: isConnected ? `0 0 8px ${statusCfg.color}` : 'none',
              }}
            />
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{instance.name}</h3>
          </div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>
            {formatPhone(instance.phoneNumber)}
          </div>
        </div>

        {/* Status Pill & Options Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 999,
              color: statusCfg.color,
              background: statusCfg.bg,
              border: `1px solid ${statusCfg.border}`,
            }}
          >
            {statusCfg.label}
          </span>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: 4, borderRadius: 4 }}
              onClick={() => setMenuOpen((o) => !o)}
              title="Mais ações"
            >
              <IconDots size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 60,
                    width: 170,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '4px 0',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--fg)',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(instance);
                    }}
                  >
                    <IconEdit size={14} />
                    Editar Configurações
                  </button>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--fg)',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      onViewPatients(instance);
                    }}
                  >
                    <IconUsers size={14} />
                    Listar Pacientes ({instance.patientCount})
                  </button>

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--fg)',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      onMigrate(instance);
                    }}
                  >
                    <IconWhatsapp size={14} />
                    Migrar Pacientes
                  </button>

                  {isConnected && (
                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--coral)',
                        textAlign: 'left',
                      }}
                      onClick={() => {
                        setMenuOpen(false);
                        onDisconnect(instance);
                      }}
                    >
                      <IconAlert size={14} />
                      Desconectar Chip
                    </button>
                  )}

                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--coral)',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(instance);
                    }}
                  >
                    <IconTrash size={14} />
                    Excluir Instância
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {instance.description && (
        <p
          style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '10px 0 0 0', lineHeight: 1.4 }}
        >
          {instance.description}
        </p>
      )}

      {/* Capacity & Allocation Metrics */}
      <div
        style={{
          marginTop: 16,
          padding: '12px 14px',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--fg-muted)' }}>Carga de Pacientes:</span>
          <span className="mono tnum" style={{ fontWeight: 600 }}>
            {instance.patientCount} / {instance.maxPatients} ({pct}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            marginTop: 6,
            height: 6,
            borderRadius: 999,
            background: 'var(--paper-3)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: pct >= 90 ? 'var(--coral)' : pct >= 75 ? 'var(--amber)' : 'var(--sage)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--fg-subtle)',
          }}
        >
          <span>{instance.nutritionistCount} nutricionistas</span>
          {instance.isNearCapacity && (
            <span style={{ color: 'var(--coral)', fontWeight: 500 }}>
              Próximo do teto ({instance.maxPatients})
            </span>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--fg-subtle)' }}>
        {isConnected ? (
          <span>Ativo no gateway</span>
        ) : instance.disconnectedAt ? (
          <span>
            Desconectado em: {new Date(instance.disconnectedAt).toLocaleDateString('pt-BR')}
          </span>
        ) : (
          <span>Aguardando primeiro pareamento</span>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isConnected ? (
          <button
            type="button"
            className="btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onClick={() => onConnect(instance)}
          >
            <IconQrCode size={16} />
            <span>Conectar Aparelho</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-ghost"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              border: '1px solid var(--border)',
            }}
            onClick={() => onConnect(instance)}
            title="Exibir QR Code ou re-parear"
          >
            <IconQrCode size={15} />
            <span>Ver QR Code</span>
          </button>
        )}

        <button
          type="button"
          className="btn-ghost"
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
          onClick={() => onSync(instance)}
          disabled={isSyncing}
          title="Sincronizar status com gateway Evolution"
        >
          <IconRefresh size={15} className={isSyncing ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
          onClick={() => onRestart(instance)}
          title="Reiniciar instância na Evolution API"
        >
          <span>Reiniciar</span>
        </button>
      </div>
    </div>
  );
}
