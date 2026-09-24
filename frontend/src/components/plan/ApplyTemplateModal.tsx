import { useRef } from 'react';
import { IconBookmark, IconX } from '../icons';
import { useModalA11y } from '../../hooks/useModalA11y';
import { TemplatePreviewSection } from './TemplatePreviewSection';
import { TemplateListSection } from './TemplateListSection';
import { TemplateDeleteConfirmModal } from './TemplateDeleteConfirmModal';
import { TemplateFiltersBar } from './TemplateFiltersBar';
import { TemplateModalFooter } from './TemplateModalFooter';
import { useApplyTemplateState } from './useApplyTemplateState';

interface ApplyTemplateModalProps {
  patientId: string;
  onClose: () => void;
  isReadOnly?: boolean;
  onReadOnlyClick?: () => void;
}

export function ApplyTemplateModal({
  patientId,
  onClose,
  isReadOnly = false,
  onReadOnlyClick,
}: ApplyTemplateModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  const state = useApplyTemplateState(patientId, isReadOnly, onReadOnlyClick);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.5)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-template-title"
        tabIndex={-1}
        className="card outline-none"
        style={{
          width: 'min(940px, 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h" style={{ flexShrink: 0 }}>
          <div
            id="apply-template-title"
            className="title"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <IconBookmark size={16} /> Modelos de Plano Alimentar
          </div>
          <div className="spacer" />
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 6px' }}
            aria-label="Fechar"
          >
            <IconX size={14} />
          </button>
        </div>

        <TemplateFiltersBar
          typeFilter={state.typeFilter}
          categoryFilter={state.categoryFilter}
          onTypeFilterChange={state.setTypeFilter}
          onCategoryFilterChange={state.setCategoryFilter}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <TemplateListSection
            templates={state.filteredTemplates}
            activeTemplateId={state.activeTemplate?.id ?? null}
            isLoading={state.isLoading}
            onSelect={(tmpl) => {
              state.setSelectedTemplateId(tmpl.id);
              state.setConfirmApply(false);
            }}
            onDelete={(tmpl, e) => {
              e.stopPropagation();
              if (isReadOnly) {
                onReadOnlyClick?.();
                return;
              }
              state.setTemplateToDelete(tmpl);
            }}
          />
          <TemplatePreviewSection template={state.activeTemplate} />
        </div>

        <TemplateModalFooter
          confirmApply={state.confirmApply}
          activeTemplate={state.activeTemplate}
          isApplying={state.isApplying}
          onCancelConfirm={() => state.setConfirmApply(false)}
          onClose={onClose}
          onApply={state.handleApply}
        />
      </div>

      {state.templateToDelete && (
        <TemplateDeleteConfirmModal
          template={state.templateToDelete}
          isPending={state.isDeleting}
          onClose={() => state.setTemplateToDelete(null)}
          onConfirm={state.confirmDelete}
        />
      )}
    </div>
  );
}
