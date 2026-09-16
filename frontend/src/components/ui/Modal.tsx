import { type ReactNode, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, ariaLabel, children, className }: ModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useModalA11y({ open, onClose, containerRef });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface shadow-xl outline-none',
          'animate-in fade-in zoom-in-95',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id={titleId} className="font-serif text-xl text-fg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-fg-subtle hover:text-fg transition-colors text-lg leading-none cursor-pointer"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
