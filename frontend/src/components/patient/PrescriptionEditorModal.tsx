import { useState, useRef, useEffect } from 'react';
import type {
  Prescription,
  PrescriptionCatalogItem,
  PrescriptionItemInput,
  PrescriptionStatus,
} from '../../types/prescription';
import { useCreatePrescription, useUpdatePrescription } from '../../stores/prescriptionStore';
import { useToastStore } from '../../stores/toastStore';
import { useModalA11y } from '../../hooks/useModalA11y';
import { PrescriptionEditorFormBody } from './PrescriptionEditorFormBody';

interface PrescriptionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  initialPrescription?: Prescription | null;
  catalog: PrescriptionCatalogItem[];
}

const DEFAULT_ITEM: PrescriptionItemInput = {
  name: '',
  category: 'SUPPLEMENT',
  dosage: '',
  form: 'Pó',
  timing: '',
  duration: 'Uso contínuo',
  isContinuous: true,
  instructions: '',
};

function PrescriptionEditorHeader({
  isEditing,
  onClose,
}: {
  isEditing: boolean;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h3
          id="modal-title"
          style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--ink)' }}
        >
          {isEditing ? 'Editar Prescrição' : 'Nova Prescrição & Suplementação'}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '2px 0 0' }}>
          Prescreva suplementos, vitaminas e fitoterápicos com posologia precisa.
        </p>
      </div>
      <button type="button" className="btn btn-subtle" onClick={onClose} style={{ fontSize: 16 }}>
        ✕
      </button>
    </div>
  );
}

function PrescriptionEditorFooter({
  onClose,
  isSaving,
}: {
  onClose: () => void;
  isSaving: boolean;
}) {
  return (
    <div
      style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 10,
        backgroundColor: 'var(--paper-2)',
      }}
    >
      <button type="button" className="btn btn-subtle" onClick={onClose} disabled={isSaving}>
        Cancelar
      </button>
      <button type="submit" className="btn btn-primary" disabled={isSaving}>
        {isSaving ? 'Salvando...' : 'Salvar Prescrição'}
      </button>
    </div>
  );
}

function getInitialItems(initialPrescription?: Prescription | null): PrescriptionItemInput[] {
  if (initialPrescription && initialPrescription.items.length > 0) {
    return initialPrescription.items.map((it) => ({
      name: it.name,
      category: it.category,
      dosage: it.dosage,
      form: it.form,
      timing: it.timing,
      duration: it.duration,
      isContinuous: it.isContinuous,
      instructions: it.instructions ?? '',
      displayOrder: it.displayOrder,
    }));
  }
  return [{ ...DEFAULT_ITEM }];
}

export function PrescriptionEditorModal({
  isOpen,
  onClose,
  patientId,
  initialPrescription,
  catalog,
}: PrescriptionEditorModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const showToastError = useToastStore((s) => s.showError);
  const createMutation = useCreatePrescription(patientId);
  const updateMutation = useUpdatePrescription(patientId);

  const [title, setTitle] = useState(initialPrescription?.title ?? 'Prescrição & Suplementação');
  const [notes, setNotes] = useState(initialPrescription?.notes ?? '');
  const [status, setStatus] = useState<PrescriptionStatus>(initialPrescription?.status ?? 'ACTIVE');
  const [items, setItems] = useState<PrescriptionItemInput[]>(() =>
    getInitialItems(initialPrescription),
  );
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialPrescription?.title ?? 'Prescrição & Suplementação');
      setNotes(initialPrescription?.notes ?? '');
      setStatus(initialPrescription?.status ?? 'ACTIVE');
      setItems(getInitialItems(initialPrescription));
      setShowCatalog(false);
    }
  }, [isOpen, initialPrescription]);

  if (!isOpen) return null;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(
      (it) => it.name.trim() !== '' && it.dosage.trim() !== '' && it.timing.trim() !== '',
    );
    if (validItems.length === 0) {
      showToastError('Adicione pelo menos um item completo com nome, dosagem e horário.');
      return;
    }

    if (initialPrescription) {
      updateMutation.mutate(
        {
          prescriptionId: initialPrescription.id,
          data: { title, notes, status, items: validItems },
        },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate({ title, notes, status, items: validItems }, { onSuccess: onClose });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="card"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--paper)',
          borderRadius: 8,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <PrescriptionEditorHeader isEditing={!!initialPrescription} onClose={onClose} />

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <PrescriptionEditorFormBody
            title={title}
            setTitle={setTitle}
            status={status}
            setStatus={setStatus}
            showCatalog={showCatalog}
            setShowCatalog={setShowCatalog}
            catalog={catalog}
            items={items}
            onAddItem={(preset) =>
              setItems((prev) => [...prev, preset ? { ...preset } : { ...DEFAULT_ITEM }])
            }
            onItemChange={(idx, updated) =>
              setItems((prev) => prev.map((item, i) => (i === idx ? updated : item)))
            }
            onRemoveItem={(idx) =>
              items.length > 1 && setItems((prev) => prev.filter((_, i) => i !== idx))
            }
            notes={notes}
            setNotes={setNotes}
          />

          <PrescriptionEditorFooter onClose={onClose} isSaving={isSaving} />
        </form>
      </div>
    </div>
  );
}
