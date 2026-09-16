import { cn } from '../../lib/utils';

export interface PageFallbackProps {
  fullScreen?: boolean;
  message?: string;
}

export function PageFallback({ fullScreen = false, message = 'Carregando...' }: PageFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center p-8 transition-opacity duration-200',
        fullScreen ? 'fixed inset-0 z-50 bg-paper' : 'min-h-[40vh] w-full',
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-lime border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-fg-subtle">{message}</span>
      </div>
    </div>
  );
}
