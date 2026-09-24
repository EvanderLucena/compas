import { Component, type ReactNode, type ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // Log uncaught errors for diagnostics
    if (typeof console !== 'undefined' && console.error) {
      console.error('Uncaught error in component tree:', error, errorInfo);
    }
  }

  public reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      const error = this.state.error || new Error('Erro desconhecido');

      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(error, this.reset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="flex min-h-[320px] w-full flex-col items-center justify-center p-6 text-center"
        >
          <div className="card w-full max-w-md p-6 shadow-lg border border-border bg-surface">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="font-serif text-xl text-fg mb-2">Algo deu errado</h2>
            <p className="text-sm text-fg-muted mb-6">
              Ocorreu um erro inesperado ao renderizar esta área do painel.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.reset}
                className="btn btn-primary text-sm px-4 py-2 cursor-pointer"
              >
                Tentar novamente
              </button>
              <a
                href={
                  typeof window !== 'undefined' && window.location.pathname.startsWith('/patient')
                    ? '/patients'
                    : '/home'
                }
                onClick={this.reset}
                className="btn btn-secondary text-sm px-4 py-2 cursor-pointer"
              >
                {typeof window !== 'undefined' && window.location.pathname.startsWith('/patient')
                  ? 'Voltar para pacientes'
                  : 'Voltar ao início'}
              </a>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left text-xs text-fg-subtle bg-paper-2 p-3 rounded overflow-auto max-h-40">
                <summary className="cursor-pointer font-mono font-medium text-coral mb-1">
                  Detalhes do erro (dev mode)
                </summary>
                <pre className="font-mono whitespace-pre-wrap">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
