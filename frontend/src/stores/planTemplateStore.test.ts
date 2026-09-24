import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlanTemplateUIStore } from './planTemplateStore';

vi.mock('../api/planTemplates', () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  createTemplate: vi.fn(),
  savePlanAsTemplate: vi.fn(),
  applyTemplateToPatient: vi.fn(),
  deleteTemplate: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  })),
}));

describe('usePlanTemplateUIStore', () => {
  beforeEach(() => {
    usePlanTemplateUIStore.setState({
      applyModalOpen: false,
      saveModalOpen: false,
      selectedTemplateId: null,
      categoryFilter: 'ALL',
      typeFilter: 'all',
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = usePlanTemplateUIStore.getState();
      expect(state.applyModalOpen).toBe(false);
      expect(state.saveModalOpen).toBe(false);
      expect(state.selectedTemplateId).toBeNull();
      expect(state.categoryFilter).toBe('ALL');
      expect(state.typeFilter).toBe('all');
    });
  });

  describe('modal state mutations', () => {
    it('toggles apply modal open and closed', () => {
      usePlanTemplateUIStore.getState().setApplyModalOpen(true);
      expect(usePlanTemplateUIStore.getState().applyModalOpen).toBe(true);

      usePlanTemplateUIStore.getState().setApplyModalOpen(false);
      expect(usePlanTemplateUIStore.getState().applyModalOpen).toBe(false);
    });

    it('toggles save modal open and closed', () => {
      usePlanTemplateUIStore.getState().setSaveModalOpen(true);
      expect(usePlanTemplateUIStore.getState().saveModalOpen).toBe(true);

      usePlanTemplateUIStore.getState().setSaveModalOpen(false);
      expect(usePlanTemplateUIStore.getState().saveModalOpen).toBe(false);
    });

    it('updates selected template id', () => {
      usePlanTemplateUIStore.getState().setSelectedTemplateId('tmpl-123');
      expect(usePlanTemplateUIStore.getState().selectedTemplateId).toBe('tmpl-123');

      usePlanTemplateUIStore.getState().setSelectedTemplateId(null);
      expect(usePlanTemplateUIStore.getState().selectedTemplateId).toBeNull();
    });
  });

  describe('filters', () => {
    it('updates category filter', () => {
      usePlanTemplateUIStore.getState().setCategoryFilter('HIPERTROFIA');
      expect(usePlanTemplateUIStore.getState().categoryFilter).toBe('HIPERTROFIA');
    });

    it('updates type filter', () => {
      usePlanTemplateUIStore.getState().setTypeFilter('system');
      expect(usePlanTemplateUIStore.getState().typeFilter).toBe('system');

      usePlanTemplateUIStore.getState().setTypeFilter('custom');
      expect(usePlanTemplateUIStore.getState().typeFilter).toBe('custom');
    });
  });
});
