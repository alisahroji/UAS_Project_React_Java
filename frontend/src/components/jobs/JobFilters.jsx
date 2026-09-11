import React, { useState } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'budget-desc', label: 'Budget: High to Low' },
  { value: 'budget-asc', label: 'Budget: Low to High' },
  { value: 'deadline-asc', label: 'Deadline: Soonest' },
  { value: 'deadline-desc', label: 'Deadline: Furthest' },
];

export function JobFilters({ onFilterChange, currentFilters, isLoading }) {
  const [search, setSearch] = useState(currentFilters.search || '');
  const [sortValue, setSortValue] = useState(
    `${currentFilters.sortBy || 'createdAt'}-${currentFilters.direction || 'desc'}`
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const [sortBy, direction] = sortValue.split('-');
    onFilterChange?.({ search, sortBy, direction });
  };

  const handleClearSearch = () => {
    setSearch('');
    const [sortBy, direction] = sortValue.split('-');
    onFilterChange?.({ search: '', sortBy, direction });
  };

  const handleSortChange = (e) => {
    const newSortValue = e.target.value;
    setSortValue(newSortValue);
    const [sortBy, direction] = newSortValue.split('-');
    onFilterChange?.({ search, sortBy, direction });
  };

  const inputBase = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-main)',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
    height: '44px',
  };

  return (
    <div
      className="mb-6 p-4 rounded-xl"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              id="search-jobs"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs, technologies, or skills..."
              disabled={isLoading}
              aria-label="Search jobs"
              style={{
                ...inputBase,
                paddingLeft: '36px',
                paddingRight: search ? '36px' : '12px',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
            />
            {search && !isLoading && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-main)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isLoading && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
                style={{ color: 'var(--color-text-muted)' }}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 text-sm font-semibold text-white rounded-lg transition-colors shrink-0 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)', height: '44px' }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; }}
          >
            Search
          </button>
        </form>

        {/* Sort select */}
        <div className="relative shrink-0 sm:w-52">
          <select
            id="sort-jobs"
            value={sortValue}
            onChange={handleSortChange}
            disabled={isLoading}
            aria-label="Sort jobs"
            style={{
              ...inputBase,
              paddingLeft: '12px',
              paddingRight: '32px',
              appearance: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--color-surface)' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>
      </div>
    </div>
  );
}
