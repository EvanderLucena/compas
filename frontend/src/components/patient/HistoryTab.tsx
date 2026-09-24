import { useState, useMemo } from 'react';
import { usePatientTimeline } from '../../stores/clinicalStore';
import type { TimelineCategory } from '../../types/timeline';
import { HistoryFilterBar } from './history/HistoryFilterBar';
import { HistoryTimelineFeed } from './history/HistoryTimelineFeed';
import { HistoryCyclesView } from './history/HistoryCyclesView';
import { AddTimelineNoteModal } from './history/AddTimelineNoteModal';
import { matchesCategory, computeCategoryCounts } from './history/historyHelpers';

interface HistoryTabProps {
  patientId: string;
}

export function HistoryTab({ patientId }: HistoryTabProps) {
  const { data: timelineData, isLoading, isError, refetch } = usePatientTimeline(patientId);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'cycles'>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TimelineCategory>('ALL');
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  const allEvents = useMemo(() => timelineData ?? [], [timelineData]);

  const counts = useMemo(() => computeCategoryCounts(allEvents), [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (!matchesCategory(ev.eventType, selectedCategory)) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = ev.title?.toLowerCase().includes(query);
        const descMatch = ev.description?.toLowerCase().includes(query);
        const episodeMatch = ev.episodeTitle?.toLowerCase().includes(query);
        return Boolean(titleMatch || descMatch || episodeMatch);
      }
      return true;
    });
  }, [allEvents, selectedCategory, searchTerm]);

  if (isLoading) {
    return (
      <div style={{ padding: '32px 28px', textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 13.5 }}>Carregando histórico clínico...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '32px 28px', textAlign: 'center' }}>
        <p style={{ color: 'var(--coral)', fontSize: 14, marginBottom: 12 }}>
          Erro ao carregar histórico do paciente.
        </p>
        <button type="button" className="btn btn-secondary" onClick={() => void refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 960 }}>
      {/* Subtab Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 14,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={activeSubTab === 'timeline' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveSubTab('timeline')}
            style={{ fontSize: 12.5, height: 34, padding: '0 14px' }}
          >
            Linha do Tempo ({allEvents.length})
          </button>
          <button
            type="button"
            className={activeSubTab === 'cycles' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveSubTab('cycles')}
            style={{ fontSize: 12.5, height: 34, padding: '0 14px' }}
          >
            Ciclos de Acompanhamento
          </button>
        </div>

        <div className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
          Total: <strong>{allEvents.length}</strong> eventos
        </div>
      </div>

      {activeSubTab === 'timeline' ? (
        <>
          <HistoryFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={counts}
            onOpenAddNote={() => setAddNoteOpen(true)}
          />

          <HistoryTimelineFeed events={filteredEvents} />
        </>
      ) : (
        <HistoryCyclesView patientId={patientId} />
      )}

      {addNoteOpen && (
        <AddTimelineNoteModal
          patientId={patientId}
          isOpen={addNoteOpen}
          onClose={() => setAddNoteOpen(false)}
        />
      )}
    </div>
  );
}
