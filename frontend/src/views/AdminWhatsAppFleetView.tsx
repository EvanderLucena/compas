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
import { useToastStore } from '../stores/toastStore';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { FleetSummaryCards } from '../components/admin/whatsapp/FleetSummaryCards';
import { FleetInstanceCard } from '../components/admin/whatsapp/FleetInstanceCard';
import { FleetFilterBar } from '../components/admin/whatsapp/FleetFilterBar';
import { FleetEmptyState } from '../components/admin/whatsapp/FleetEmptyState';
import { FleetModalsContainer } from '../components/admin/whatsapp/FleetModalsContainer';
import { IconPlus, IconRefresh, IconTrash } from '../components/icons';
import type { WhatsAppFleetInstance } from '../types/whatsappFleet';

interface FleetHeaderProps {
  onRefresh: () => void;
  onOpenCreate: () => void;
}

function FleetHeader({ onRefresh, onOpenCreate }: FleetHeaderProps) {
  return (
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
          Monitoramento de chips, pareamento de números, balanceamento de pacientes e estabilidade.
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
          onClick={onRefresh}
          title="Atualizar dados da frota"
        >
          <IconRefresh size={15} />
          <span>Atualizar</span>
        </button>
        <button
          type="button"
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={onOpenCreate}
        >
          <IconPlus size={16} />
          <span>Novo Chip / Instância</span>
        </button>
      </div>
    </div>
  );
}

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
  const [disconnectTarget, setDisconnectTarget] = useState<WhatsAppFleetInstance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppFleetInstance | null>(null);

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

  const handleDisconnect = (inst: WhatsAppFleetInstance) => {
    setDisconnectTarget(inst);
  };

  const handleDelete = (inst: WhatsAppFleetInstance) => {
    if (inst.patientCount > 0) {
      useToastStore
        .getState()
        .showError(
          `O chip "${inst.name}" possui ${inst.patientCount} pacientes vinculados. Migre-os primeiro.`,
        );
      return;
    }
    setDeleteTarget(inst);
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await disconnectMutation.mutateAsync(disconnectTarget.id);
      setDisconnectTarget(null);
    } catch {
      // Toast handles error in mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Toast handles error in mutation
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
      <FleetHeader onRefresh={handleRefresh} onOpenCreate={openCreateModal} />

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

      <ConfirmModal
        isOpen={Boolean(disconnectTarget)}
        title="Desconectar Chip WhatsApp"
        description={
          disconnectTarget ? (
            <>
              Deseja realmente desconectar o chip{' '}
              <strong style={{ color: 'var(--fg, #0b0c0a)' }}>
                &quot;{disconnectTarget.name}&quot;
              </strong>
              ? O chip precisará ser reconectado via QR Code para voltar a operar.
            </>
          ) : null
        }
        confirmLabel="Desconectar"
        variant="warning"
        isPending={disconnectMutation.isPending}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleConfirmDisconnect}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Excluir Chip WhatsApp"
        description={
          deleteTarget ? (
            <>
              Tem certeza que deseja excluir o chip{' '}
              <strong style={{ color: 'var(--fg, #0b0c0a)' }}>
                &quot;{deleteTarget.name}&quot;
              </strong>{' '}
              permanentemente? Esta ação não pode ser desfeita.
            </>
          ) : null
        }
        confirmLabel="Excluir Permanentemente"
        confirmIcon={<IconTrash size={13} />}
        variant="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <FleetModalsContainer />
    </div>
  );
}
