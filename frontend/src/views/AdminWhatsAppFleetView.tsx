import { useState, useMemo } from 'react';
import {
  useWhatsAppFleet,
  useFleetSummary,
  useAdminWhatsappUIStore,
  useSyncFleetInstance,
  useRestartFleetInstance,
  useDisconnectFleetInstance,
  useDeleteFleetInstance,
} from '../stores/adminWhatsappStore';
import { FleetSummaryCards } from '../components/admin/whatsapp/FleetSummaryCards';
import { FleetInstanceCard } from '../components/admin/whatsapp/FleetInstanceCard';
import { FleetFilterBar } from '../components/admin/whatsapp/FleetFilterBar';
import { FleetEmptyState } from '../components/admin/whatsapp/FleetEmptyState';
import { FleetModalsContainer } from '../components/admin/whatsapp/FleetModalsContainer';
import { IconPlus, IconRefresh } from '../components/icons';
import type { WhatsAppFleetInstance } from '../types/whatsappFleet';

export function AdminWhatsAppFleetView() {
  const {
    data: instances,
    isLoading: loadingInstances,
    refetch: refetchFleet,
  } = useWhatsAppFleet();
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useFleetSummary();

  const {
    openCreateModal,
    openQrModal,
    openMigrateModal,
    openEditModal,
    openPatientsModal,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useAdminWhatsappUIStore();

  const syncMutation = useSyncFleetInstance();
  const restartMutation = useRestartFleetInstance();
  const disconnectMutation = useDisconnectFleetInstance();
  const deleteMutation = useDeleteFleetInstance();

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    await Promise.all([refetchFleet(), refetchSummary()]);
  };

  const handleSync = async (inst: WhatsAppFleetInstance) => {
    setSyncingId(inst.id);
    try {
      await syncMutation.mutateAsync(inst.id);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (inst: WhatsAppFleetInstance) => {
    if (window.confirm(`Deseja realmente desconectar o chip "${inst.name}"?`)) {
      await disconnectMutation.mutateAsync(inst.id);
    }
  };

  const handleDelete = async (inst: WhatsAppFleetInstance) => {
    if (inst.patientCount > 0) {
      alert(
        `O chip "${inst.name}" possui ${inst.patientCount} pacientes vinculados. Migre-os primeiro.`,
      );
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o chip "${inst.name}" permanentemente?`)) {
      await deleteMutation.mutateAsync(inst.id);
    }
  };

  const filteredInstances = useMemo(() => {
    let list = instances ?? [];
    if (statusFilter !== 'ALL') {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.phoneNumber && i.phoneNumber.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [instances, statusFilter, searchQuery]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Frota WhatsApp & Gateway</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: '4px 0 0 0' }}>
            Monitoramento de chips, pareamento de números, balanceamento de pacientes e
            estabilidade.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--border)',
            }}
            onClick={handleRefresh}
            title="Atualizar dados da frota"
          >
            <IconRefresh size={15} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={openCreateModal}
          >
            <IconPlus size={16} />
            <span>Novo Chip / Instância</span>
          </button>
        </div>
      </div>

      <FleetSummaryCards summary={summary} isLoading={loadingSummary} />

      <FleetFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loadingInstances ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 14 }}>
          Carregando instâncias da frota WhatsApp...
        </div>
      ) : filteredInstances.length === 0 ? (
        <FleetEmptyState hasInstances={Boolean(instances?.length)} onOpenCreate={openCreateModal} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {filteredInstances.map((inst) => (
            <FleetInstanceCard
              key={inst.id}
              instance={inst}
              onConnect={openQrModal}
              onSync={handleSync}
              onRestart={(i) => restartMutation.mutateAsync(i.id)}
              onDisconnect={handleDisconnect}
              onMigrate={openMigrateModal}
              onViewPatients={openPatientsModal}
              onEdit={openEditModal}
              onDelete={handleDelete}
              isSyncing={syncingId === inst.id}
            />
          ))}
        </div>
      )}

      <FleetModalsContainer />
    </div>
  );
}
