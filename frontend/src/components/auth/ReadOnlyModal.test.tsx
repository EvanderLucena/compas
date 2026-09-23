import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadOnlyModal } from './ReadOnlyModal';

describe('ReadOnlyModal', () => {
  it('does not render content when open is false', () => {
    const handleClose = vi.fn();
    render(<ReadOnlyModal open={false} onClose={handleClose} />);

    expect(screen.queryByText(/Modo Leitura — Consulta Preservada/i)).not.toBeInTheDocument();
  });

  it('renders title and informative sections when open is true', () => {
    const handleClose = vi.fn();
    render(<ReadOnlyModal open={true} onClose={handleClose} />);

    expect(screen.getByText(/Modo Leitura — Consulta Preservada/i)).toBeInTheDocument();
    expect(screen.getByText(/Consulta perpétua garantida/i)).toBeInTheDocument();
    expect(screen.getByText(/Novas edições temporariamente pausadas/i)).toBeInTheDocument();
    expect(screen.getByText(/Atendimento no WhatsApp com pausa acolhedora/i)).toBeInTheDocument();
  });

  it('calls onClose when clicking Continuar em modo leitura', () => {
    const handleClose = vi.fn();
    render(<ReadOnlyModal open={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /Continuar em modo leitura/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onReactivate and onClose when clicking Reativar assinatura', () => {
    const handleClose = vi.fn();
    const handleReactivate = vi.fn();
    render(<ReadOnlyModal open={true} onClose={handleClose} onReactivate={handleReactivate} />);

    const reactivateBtn = screen.getByRole('button', { name: /Reativar assinatura/i });
    fireEvent.click(reactivateBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleReactivate).toHaveBeenCalledTimes(1);
  });

  it('dispatches compas:open-profile event if no onReactivate is provided', () => {
    const handleClose = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<ReadOnlyModal open={true} onClose={handleClose} />);

    const reactivateBtn = screen.getByRole('button', { name: /Reativar assinatura/i });
    fireEvent.click(reactivateBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'compas:open-profile',
      }),
    );

    dispatchSpy.mockRestore();
  });
});
