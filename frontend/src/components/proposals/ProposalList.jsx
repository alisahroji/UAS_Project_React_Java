import React from 'react';
import { Link } from 'react-router-dom';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { DollarSign, Clock } from 'lucide-react';
import { formatIDR } from '../../utils/format';

function formatBudget(budget) {
  return formatIDR(budget);
}

export function ProposalList({ proposals, loading, showJob = false, emptyMessage = 'No proposals yet.' }) {
  if (loading) {
    return (
      <div className="rounded-xl p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Spinner size="md" />
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <EmptyState
          title="No proposals"
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Proposals ({proposals.length})
      </h2>
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <Link
            key={proposal.id}
            to={`/proposals/${proposal.id}`}
            className="block rounded-lg p-4 transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
                    {proposal.freelancerName || 'Freelancer'}
                  </h3>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                {showJob && proposal.jobTitle && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Job: {proposal.jobTitle}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
                <span className="inline-flex items-center gap-1.5 font-semibold px-2 py-1 rounded-md"
                  style={{ color: 'var(--color-primary)', backgroundColor: 'rgba(217,30,46,0.08)' }}
                >
                  <DollarSign className="w-3 h-3" />
                  {formatBudget(proposal.initialPrice)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)' }}
                >
                  <Clock className="w-3 h-3" />
                  {proposal.initialDurationDays}d
                </span>
              </div>
            </div>
            {proposal.coverLetter && (
              <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                {proposal.coverLetter}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}