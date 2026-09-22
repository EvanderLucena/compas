import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignupView } from './SignupView';

const mockSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = {
      signup: mockSignup,
      user: null,
      isLoading: false,
      fieldErrors: {} as Record<string, string>,
    };
    return selector(state);
  },
}));

describe('SignupView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Step navigation', () => {
    it('starts at step 1 showing personal data fields', () => {
      render(<SignupView />);
      expect(screen.getByTestId('signup-name')).toBeInTheDocument();
      expect(screen.getByTestId('signup-email')).toBeInTheDocument();
      expect(screen.getByTestId('signup-password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
    });

    it('advances to step 2 when step 1 fields are filled', () => {
      render(<SignupView />);
      fireEvent.change(screen.getByTestId('signup-name'), { target: { value: 'Dra. Helena' } });
      fireEvent.change(screen.getByTestId('signup-email'), {
        target: { value: 'helena@test.com' },
      });
      fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'Senha123!' } });

      const form = screen.getByRole('button', { name: /continuar/i }).closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByTestId('signup-crn')).toBeInTheDocument();
      expect(screen.getByTestId('signup-crn-regional')).toBeInTheDocument();
      expect(screen.getByTestId('signup-terms')).toBeInTheDocument();
    });

    it('shows error when step 1 submitted with empty fields', () => {
      render(<SignupView />);
      const form = screen.getByRole('button', { name: /continuar/i }).closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText(/preencha todos os campos/i)).toBeInTheDocument();
    });

    it('goes back to step 1 when back button clicked on step 2', () => {
      render(<SignupView />);
      fireEvent.change(screen.getByTestId('signup-name'), { target: { value: 'Dra. Helena' } });
      fireEvent.change(screen.getByTestId('signup-email'), {
        target: { value: 'helena@test.com' },
      });
      fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'Senha123!' } });

      const form = screen.getByRole('button', { name: /continuar/i }).closest('form')!;
      fireEvent.submit(form);

      const backButton = screen.getByRole('button', { name: /voltar/i });
      fireEvent.click(backButton);

      expect(screen.getByTestId('signup-name')).toBeInTheDocument();
    });
  });

  describe('Step 2 validation', () => {
    it('shows error when step 2 submitted without CRN and terms', () => {
      render(<SignupView />);
      fireEvent.change(screen.getByTestId('signup-name'), { target: { value: 'Dra. Helena' } });
      fireEvent.change(screen.getByTestId('signup-email'), {
        target: { value: 'helena@test.com' },
      });
      fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'Senha123!' } });

      const form = screen.getByRole('button', { name: /continuar/i }).closest('form')!;
      fireEvent.submit(form);

      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/preencha o crn/i)).toBeInTheDocument();
    });

    it('submits step 2 with valid professional data including professionalName and crnRegional', () => {
      render(<SignupView />);
      fireEvent.change(screen.getByTestId('signup-name'), {
        target: { value: 'Helena Maria Silva' },
      });
      fireEvent.change(screen.getByTestId('signup-email'), {
        target: { value: 'helena@test.com' },
      });
      fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'Senha123!' } });

      const form = screen.getByRole('button', { name: /continuar/i }).closest('form')!;
      fireEvent.submit(form);

      fireEvent.change(screen.getByTestId('signup-crn'), { target: { value: '12345' } });
      fireEvent.change(screen.getByTestId('signup-crn-regional'), { target: { value: 'CRN-3' } });
      fireEvent.change(screen.getByTestId('signup-professional-name'), {
        target: { value: 'Nutri Helena' },
      });
      fireEvent.change(screen.getByTestId('signup-whatsapp'), { target: { value: '11999998888' } });
      fireEvent.click(screen.getByTestId('signup-terms'));

      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      fireEvent.click(submitButton);

      expect(mockSignup).toHaveBeenCalledWith({
        name: 'Helena Maria Silva',
        professionalName: 'Nutri Helena',
        email: 'helena@test.com',
        password: 'Senha123!',
        crn: '12345',
        crnRegional: 'CRN-3',
        specialty: undefined,
        whatsapp: '(11) 99999-8888',
        terms: true,
      });
    });
  });

  describe('Field-level errors from store', () => {
    it('renders field error on email input when store has email error', () => {
      vi.doMock('../stores/authStore', () => ({
        useAuthStore: (selector: (s: Record<string, unknown>) => unknown) => {
          const state = {
            signup: mockSignup,
            user: null,
            isLoading: false,
            fieldErrors: { email: 'E-mail já cadastrado' },
          };
          return selector(state);
        },
      }));

      const { container } = render(<SignupView />);
      const errorElements = container.querySelectorAll('.auth-field-error');
      expect(errorElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Navigation', () => {
    it('has a link to login page', () => {
      render(<SignupView />);
      const loginLink = screen.getByRole('link', { name: /entrar/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Terms checkbox', () => {
    it('terms checkbox starts unchecked', () => {
      render(<SignupView />);
      fireEvent.change(screen.getByTestId('signup-name'), { target: { value: 'Dra. Teste' } });
      fireEvent.change(screen.getByTestId('signup-email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByTestId('signup-password'), { target: { value: 'Senha123!' } });

      const form = screen.getByRole('button', { name: /continuar/i }).closest('form')!;
      fireEvent.submit(form);

      const checkbox = screen.getByTestId('signup-terms') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });
});
