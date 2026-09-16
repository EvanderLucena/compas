import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { useModalA11y } from './useModalA11y';

function TestModal({
  open,
  onClose,
  closeOnEscape,
  hiddenLast,
}: {
  open: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  hiddenLast?: boolean;
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
      {hiddenLast && (
        <button data-testid="btn-hidden" style={{ display: 'none' }}>
          Hidden
        </button>
      )}
    </div>
  );
}

function RerenderContainer() {
  const [, setCount] = useState(0);
  return (
    <div>
      <button data-testid="re-render-trigger" onClick={() => setCount((c) => c + 1)}>
        Re-render
      </button>
      <TestModal open={true} onClose={() => {}} />
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

  it('skips elements with display: none from Tab trap cycle', () => {
    render(<TestModal open={true} onClose={vi.fn()} hiddenLast={true} />);

    const input = screen.getByTestId('input-1');
    const closeBtn = screen.getByTestId('btn-close');

    // btn-close should be treated as last focusable element because btn-hidden has display: none
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(input);
  });

  it('does not jump focus or reset body scroll when parent re-renders with new onClose', () => {
    render(<RerenderContainer />);

    const actionBtn = screen.getByTestId('btn-action');
    actionBtn.focus();
    expect(document.activeElement).toBe(actionBtn);

    const reRenderBtn = screen.getByTestId('re-render-trigger');
    fireEvent.click(reRenderBtn);

    // Focus must stay on actionBtn instead of jumping
    expect(document.activeElement).toBe(actionBtn);
    expect(document.body.style.overflow).toBe('hidden');
  });
});
