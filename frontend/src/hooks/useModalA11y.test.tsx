import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRef } from 'react';
import { useModalA11y } from './useModalA11y';

function TestModal({
  open,
  onClose,
  closeOnEscape,
}: {
  open: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ open, onClose, containerRef, closeOnEscape });

  if (!open) return null;

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      <input data-testid="input-1" placeholder="First" />
      <button data-testid="btn-action">Action</button>
      <button data-testid="btn-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

describe('useModalA11y', () => {
  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<TestModal open={true} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when closeOnEscape is false', () => {
    const handleClose = vi.fn();
    render(<TestModal open={true} onClose={handleClose} closeOnEscape={false} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('locks body scroll when modal is open and restores on unmount', () => {
    const handleClose = vi.fn();
    const { unmount } = render(<TestModal open={true} onClose={handleClose} />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('cycles focus within modal on Tab navigation', () => {
    const handleClose = vi.fn();
    render(<TestModal open={true} onClose={handleClose} />);

    const input = screen.getByTestId('input-1');
    const closeBtn = screen.getByTestId('btn-close');

    // Focus last element and press Tab -> should wrap to first element
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(input);

    // Focus first element and press Shift+Tab -> should wrap to last element
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(closeBtn);
  });
});
