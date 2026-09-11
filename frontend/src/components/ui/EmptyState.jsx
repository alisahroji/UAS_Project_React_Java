import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '../../utils/cn';

export function EmptyState({ title, description, icon: Icon = FileQuestion, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="rounded-full bg-surface-elevated p-4 mb-4">
        <Icon className="h-8 w-8 text-text-muted" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-text-main mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted mb-6 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
