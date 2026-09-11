import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { proposalService } from '../../services/proposalService';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProposalStatusBadge } from '../../components/proposals/ProposalStatusBadge';
import { formatIDR } from '../../utils/format';
import { ArrowLeft, Briefcase, Calendar, Clock } from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function ProposalList() {
  const { user } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await proposalService.getMyProposals();
        if (!ignore) {
          setProposals(data || []);
        }
      } catch (err) {
        if (!ignore) {
          if (err.status === 401) {
            setError('Please sign in to view your proposals.');
          } else if (err.status === 403) {
            setError('You are not authorized to view proposals.');
          } else {
            setError(err.message || 'Failed to load proposals.');
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (user?.role === 'FREELANCER') {
      loadData();
    } else {
      if (!ignore) {
        setLoading(false);
        setError('Only freelancers can view this page.');
        setProposals([]);
      }
    }

    return () => { ignore = true; };
  }, [user]);

  if (!user || user.role !== 'FREELANCER') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 pt-32 text-center">
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
          Freelancers Only
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          This page shows proposals you have submitted as a freelancer.
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Sign In as Freelancer
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-main)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
              My Proposals
            </p>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
              Submitted Proposals
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Track the status of your submitted proposals and manage negotiations.
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState
            title="Could not load proposals"
            message={error}
            onRetry={() => window.location.reload()}
          />
        ) : loading ? (
          <div className="rounded-xl p-8 flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Spinner size="lg" />
          </div>
        ) : proposals.length === 0 ? (
          <div className="rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <EmptyState
              title="No proposals yet"
              description="You haven't submitted any proposals yet. Browse the marketplace and submit your first proposal!"
              action={<Link to="/jobs"><button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}><Briefcase className="w-4 h-4" /> Browse Jobs</button></Link>}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Link
                key={proposal.id}
                to={`/proposals/${proposal.id}`}
                className="group block rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(217,30,46,0.35)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(217,30,46,0.07)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold group-hover:underline decoration-2 underline-offset-4" style={{ color: 'var(--color-text-main)', textDecorationColor: 'rgba(217,30,46,0.4)' }}>
                        {proposal.jobTitle || 'Untitled Project'}
                      </h3>
                      <ProposalStatusBadge status={proposal.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {proposal.createdAt && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Submitted {formatDate(proposal.createdAt)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {proposal.initialDurationDays} days
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
                        View negotiation →
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                      Your offer
                    </span>
                    <span className="text-lg font-extrabold" style={{ color: 'var(--color-primary)' }}>
                      {formatIDR(proposal.initialPrice)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}