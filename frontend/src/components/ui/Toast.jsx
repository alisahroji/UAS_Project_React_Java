import React from 'react';
import { cn } from '../../utils/cn';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const variantStyles = {
  success: 'bg-surface border-success text-text-main',
  error: 'bg-surface border-danger text-text-main',
  warning: 'bg-surface border-warning text-text-main',
  info: 'bg-surface border-info text-text-main',
};

const variantIcons = {
  success: <CheckCircle className="h-6 w-6 text-success" />,
  error: <AlertCircle className="h-6 w-6 text-danger" />,
  warning: <AlertTriangle className="h-6 w-6 text-warning" />,
  info: <Info className="h-6 w-6 text-info" />,
};

export function Toast({ title, description, variant, onClose }) {
  return (
    <div className={cn(
      "max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border overflow-hidden transition-all",
      variantStyles[variant] || variantStyles.info
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {variantIcons[variant] || variantIcons.info}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">
              {title}
            </p>
            {description && (
              <p className="mt-1 text-sm text-text-muted">
                {description}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="rounded-md inline-flex text-text-muted hover:text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
