import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export function ErrorState({ title = "Something went wrong", message, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="rounded-full p-4 mb-4" style={{ backgroundColor: 'rgba(224,45,45,0.08)' }}>
        <AlertCircle className="h-8 w-8" style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-text-main mb-1">{title}</h3>
      {message && <p className="text-sm text-text-muted mb-6 max-w-sm">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
