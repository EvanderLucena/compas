import { IconServer, IconCheck, IconAlert, IconUsers } from '../../icons';
import type { FleetSummary } from '../../../types/whatsappFleet';

interface FleetSummaryCardsProps {
  summary?: FleetSummary | null;
  isLoading?: boolean;
}

export function FleetSummaryCards({ summary, isLoading }: FleetSummaryCardsProps) {
  const totalAssigned = summary?.totalAssignedPatients ?? 0;
  const totalCapacity = summary?.totalCapacity ?? 0;
  const capacityPct = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;
  const totalInstances = summary?.totalInstances ?? 0;
  const connected = summary?.connectedInstances ?? 0;
  const disconnected = summary?.disconnectedInstances ?? 0;
  const alerts = summary?.alertCount ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {/* Total Chips */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">Frota Total</span>
          <IconServer size={18} style={{ color: 'var(--fg-muted)' }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="mono tnum" style={{ fontSize: 26, fontWeight: 600 }}>
            {isLoading ? '...' : totalInstances}
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>chips ativos</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-subtle)' }}>
          Instâncias cadastradas no gateway
        </div>
      </div>

      {/* Connection State */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">Conectividade</span>
          <IconCheck
            size={18}
            style={{ color: connected > 0 ? 'var(--sage)' : 'var(--fg-muted)' }}
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            className="mono tnum"
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: connected === totalInstances && totalInstances > 0 ? 'var(--sage)' : 'inherit',
            }}
          >
            {isLoading ? '...' : connected}
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>de {totalInstances} online</span>
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: disconnected > 0 ? 'var(--coral)' : 'var(--fg-subtle)',
          }}
        >
          {disconnected > 0
            ? `${disconnected} chip(s) desconectado(s)`
            : 'Todos os chips operacionais'}
        </div>
      </div>

      {/* Patient Allocation & Capacity */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">Capacidade da Frota</span>
          <IconUsers size={18} style={{ color: 'var(--fg-muted)' }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="mono tnum" style={{ fontSize: 26, fontWeight: 600 }}>
            {isLoading ? '...' : totalAssigned}
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            / {totalCapacity} vagas ({capacityPct}%)
          </span>
        </div>
        {/* Capacity Bar */}
        <div
          style={{
            marginTop: 8,
            height: 6,
            borderRadius: 999,
            background: 'var(--surface-2)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(capacityPct, 100)}%`,
              background:
                capacityPct >= 90
                  ? 'var(--coral)'
                  : capacityPct >= 75
                    ? 'var(--amber)'
                    : 'var(--sage)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--fg-subtle)' }}>
          Alvo: 150-200 pacientes por chip (anti-ban)
        </div>
      </div>

      {/* Operational Alerts */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">Alertas de Operação</span>
          <IconAlert size={18} style={{ color: alerts > 0 ? 'var(--coral)' : 'var(--sage)' }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            className="mono tnum"
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: alerts > 0 ? 'var(--coral)' : 'var(--sage)',
            }}
          >
            {isLoading ? '...' : alerts}
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
            {alerts === 1 ? 'alerta ativo' : 'alertas ativos'}
          </span>
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: alerts > 0 ? 'var(--coral)' : 'var(--fg-subtle)',
          }}
        >
          {alerts > 0 ? 'Chips desconectados ou lotados' : 'Nenhuma anomalia detectada'}
        </div>
      </div>
    </div>
  );
}
