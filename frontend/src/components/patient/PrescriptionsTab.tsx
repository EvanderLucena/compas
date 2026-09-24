import { useState } from 'react';
import type { Prescription } from '../../types/prescription';
import { usePrescriptions, usePrescriptionCatalog } from '../../stores/prescriptionStore';
import { PrescriptionCard } from './PrescriptionCard';
import { PrescriptionEditorModal } from './PrescriptionEditorModal';

interface PrescriptionsTabProps {
  patientId: string;
  patientPhone?: string;
}

function PrescriptionsTabHeader({ onNew }: { onNew: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
          Prescrições & Suplementação
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
          GERENCIAMENTO CLÍNICO · SUPLEMENTOS · POSOLOGIA · RECEITUÁRIOS
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onNew}
        style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span>+</span> Nova Prescrição
      </button>
    </div>
  );
}

function PrescriptionsEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        borderRadius: 8,
        border: '1px dashed var(--border)',
        backgroundColor: 'var(--paper)',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>💊</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
        Nenhuma prescrição registrada
      </div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--fg-muted)',
          maxWidth: 480,
          margin: '0 auto 20px',
          lineHeight: 1.5,
        }}
      >
        Prescreva suplementos, vitaminas e fitoterápicos com dosagens precisas, horários de tomada e
        gere receituários oficiais em PDF prontos para envio.
      </p>
      <button type="button" className="btn btn-primary" onClick={onNew}>
        + Criar Primeira Prescrição
      </button>
    </div>
  );
}

export function PrescriptionsTab({ patientId, patientPhone }: PrescriptionsTabProps) {
  const { data: prescriptions, isLoading, isError } = usePrescriptions(patientId);
  const { data: catalog } = usePrescriptionCatalog(patientId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);

  const handleOpenCreate = () => {
    setEditingRx(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (rx: Prescription) => {
    setEditingRx(rx);
    setModalOpen(true);
  };

  const activeRx = prescriptions?.find((p) => p.status === 'ACTIVE');
  const pastPrescriptions = prescriptions?.filter((p) => p.id !== activeRx?.id) ?? [];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 20px' }}>
      <PrescriptionsTabHeader onNew={handleOpenCreate} />

      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-muted)' }}>
          Carregando prescrições do paciente...
        </div>
      ) : isError ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--coral)' }}>
          Erro ao carregar prescrições. Tente novamente mais tarde.
        </div>
      ) : !prescriptions || prescriptions.length === 0 ? (
        <PrescriptionsEmptyState onNew={handleOpenCreate} />
      ) : (
        <>
          {activeRx && (
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--fg-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  letterSpacing: '0.05em',
                }}
              >
                Prescrição Atual (Em Andamento)
              </div>
              <PrescriptionCard
                prescription={activeRx}
                patientId={patientId}
                patientPhone={patientPhone}
                onEdit={handleOpenEdit}
                isActive={true}
              />
            </div>
          )}

          {pastPrescriptions.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--fg-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  letterSpacing: '0.05em',
                }}
              >
                Histórico de Prescrições Anteriores ({pastPrescriptions.length})
              </div>
              {pastPrescriptions.map((rx) => (
                <PrescriptionCard
                  key={rx.id}
                  prescription={rx}
                  patientId={patientId}
                  patientPhone={patientPhone}
                  onEdit={handleOpenEdit}
                  isActive={false}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <PrescriptionEditorModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          patientId={patientId}
          initialPrescription={editingRx}
          catalog={catalog ?? []}
        />
      )}
    </div>
  );
}
