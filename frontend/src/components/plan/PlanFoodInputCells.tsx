import { useState, useEffect, useRef } from 'react';
import { sanitizeNumberInput, parseNumberInput } from '../../utils/numberInput';

interface EditableCellProps {
  value: string | number;
  color: string;
  isNum: boolean;
  onChange: (val: string) => void;
  testId?: string;
  isReadOnly?: boolean;
  onReadOnlyClick?: () => void;
}

export function EditableCell({
  value,
  color,
  isNum,
  onChange,
  testId,
  isReadOnly,
  onReadOnlyClick,
}: EditableCellProps) {
  const [local, setLocal] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current !== document.activeElement) {
      setLocal(String(value));
    }
  }, [value]);

  return (
    <input
      data-testid={testId}
      ref={ref}
      readOnly={isReadOnly}
      value={local}
      onClick={() => {
        if (isReadOnly) onReadOnlyClick?.();
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => {
        e.target.style.borderColor = 'transparent';
        e.target.style.background = 'transparent';
        const synced = String(value);
        if (e.target.value !== synced) onChange(e.target.value);
        else setLocal(synced);
      }}
      onFocus={(e) => {
        if (isReadOnly) {
          e.target.blur();
          onReadOnlyClick?.();
          return;
        }
        e.target.style.borderColor = 'var(--border)';
        e.target.style.background = 'var(--surface)';
      }}
      style={{
        padding: '5px 7px',
        border: '1px solid transparent',
        borderRadius: 5,
        fontSize: 12.5,
        background: 'transparent',
        outline: 'none',
        color,
        width: '100%',
        fontFamily: isNum ? 'var(--font-mono)' : 'var(--font-ui)',
        textAlign: isNum ? 'right' : 'left',
      }}
    />
  );
}

interface RefInputProps {
  value: number;
  onBlur: (newRef: number) => void;
  testId?: string;
  isReadOnly?: boolean;
  onReadOnlyClick?: () => void;
}

export function RefInput({ value, onBlur, testId, isReadOnly, onReadOnlyClick }: RefInputProps) {
  const [localRef, setLocalRef] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current !== document.activeElement) {
      setLocalRef(String(value));
    }
  }, [value]);

  return (
    <input
      data-testid={testId}
      ref={ref}
      readOnly={isReadOnly}
      inputMode="numeric"
      pattern="[0-9.,]*"
      value={localRef}
      onClick={() => {
        if (isReadOnly) onReadOnlyClick?.();
      }}
      onChange={(e) => setLocalRef(sanitizeNumberInput(e.target.value))}
      onBlur={() => {
        if (!ref.current) return;
        ref.current.style.borderColor = 'transparent';
        ref.current.style.background = 'transparent';
        onBlur(parseNumberInput(localRef));
      }}
      onKeyDown={(e) => {
        if (e.key.length === 1 && !/[0-9.,]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      }}
      onFocus={(e) => {
        if (isReadOnly) {
          e.target.blur();
          onReadOnlyClick?.();
          return;
        }
        e.target.style.borderColor = 'var(--border)';
        e.target.style.background = 'var(--surface)';
      }}
      style={{
        padding: '5px 7px',
        border: '1px solid transparent',
        borderRadius: 5,
        fontSize: 12.5,
        background: 'transparent',
        outline: 'none',
        color: 'var(--fg)',
        width: '100%',
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
      }}
    />
  );
}
