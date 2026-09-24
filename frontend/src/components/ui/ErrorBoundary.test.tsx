import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function ProblematicComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Erro de teste proposital');
  }
  return <div>Conteúdo normal</div>;
}

describe('ErrorBoundary', () => {
  // Silence console.error from intentional error boundary throw
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  it('renders fallback UI when an error is thrown', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
    expect(screen.getByText(/Voltar/)).toBeInTheDocument();
  });

  it('allows resetting error state with Tentar novamente button', () => {
    let shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // Fix the condition and click Tentar novamente
    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Tentar novamente'));
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  it('resets automatically when key changes (e.g. on route navigation)', () => {
    let shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary key="/route-a">
        <ProblematicComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // Navigate to route-b where component doesn't throw
    shouldThrow = false;
    rerender(
      <ErrorBoundary key="/route-b">
        <ProblematicComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  it('calls custom onError handler when provided', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});
