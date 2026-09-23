import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { IconX } from '../icons';

interface FoodModalWrapperProps {
  title: string;
  titleId?: string;
  ariaLabel?: string;
  onClose: () => void;
  children: ReactNode;
}

export function FoodModalWrapper({
  title,
  titleId,
  ariaLabel,
  onClose,
  children,
}: FoodModalWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useModalA11y({ onClose, containerRef });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.4)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card outline-none"
        style={{
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div id={titleId} className="title">
            {title}
          </div>
          <div className="spacer" />
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 6px' }}
          >
            <IconX size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
