import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingView } from './OnboardingView';

const mockNavigate = vi.fn();
const mockCompleteOnboarding = vi.fn();
const mockGetCurrentUser = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../api/auth', () => ({
  completeOnboarding: () => mockCompleteOnboarding(),
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('../stores/toastStore', () => ({
  useToastStore: {
    getState: () => ({
      showError: vi.fn(),
      showSuccess: vi.fn(),
    }),
  },
}));

describe('OnboardingView — Mini Tutorial Tour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompleteOnboarding.mockResolvedValue(undefined);
    mockGetCurrentUser.mockResolvedValue({
      id: 'nutri-1',
      name: 'Dra. Helena',
      email: 'helena@compas.app.br',
      role: 'NUTRITIONIST',
    });
  });

  describe('Step navigation', () => {
    it('starts at step 1 showing WhatsApp interface info', () => {
      render(<OnboardingView />);
      expect(
        screen.getByRole('heading', { name: /o whatsapp é a interface do seu paciente/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/passo 1 de 5/i)).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-next')).toBeInTheDocument();
      expect(screen.queryByTestId('onboarding-prev')).not.toBeInTheDocument();
    });

    it('advances through steps 1 to 5', () => {
      render(<OnboardingView />);

      // Step 1 -> 2
      fireEvent.click(screen.getByTestId('onboarding-next'));
      expect(
        screen.getByRole('heading', { name: /gestão inteligente da sua carteira/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/passo 2 de 5/i)).toBeInTheDocument();

      // Step 2 -> 3
      fireEvent.click(screen.getByTestId('onboarding-next'));
      expect(
        screen.getByRole('heading', { name: /planos com alimentos porcionados/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/passo 3 de 5/i)).toBeInTheDocument();

      // Step 3 -> 4
      fireEvent.click(screen.getByTestId('onboarding-next'));
      expect(
        screen.getByRole('heading', { name: /acompanhamento biométrico e evolução/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/passo 4 de 5/i)).toBeInTheDocument();

      // Step 4 -> 5
      fireEvent.click(screen.getByTestId('onboarding-next'));
      expect(
        screen.getByRole('heading', { name: /tudo pronto para começar/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/passo 5 de 5/i)).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-create-patient')).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-go-home')).toBeInTheDocument();
    });

    it('navigates backwards with previous button', () => {
      render(<OnboardingView />);

      fireEvent.click(screen.getByTestId('onboarding-next')); // to step 2
      expect(screen.getByText(/passo 2 de 5/i)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('onboarding-prev')); // back to step 1
      expect(screen.getByText(/passo 1 de 5/i)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /o whatsapp é a interface do seu paciente/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Completion and Skip actions', () => {
    it('skips tutorial and navigates to /home', async () => {
      render(<OnboardingView />);
      const skipButton = screen.getByTestId('onboarding-skip');
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('completes tutorial and navigates to /patients when create patient is clicked', async () => {
      render(<OnboardingView />);

      // Navigate to step 5
      for (let i = 1; i <= 4; i++) {
        fireEvent.click(screen.getByTestId('onboarding-next'));
      }

      const createPatientBtn = screen.getByTestId('onboarding-create-patient');
      fireEvent.click(createPatientBtn);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/patients');
      });
    });

    it('completes tutorial and navigates to /home when explore home is clicked', async () => {
      render(<OnboardingView />);

      // Navigate to step 5
      for (let i = 1; i <= 4; i++) {
        fireEvent.click(screen.getByTestId('onboarding-next'));
      }

      const goHomeBtn = screen.getByTestId('onboarding-go-home');
      fireEvent.click(goHomeBtn);

      await waitFor(() => {
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });
  });
});
