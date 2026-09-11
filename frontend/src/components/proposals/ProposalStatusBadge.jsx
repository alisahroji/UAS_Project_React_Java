import React from 'react';

const PROPOSAL_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'var(--color-info)',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  NEGOTIATING: {
    label: 'Negotiating',
    color: 'var(--color-warning)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'var(--color-success)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'var(--color-danger)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'var(--color-text-muted)',
    bg: 'rgba(161,161,170,0.08)',
    border: 'rgba(161,161,170,0.2)',
  },
};

export const OFFER_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'var(--color-info)',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'var(--color-success)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'var(--color-danger)',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
  },
  SUPERSEDED: {
    label: 'Superseded',
    color: 'var(--color-text-muted)',
    bg: 'rgba(161,161,170,0.08)',
    border: 'rgba(161,161,170,0.2)',
  },
};

export function ProposalStatusBadge({ status }) {
  const cfg = PROPOSAL_STATUS_CONFIG[status] || {
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

export function OfferStatusBadge({ status }) {
  const cfg = OFFER_STATUS_CONFIG[status] || {
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

export function getProposalStatusLabel(status) {
  return PROPOSAL_STATUS_CONFIG[status]?.label || status;
}

export function getOfferStatusLabel(status) {
  return OFFER_STATUS_CONFIG[status]?.label || status;
}