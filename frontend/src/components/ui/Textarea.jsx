import React from 'react';
import { cn } from '../../utils/cn';

export const Textarea = React.forwardRef(({
  className,
  label,
  error,
  id,
  required,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-bold uppercase tracking-widest text-text-main opacity-80 mb-2">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        className={cn(
          'block w-full rounded-xl border border-border bg-surface text-text-main shadow-sm transition-all duration-200',
          'focus:border-primary focus:ring-[3px] focus:ring-primary/15 sm:text-base px-5 py-4 font-medium',
          'disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed',
          error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'hover:border-primary/40',
          className
        )}
        aria-invalid={error ? "true" : "false"}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
