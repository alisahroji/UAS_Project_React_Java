/**
 * Shared formatting helpers (Step 12 polish — Indonesian localization).
 *
 * MONEY: the backend stores budgets/offers/prices as plain numbers (historically
 * USD-denominated test data). Per product decision the UI displays Rupiah using a
 * fixed display rate. This is a PRESENTATION conversion only — no backend value is
 * changed, and the rate is a single documented constant.
 */
export const USD_TO_IDR = 16000;

export function formatIDR(amount) {
  if (amount === null || amount === undefined || amount === '' || Number.isNaN(Number(amount))) {
    return '—';
  }
  const idr = Math.round(Number(amount) * USD_TO_IDR);
  return `Rp ${idr.toLocaleString('id-ID')}`;
}

/** Short Indonesian date: "30 Sep 2026" */
export function formatDateID(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Long Indonesian date: "30 September 2026" */
export function formatDateIDLong(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Relative time in Indonesian: "Baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu" */
export function timeAgoID(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatDateID(dateString);
}
