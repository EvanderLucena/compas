import { IconSearch } from '../../icons';
import type { WhatsAppInstanceStatus } from '../../../types/whatsappFleet';

const STATUS_FILTERS: { key: WhatsAppInstanceStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'CONNECTED', label: 'Conectados' },
  { key: 'CONNECTING', label: 'Conectando' },
  { key: 'DISCONNECTED', label: 'Desconectados' },
  { key: 'BANNED', label: 'Banidos' },
];

interface FleetFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: WhatsAppInstanceStatus | 'ALL';
  onStatusFilterChange: (s: WhatsAppInstanceStatus | 'ALL') => void;
}

export function FleetFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: FleetFilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {/* Search */}
      <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
        <IconSearch
          size={15}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--fg-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Buscar por chip, número ou operadora..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
          style={{
            width: '100%',
            paddingLeft: 34,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            fontSize: 13,
            borderRadius: 'var(--radius)',
          }}
        />
      </div>

      {/* Status Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onStatusFilterChange(f.key)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 999,
              border: `1px solid ${statusFilter === f.key ? 'var(--fg)' : 'var(--border)'}`,
              background: statusFilter === f.key ? 'var(--surface-2)' : 'transparent',
              color: statusFilter === f.key ? 'var(--fg)' : 'var(--fg-muted)',
              fontWeight: statusFilter === f.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
