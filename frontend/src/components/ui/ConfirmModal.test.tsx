import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="Excluir Item"
        description="Tem certeza?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByText('Excluir Item')).toBeNull();
  });

  it('renders title, description and default button labels when open', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Excluir Prescrição"
        description="Esta ação não pode ser desfeita."
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Excluir Prescrição')).toBeDefined();
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeDefined();
    expect(screen.getByText('Cancelar')).toBeDefined();
    expect(screen.getByText('Confirmar')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar Operação"
        description="Deseja prosseguir?"
        confirmLabel="Sim, excluir"
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    const confirmBtn = screen.getByText('Sim, excluir');
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar Operação"
        description="Deseja prosseguir?"
        onClose={handleClose}
        onConfirm={vi.fn()}
      />,
    );

    const cancelBtn = screen.getByText('Cancelar');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking on the backdrop overlay', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar"
        description="Clique fora para fechar"
        onClose={handleClose}
        onConfirm={vi.fn()}
      />,
    );

    const overlay = screen.getByTestId('confirm-modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog card', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar"
        description="Clique no card"
        onClose={handleClose}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = screen.getByTestId('confirm-modal-dialog');
    fireEvent.click(dialog);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('disables buttons when isPending is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Excluindo..."
        description="Aguarde"
        isPending={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const cancelBtn = screen.getByText('Cancelar') as HTMLButtonElement;
    const confirmBtn = screen.getByText('Processando...') as HTMLButtonElement;

    expect(cancelBtn.disabled).toBe(true);
    expect(confirmBtn.disabled).toBe(true);
  });

  it('does not call onClose when clicking on the backdrop overlay if isPending is true', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar"
        description="Aguarde..."
        isPending={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />,
    );

    const overlay = screen.getByTestId('confirm-modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
