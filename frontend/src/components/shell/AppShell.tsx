import { useEffect, Suspense } from 'react';
import { Rail } from './Rail';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet, useLocation } from 'react-router';
import { useRouteSync } from '../../hooks/useRouteSync';
import { useNavigationStore } from '../../stores/navigationStore';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { PageFallback } from '../ui/PageFallback';

export function AppShell() {
  useRouteSync();
  const location = useLocation();
  const setSidebarOpen = useNavigationStore((s) => s.setSidebarOpen);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1200px)');
    const syncSidebar = (event: MediaQueryList | MediaQueryListEvent) => {
      setSidebarOpen(!event.matches);
    };

    syncSidebar(mediaQuery);
    mediaQuery.addEventListener('change', syncSidebar);
    return () => mediaQuery.removeEventListener('change', syncSidebar);
  }, [setSidebarOpen]);

  return (
    <div className="app">
      <Rail />
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="page">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
