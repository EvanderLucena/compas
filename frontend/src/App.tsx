import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './stores/authStore';
import { usePublicTheme } from './hooks/usePublicTheme';
import { AppShell } from './components/shell/AppShell';
import { Toast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageFallback } from './components/ui/PageFallback';
import type { ReactNode } from 'react';

const LandingView = lazy(() =>
  import('./views/LandingView').then((m) => ({ default: m.LandingView })),
);
const LoginView = lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const SignupView = lazy(() =>
  import('./views/SignupView').then((m) => ({ default: m.SignupView })),
);
const OnboardingView = lazy(() =>
  import('./views/OnboardingView').then((m) => ({ default: m.OnboardingView })),
);
const HomeView = lazy(() => import('./views/HomeView').then((m) => ({ default: m.HomeView })));
const PatientsView = lazy(() =>
  import('./views/PatientsView').then((m) => ({ default: m.PatientsView })),
);
const PatientView = lazy(() =>
  import('./views/PatientView').then((m) => ({ default: m.PatientView })),
);
const FoodsView = lazy(() => import('./views/FoodsView').then((m) => ({ default: m.FoodsView })));
const InsightsView = lazy(() =>
  import('./views/InsightsView').then((m) => ({ default: m.InsightsView })),
);
const VerifyEmailView = lazy(() =>
  import('./views/VerifyEmailView').then((m) => ({ default: m.VerifyEmailView })),
);

function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (isInitializing) return null;

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const user = useAuthStore((s) => s.user);

  if (isInitializing) return null;

  if (isAuthenticated && user) {
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

function InitializeAuth() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  return null;
}

function LogoutView() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    void logout().finally(() => navigate('/', { replace: true }));
  }, [logout, navigate]);

  return null;
}

function RootLayout() {
  const location = useLocation();
  usePublicTheme();

  return (
    <ErrorBoundary key={location.pathname}>
      <InitializeAuth />
      <Suspense fallback={<PageFallback fullScreen />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: (
          <RedirectIfAuthenticated>
            <LandingView />
          </RedirectIfAuthenticated>
        ),
      },
      {
        path: '/login',
        element: (
          <RedirectIfAuthenticated>
            <LoginView />
          </RedirectIfAuthenticated>
        ),
      },
      {
        path: '/signup',
        element: (
          <RedirectIfAuthenticated>
            <SignupView />
          </RedirectIfAuthenticated>
        ),
      },
      { path: '/logout', element: <LogoutView /> },
      { path: '/verify-email', element: <VerifyEmailView /> },
      {
        path: '/onboarding',
        element: (
          <AuthGuard>
            <OnboardingView />
          </AuthGuard>
        ),
      },
      {
        element: (
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        ),
        children: [
          { path: '/home', element: <HomeView /> },
          { path: '/patients', element: <PatientsView /> },
          { path: '/patient/:id', element: <PatientView /> },
          { path: '/plans', element: <Navigate to="/patients" replace /> },
          { path: '/foods', element: <FoodsView /> },
          { path: '/insights', element: <InsightsView /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toast />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      staleTime: 2 * 60_000,
    },
  },
});
