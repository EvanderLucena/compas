import { useState } from 'react';
import { useAddTimelineNote } from '../../../stores/clinicalStore';
import { useToastStore } from '../../../stores/toastStore';

interface TimelineNoteFormProps {
  patientId: string;
  onClose: () => void;
}

function getInitialLocalDateTime(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function TimelineNoteForm({ patientId, onClose }: TimelineNoteFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getInitialLocalDateTime);
  const addNoteMutation = useAddTimelineNote(patientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      useToastStore.getState().showError('Por favor informe o título da anotação.');
      return;
    }

    addNoteMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        eventAt: date ? new Date(date).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Anotação registrada com sucesso no histórico!');
          onClose();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '18px 20px' }}>
      <div style={{ marginBottom: 14 }}>
        <label
          htmlFor="timeline-note-title"
          style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5 }}
        >
          Título / Assunto *
        </label>
        <input
          id="timeline-note-title"
          type="text"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Consulta de Retorno, Paciente relatou viagem, etc."
          maxLength={200}
          required
          autoFocus
          style={{ width: '100%', fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          htmlFor="timeline-note-date"
          style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5 }}
        >
          Data e Hora
        </label>
        <input
          id="timeline-note-date"
          type="datetime-local"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: '100%', fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          htmlFor="timeline-note-desc"
          style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5 }}
        >
          Observações / Detalhes
        </label>
        <textarea
          id="timeline-note-desc"
          className="input"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva observações clínicas, orientações passadas ao paciente, etc."
          maxLength={2000}
          style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={addNoteMutation.isPending}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={addNoteMutation.isPending}>
          {addNoteMutation.isPending ? 'Salvando...' : 'Salvar no Histórico'}
        </button>
      </div>
    </form>
  );
}
