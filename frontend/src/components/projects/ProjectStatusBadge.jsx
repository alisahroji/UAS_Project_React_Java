import React from 'react';

const PROJECT_STATUS_CONFIG = {
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'var(--color-info)',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'var(--color-warning)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  REVISION: {
    label: 'Revision',
    color: 'var(--color-danger)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'var(--color-success)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
};

export function ProjectStatusBadge({ status }) {
  const cfg = PROJECT_STATUS_CONFIG[status] || {
    label: status,
    color: 'var(--color-text-muted)',
    bg: 'rgba(161,161,170,0.08)',
    border: 'rgba(161,161,170,0.2)',
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export function getProjectStatusLabel(status) {
  return PROJECT_STATUS_CONFIG[status]?.label || status;
}
