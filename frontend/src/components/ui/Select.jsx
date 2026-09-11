import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(({
  className,
  label,
  error,
  id,
  options = [],
  required,
  placeholder,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-main mb-1">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        required={required}
        className={cn(
          'block w-full rounded-md border-border bg-surface text-text-main shadow-sm transition-colors appearance-none',
          'focus:border-primary focus:ring-primary sm:text-sm',
          'disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed',
          error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border',
          className
        )}
        aria-invalid={error ? "true" : "false"}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="text-text-muted">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
