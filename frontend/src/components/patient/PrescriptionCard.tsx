import { useState } from 'react';
import type { Prescription, PrescriptionItem } from '../../types/prescription';
import { downloadPrescriptionPdf } from '../../api/prescription';
import { useDeletePrescription } from '../../stores/prescriptionStore';
import { useToastStore } from '../../stores/toastStore';

interface PrescriptionCardProps {
  prescription: Prescription;
  patientId: string;
  patientPhone?: string;
  onEdit: (rx: Prescription) => void;
  isActive?: boolean;
}

function PrescriptionCardItem({ item }: { item: PrescriptionItem }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 6,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--paper-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{item.name}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'var(--paper-3)',
            color: 'var(--fg-muted)',
          }}
        >
          {item.form}
        </span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
        Dose: <span style={{ color: 'var(--primary, #166534)' }}>{item.dosage}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>⏰ {item.timing}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>⏳ Duração: {item.duration}</div>

      {item.instructions && (
        <div
          style={{
            fontSize: 11,
            fontStyle: 'italic',
            color: 'var(--fg-muted)',
            marginTop: 4,
            paddingTop: 4,
            borderTop: '1px dashed var(--border)',
          }}
        >
          Obs: {item.instructions}
        </div>
      )}
    </div>
  );
}

function PrescriptionCardActions({
  onDownloadPdf,
  onCopyWhatsApp,
  onSendWhatsApp,
  onEdit,
  onDelete,
  downloading,
}: {
  onDownloadPdf: () => void;
  onCopyWhatsApp: () => void;
  onSendWhatsApp: () => void;
  onEdit: () => void;
  onDelete: () => void;
  downloading: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onDownloadPdf}
        disabled={downloading}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        📄 {downloading ? 'Baixando...' : 'Receituário PDF'}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onCopyWhatsApp}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        📋 Copiar WhatsApp
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSendWhatsApp}
        style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        💬 Enviar
      </button>
      <button type="button" className="btn btn-subtle" onClick={onEdit} style={{ fontSize: 12 }}>
        Editar
      </button>
      <button
        type="button"
        className="btn btn-subtle"
        onClick={onDelete}
        style={{ fontSize: 12, color: 'var(--coral)' }}
      >
        Excluir
      </button>
    </div>
  );
}

function PrescriptionCardHeader({
  prescription,
  isActive,
  actions,
}: {
  prescription: Prescription;
  isActive: boolean;
  actions: React.ReactNode;
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

export function PrescriptionCard({
  prescription,
  patientId,
  patientPhone,
  onEdit,
  isActive = false,
}: PrescriptionCardProps) {
  const [downloading, setDownloading] = useState(false);
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

  const handleDelete = () => {
    if (window.confirm(`Deseja realmente excluir a prescrição "${prescription.title}"?`)) {
      deleteMutation.mutate(prescription.id);
    }
  };

  return (
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
            onDelete={handleDelete}
            downloading={downloading}
          />
        }
      />

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
    </div>
  );
}
