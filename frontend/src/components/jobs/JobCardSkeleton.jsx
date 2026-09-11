import React from 'react';

export function JobCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden animate-pulse"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="p-6 flex-1 flex flex-col gap-4">
        {/* Title */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-5 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)', width: '80%' }} />
            <div className="h-4 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)', width: '40%' }} />
          </div>
          <div className="h-6 w-16 rounded-full" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
        </div>

        {/* Metadata pills */}
        <div className="flex gap-3">
          <div className="h-8 w-24 rounded-lg" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
          <div className="h-8 w-32 rounded-lg" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
        </div>

        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-4 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
          <div className="h-4 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)', width: '90%' }} />
          <div className="h-4 rounded" style={{ backgroundColor: 'var(--color-surface-elevated)', width: '75%' }} />
        </div>

        {/* Skills */}
        <div className="flex gap-2 mt-auto">
          <div className="h-6 w-16 rounded-md" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
          <div className="h-6 w-20 rounded-md" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
          <div className="h-6 w-14 rounded-md" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
        <div className="h-4 rounded w-24" style={{ backgroundColor: 'var(--color-surface-elevated)' }} />
      </div>
    </div>
  );
}
