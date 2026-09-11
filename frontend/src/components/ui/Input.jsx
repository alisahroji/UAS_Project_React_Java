import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({
  className,
  label,
  error,
  id,
  type = 'text',
  required,
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
      <input
        id={id}
        type={type}
        ref={ref}
        className={cn(
          'block w-full rounded-xl border border-border bg-surface text-text-main shadow-sm transition-all duration-200',
          'focus:border-primary focus:ring-[3px] focus:ring-primary/15 sm:text-base px-5 h-14 font-medium',
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

Input.displayName = 'Input';
