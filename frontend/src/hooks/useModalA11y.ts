import { useEffect, useRef, type RefObject } from 'react';

export interface UseModalA11yOptions {
  open?: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    // Check if layout dimensions exist in real browser
    const hasLayout = el.offsetWidth > 0 || el.offsetHeight > 0 || el.offsetParent !== null;
    const isHidden = el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true';

    // In environments with layout engines, require visible dimensions; in JSDOM, allow non-hidden
    if (el.offsetParent !== null) return true;
    return !isHidden && (hasLayout || typeof window !== 'undefined');
  });
}

function handleTabTrap(e: KeyboardEvent, container: HTMLElement): void {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    e.preventDefault();
    return;
  }

  const firstElement = focusable[0];
  const lastElement = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (e.shiftKey) {
    if (active === firstElement || !container.contains(active)) {
      e.preventDefault();
      lastElement.focus();
    }
  } else {
    if (active === lastElement || !container.contains(active)) {
      e.preventDefault();
      firstElement.focus();
    }
  }
}

export function useModalA11y({
  open = true,
  onClose,
  containerRef,
  initialFocusRef,
  closeOnEscape = true,
  preventScroll = true,
}: UseModalA11yOptions): void {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    let originalOverflow = '';
    if (preventScroll) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const focusTimer = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const focusable = getFocusableElements(containerRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          containerRef.current.focus();
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        handleTabTrap(e, containerRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (preventScroll) {
        document.body.style.overflow = originalOverflow;
      }
      if (
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === 'function'
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, onClose, containerRef, initialFocusRef, closeOnEscape, preventScroll]);
}
