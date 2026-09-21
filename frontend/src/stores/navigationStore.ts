import { create } from 'zustand';

export type ViewType = 'home' | 'patients' | 'patient' | 'foods' | 'insights';
type StatusFilter = 'all' | 'ontrack' | 'warning' | 'danger';

interface NavigationState {
  activeView: ViewType;
  activePatientId: string | null;
  sidebarOpen: boolean;
  statusFilter: StatusFilter;
  setView: (view: ViewType) => void;
  setActivePatientId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setStatusFilter: (filter: StatusFilter) => void;
}

function getInitialView(): ViewType {
  const stored = localStorage.getItem('compas.view') || localStorage.getItem('nutriai.view');
  if (
    stored === 'home' ||
    stored === 'patients' ||
    stored === 'patient' ||
    stored === 'foods' ||
    stored === 'insights'
  )
    return stored;
  return 'home';
}

function getInitialPatientId(): string | null {
  return localStorage.getItem('compas.patient') || localStorage.getItem('nutriai.patient') || null;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeView: getInitialView(),
  activePatientId: getInitialPatientId(),
  sidebarOpen:
    typeof window !== 'undefined' ? !window.matchMedia('(max-width: 1200px)').matches : true,
  statusFilter: 'all' as StatusFilter,
  setView: (view) => {
    localStorage.setItem('compas.view', view);
    localStorage.removeItem('nutriai.view');
    set({ activeView: view });
  },
  setActivePatientId: (id) => {
    if (id) {
      localStorage.setItem('compas.patient', id);
      localStorage.removeItem('nutriai.patient');
    } else {
      localStorage.removeItem('compas.patient');
      localStorage.removeItem('nutriai.patient');
    }
    set({ activePatientId: id });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
}));
