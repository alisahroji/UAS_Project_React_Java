import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Interactive 1-5 star rating input (and a read-only display mode).
 * Keyboard accessible: buttons are focusable and operable with Enter/Space.
 */
export function ReviewStars({ value, onChange, disabled = false, size = 'w-5 h-5' }) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;

  return (
    <div className="flex items-center gap-1" role={interactive ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = interactive ? (hovered || value) >= star : value >= star;
        const StarEl = (
          <Star
            className={`${size} transition-colors`}
            style={{
              color: active ? '#f59e0b' : 'var(--color-border)',
              fill: active ? '#f59e0b' : 'transparent',
            }}
          />
        );
        if (!interactive) {
          return <span key={star}>{StarEl}</span>;
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded disabled:opacity-50"
          >
            {StarEl}
          </button>
        );
      })}
    </div>
  );
}
