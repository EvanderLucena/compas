import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useNavigationStore } from '../stores/navigationStore';

const PATH_TO_VIEW: Record<string, string> = {
  '/home': 'home',
  '/patients': 'patients',
  '/foods': 'foods',
  '/insights': 'insights',
  '/admin/whatsapp': 'admin-whatsapp',
};

export function useRouteSync() {
  const location = useLocation();
  const { setView, setActivePatientId } = useNavigationStore();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/patient/')) {
      const id = path.split('/')[2];
      if (id) {
        setActivePatientId(id);
        setView('patient');
      }
    } else if (PATH_TO_VIEW[path]) {
      setView(PATH_TO_VIEW[path] as 'home' | 'patients' | 'foods' | 'insights');
    }
  }, [location.pathname, setView, setActivePatientId]);
}
