import { useState, type ReactNode } from 'react';
import type { Prescription } from '../../types/prescription';
import { downloadPrescriptionPdf } from '../../api/prescription';
import { useDeletePrescription } from '../../stores/prescriptionStore';
import { useToastStore } from '../../stores/toastStore';
import { ConfirmModal } from '../ui/ConfirmModal';
import { IconTrash } from '../icons';
import { PrescriptionCardItem } from './PrescriptionCardItem';
import { PrescriptionCardActions } from './PrescriptionCardActions';

interface PrescriptionCardProps {
  prescription: Prescription;
  patientId: string;
  patientPhone?: string;
  onEdit: (rx: Prescription) => void;
  isActive?: boolean;
}

function PrescriptionCardHeader({
  prescription,
  isActive,
  actions,
}: {
  prescription: Prescription;
  isActive: boolean;
  actions: ReactNode;
}) {
  const formattedDate = new Date(prescription.createdAt).toLocaleDateString('pt-BR');
  const countLabel = prescription.totalItems === 1 ? 'item' : 'itens';

  return (
    <div
      className="card-h"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: isActive ? 'var(--paper-2)' : 'var(--paper)',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            {prescription.title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: isActive
                ? 'var(--sage-dim, rgba(16, 185, 129, 0.15))'
                : 'var(--paper-3)',
              color: isActive ? 'var(--sage, #10b981)' : 'var(--fg-muted)',
            }}
          >
            {prescription.statusLabel}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
          Emitida em {formattedDate} · {prescription.totalItems} {countLabel}
        </div>
      </div>
      {actions}
    </div>
  );
}

function PrescriptionCardBody({ prescription }: { prescription: Prescription }) {
  return (
    <div style={{ padding: '16px 20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}
      >
        {prescription.items.map((item) => (
          <PrescriptionCardItem key={item.id} item={item} />
        ))}
      </div>

      {prescription.notes && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 6,
            backgroundColor: 'var(--paper-3)',
            border: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--ink)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Orientações Gerais:</div>
          <div>{prescription.notes}</div>
        </div>
      )}
    </div>
  );
}

export function PrescriptionCard({
  prescription,
  patientId,
  patientPhone,
  onEdit,
  isActive = false,
}: PrescriptionCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteMutation = useDeletePrescription(patientId);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadPrescriptionPdf(
        patientId,
        prescription.id,
        `receituario-${prescription.patientName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      );
      useToastStore.getState().showSuccess('PDF do receituário baixado!');
    } catch {
      useToastStore.getState().showError('Falha ao baixar o PDF. Tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyWhatsApp = () => {
    if (prescription.whatsappMessage) {
      navigator.clipboard.writeText(prescription.whatsappMessage);
      useToastStore.getState().showSuccess('Mensagem copiada para a área de transferência!');
    } else {
      useToastStore.getState().showError('Mensagem da prescrição não disponível.');
    }
  };

  const handleSendWhatsApp = () => {
    if (!prescription.whatsappMessage) {
      useToastStore.getState().showError('Mensagem da prescrição não disponível.');
      return;
    }
    const text = encodeURIComponent(prescription.whatsappMessage);
    const cleanPhone = patientPhone ? patientPhone.replace(/\D/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(prescription.id, {
      onSuccess: () => setShowDeleteModal(false),
    });
  };

  return (
    <>
      <div
        className="card"
        data-testid={`prescription-card-${prescription.id}`}
        style={{
          marginBottom: 20,
          borderRadius: 8,
          border: isActive ? '2px solid var(--sage, #10b981)' : '1px solid var(--border)',
          overflow: 'hidden',
          backgroundColor: 'var(--paper)',
        }}
      >
        <PrescriptionCardHeader
          prescription={prescription}
          isActive={isActive}
          actions={
            <PrescriptionCardActions
              onDownloadPdf={handleDownloadPdf}
              onCopyWhatsApp={handleCopyWhatsApp}
              onSendWhatsApp={handleSendWhatsApp}
              onEdit={() => onEdit(prescription)}
              onDelete={() => setShowDeleteModal(true)}
              downloading={downloading}
            />
          }
        />

        <PrescriptionCardBody prescription={prescription} />
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Excluir Prescrição"
        description={
          <>
            Tem certeza que deseja excluir a prescrição{' '}
            <strong style={{ color: 'var(--fg, #0b0c0a)' }}>
              &quot;{prescription.title}&quot;
            </strong>
            ? Esta ação não poderá ser desfeita.
          </>
        }
        confirmLabel="Excluir Prescrição"
        confirmIcon={<IconTrash size={13} />}
        variant="danger"
        isPending={deleteMutation.isPending}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
