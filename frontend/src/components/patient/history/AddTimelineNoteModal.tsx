import { TimelineNoteForm } from './TimelineNoteForm';

interface AddTimelineNoteModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTimelineNoteModal({ patientId, isOpen, onClose }: AddTimelineNoteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--surface, #ffffff)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>Nova Anotação Clínica</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--fg-subtle)',
            }}
          >
            ✕
          </button>
        </div>

        <TimelineNoteForm patientId={patientId} onClose={onClose} />
      </div>
    </div>
  );
}
