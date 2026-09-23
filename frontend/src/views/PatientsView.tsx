import { useState, useCallback, useId, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  usePatientUIStore,
  usePatients,
  useCreatePatient,
  useDeactivatePatient,
  useReactivatePatient,
  resolveMutationErrorMessage,
} from '../stores/patientStore';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/authStore';
import { IconSearch, IconPlus, IconFilter, IconArchive } from '../components/icons';
import {
  PatientTable,
  PatientGrid,
  NewPatientModal,
  EditPatientModal,
  Pagination,
} from '../components/patients';
import { mapPatientFromApi, STATUS_LABELS, STATUS_COLORS } from '../types/patient';
import type { Patient } from '../types/patient';

function MiniStat({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div className="eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
        <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function TogglePatientModal({
  name,
  activating,
  onClose,
  onConfirm,
}: {
  name: string;
  activating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card outline-none"
        style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px' }}>
          <h3 id={titleId} style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
            {activating ? 'Reativar paciente' : 'Desativar paciente'}
          </h3>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            {activating ? (
              <>
                Deseja reativar <strong style={{ color: 'var(--fg)' }}>{name}</strong>? O paciente
                voltará a aparecer na carteira ativa.
              </>
            ) : (
              <>
                Deseja desativar <strong style={{ color: 'var(--fg)' }}>{name}</strong>? Os dados
                serão preservados e o paciente poderá ser reativado depois.
              </>
            )}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn"
              style={
                activating
                  ? { background: 'var(--sage)', color: '#fff', borderColor: 'transparent' }
                  : { background: 'var(--amber)', color: '#fff', borderColor: 'transparent' }
              }
              onClick={onConfirm}
              autoFocus
            >
              {activating ? 'Reativar' : 'Desativar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientsView() {
  const navigate = useNavigate();

  const {
    searchQuery,
    statusFilter,
    currentPage,
    newPatientModalOpen,
    editingPatientId,
    togglingPatientId,
    setSearchQuery,
    setStatusFilter,
    setCurrentPage,
    setNewPatientModalOpen,
    setEditingPatientId,
    setTogglingPatientId,
  } = usePatientUIStore();

  const { data, isLoading, isError } = usePatients();
  const createMutation = useCreatePatient();
  const deactivateMutation = useDeactivatePatient();
  const reactivateMutation = useReactivatePatient();

  const [mode, setMode] = useState<'table' | 'grid'>('table');
  const [filterOpen, setFilterOpen] = useState(false);
  const [createPatientError, setCreatePatientError] = useState<string | null>(null);

  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  const showInactive = statusFilter === 'inactive';

  const patientsList = useMemo<Patient[]>(() => data?.content.map(mapPatientFromApi) ?? [], [data]);
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const activePats = showInactive ? [] : patientsList;

  const activeFilters = !showInactive ? (statusFilter !== 'all' ? 1 : 0) : 0;

  const toggleActive = useCallback(
    (id: string) => {
      if (isReadOnly) {
        openReadOnlyModal();
        return;
      }
      setTogglingPatientId(id);
    },
    [isReadOnly, openReadOnlyModal, setTogglingPatientId],
  );

  const confirmToggle = useCallback(() => {
    if (!togglingPatientId) return;
    const patient = patientsList.find((p) => p.id === togglingPatientId);
    if (!patient) return;
    if (patient.active) {
      deactivateMutation.mutate(togglingPatientId, { onSuccess: () => setTogglingPatientId(null) });
    } else {
      reactivateMutation.mutate(togglingPatientId, { onSuccess: () => setTogglingPatientId(null) });
    }
  }, [
    togglingPatientId,
    patientsList,
    deactivateMutation,
    reactivateMutation,
    setTogglingPatientId,
  ]);

  const handleOpen = useCallback(
    (id: string) => {
      navigate(`/patient/${id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--coral)', marginBottom: 16 }}>Erro ao carregar pacientes.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: filterOpen && !showInactive ? 12 : 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="eyebrow">
            {showInactive ? 'Inativos · arquivo clínico' : 'Carteira clínica'}
          </div>
          <h1
            className="serif"
            style={{ fontSize: 34, margin: '4px 0 0', fontWeight: 400, letterSpacing: '-0.02em' }}
          >
            {isLoading
              ? '...'
              : `${totalElements} ${showInactive ? 'pacientes inativos' : 'pacientes ativos'}`}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {!showInactive && (
            <>
              <MiniStat
                label="On-track"
                value={String(activePats.filter((p) => p.status === 'ontrack').length)}
                dot="var(--sage)"
              />
              <MiniStat
                label="Atenção"
                value={String(activePats.filter((p) => p.status === 'warning').length)}
                dot="var(--amber)"
              />
              <MiniStat
                label="Crítico"
                value={String(activePats.filter((p) => p.status === 'danger').length)}
                dot="var(--coral)"
              />
              <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
            </>
          )}
          <div className="search" style={{ margin: 0, width: 200 }}>
            <IconSearch size={13} />
            <input
              placeholder="Buscar por nome…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
          {!showInactive && (
            <div className="seg" style={{ height: 30 }}>
              <button className={mode === 'table' ? 'active' : ''} onClick={() => setMode('table')}>
                Lista
              </button>
              <button className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')}>
                Cartões
              </button>
            </div>
          )}
          {!showInactive && (
            <button
              className={`btn ${filterOpen || activeFilters > 0 ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              <IconFilter size={13} /> Filtrar
            </button>
          )}
          <button
            className={`btn ${showInactive ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => {
              setStatusFilter(showInactive ? 'all' : 'inactive');
              setSearchQuery('');
              setCurrentPage(0);
            }}
            style={{ color: showInactive ? 'var(--fg)' : 'var(--fg-muted)' }}
          >
            <IconArchive size={13} />
            {showInactive ? ' Ver ativos' : ` Inativos`}
          </button>
          {!showInactive && (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (isReadOnly) {
                  openReadOnlyModal();
                  return;
                }
                setNewPatientModalOpen(true);
              }}
            >
              <IconPlus size={13} /> Novo paciente
            </button>
          )}
        </div>
      </div>

      {filterOpen && !showInactive && (
        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            padding: '16px 18px',
            marginBottom: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="eyebrow">Status</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(['all', 'ontrack', 'warning', 'danger'] as const).map((key) => {
                const label = key === 'all' ? 'Todos' : STATUS_LABELS[key];
                const color = key === 'all' ? undefined : STATUS_COLORS[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setStatusFilter(key);
                      setCurrentPage(0);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 5,
                      fontSize: 12,
                      border:
                        statusFilter === key ? '1px solid var(--fg)' : '1px solid var(--border)',
                      background: statusFilter === key ? 'var(--surface-2)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {color && (
                      <span
                        style={{ width: 6, height: 6, borderRadius: '50%', background: color }}
                      />
                    )}{' '}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
                setCurrentPage(0);
              }}
              style={{
                fontSize: 12,
                color: 'var(--fg-muted)',
                padding: '5px 0',
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      )}

      {showInactive && patientsList.length === 0 && !isLoading && (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--fg-subtle)',
          }}
        >
          Nenhum paciente inativo no momento.
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--fg-subtle)',
          }}
        >
          Carregando...
        </div>
      ) : (
        <>
          {mode === 'table' || showInactive ? (
            <PatientTable
              patients={patientsList}
              onOpen={handleOpen}
              onToggleActive={toggleActive}
            />
          ) : (
            <PatientGrid
              patients={patientsList}
              onOpen={handleOpen}
              onToggleActive={toggleActive}
            />
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <NewPatientModal
        open={newPatientModalOpen}
        onClose={() => {
          setCreatePatientError(null);
          setNewPatientModalOpen(false);
        }}
        isSubmitting={createMutation.isPending}
        errorMessage={createPatientError}
        onSave={(data) => {
          setCreatePatientError(null);
          createMutation.mutate(data, {
            onSuccess: () => {
              useToastStore.getState().showSuccess('Paciente cadastrado com sucesso');
              setCreatePatientError(null);
              setNewPatientModalOpen(false);
            },
            onError: (err) => {
              const msg = resolveMutationErrorMessage(
                err,
                'Erro ao cadastrar paciente — tente novamente',
              );
              setCreatePatientError(msg);
              useToastStore.getState().showError(msg);
            },
          });
        }}
      />
      {editingPatientId &&
        (() => {
          const patient = patientsList.find((p) => p.id === editingPatientId);
          if (!patient) return null;
          return (
            <EditPatientModal
              patient={patient}
              open={!!editingPatientId}
              onClose={() => setEditingPatientId(null)}
            />
          );
        })()}
      {togglingPatientId && (
        <TogglePatientModal
          name={patientsList.find((p) => p.id === togglingPatientId)?.name ?? ''}
          activating={!patientsList.find((p) => p.id === togglingPatientId)?.active}
          onClose={() => setTogglingPatientId(null)}
          onConfirm={confirmToggle}
        />
      )}
    </div>
  );
}
