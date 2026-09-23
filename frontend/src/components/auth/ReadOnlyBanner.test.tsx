import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import { useAuthStore } from '../../stores/authStore';

describe('ReadOnlyBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isReadOnlyModalOpen: false,
    });
  });

  it('does not render when user is null', () => {
    const { container } = render(<ReadOnlyBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when user readOnly is false or undefined', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'Dra. Ana',
        email: 'ana@example.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        readOnly: false,
      },
    });

    const { container } = render(<ReadOnlyBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders banner when user has readOnly: true', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'Dra. Ana',
        email: 'ana@example.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        readOnly: true,
      },
    });

    render(<ReadOnlyBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Modo Leitura ativo:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Saiba mais \/ Reativar/i })).toBeInTheDocument();
  });

  it('calls openReadOnlyModal when clicking Saiba mais / Reativar', () => {
    const openModalSpy = vi.fn();
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'Dra. Ana',
        email: 'ana@example.com',
        role: 'NUTRITIONIST',
        onboardingCompleted: true,
        readOnly: true,
      },
      openReadOnlyModal: openModalSpy,
    });

    render(<ReadOnlyBanner />);

    const button = screen.getByRole('button', { name: /Saiba mais \/ Reativar/i });
    fireEvent.click(button);

    expect(openModalSpy).toHaveBeenCalledTimes(1);
  });
});
