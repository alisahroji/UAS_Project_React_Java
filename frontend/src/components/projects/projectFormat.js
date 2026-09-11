export function formatBudget(budget) {
  if (!budget && budget !== 0) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(budget);
}

export function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
