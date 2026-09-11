import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Clock, MessagesSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { proposalService } from '../../services/proposalService';
import { offerService } from '../../services/offerService';
import { useAuth } from '../../hooks/useAuth';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProposalStatusBadge } from '../../components/proposals/ProposalStatusBadge';
import { formatDate } from '../../components/projects/projectFormat';
import { formatIDR } from '../../utils/format';

const PAGE_SIZE = 5;

function timeAgo(dateString) {
  if (!dateString) return null;
  const then = new Date(dateString).getTime();
  if (isNaN(then)) return null;
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

/**
 * Client-facing "Proposals Received" page (Step 12).
 * Refactored for Premium UI/UX (Pagination, Light Theme, IDR).
 */
export function ProposalsReceivedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const jobs = (await jobService.getJobs()) || [];
      const myJobs = jobs.filter((j) => j.clientId && j.clientId === user.id);

      const perJob = await Promise.all(
        myJobs.map(async (job) => {
          try {
            const proposals = (await proposalService.getProposals(job.id)) || [];
            return await Promise.all(
              proposals.map(async (p) => {
                let latestOffer = null;
                try {
                  const offers = await offerService.getOffers(p.id);
                  if (Array.isArray(offers) && offers.length > 0) {
                    latestOffer = offers[offers.length - 1];
                  }
                } catch {
                  // offers are participant-readable; failure simply omits the preview
                }
                return {
                  ...p,
                  jobTitle: p.jobTitle || job.title,
                  latestOffer,
                };
              })
            );
          } catch {
            // non-owner or transient failure contributes nothing
            return [];
          }
        })
      );

      const flat = perJob.flat();
      flat.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
      setItems(flat);
      setPage(1);
    } catch (err) {
      setError(err.message || 'Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  );

  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-main)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-sm font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
            Workspace Klien
          </p>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-text-main)' }}>
            Proposal Masuk
          </h1>
          <p className="text-base mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Kelola semua proposal yang masuk ke lowongan Anda. Negosiasi, setujui, atau tolak.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <ErrorState title="Gagal memuat proposal" message={error} onRetry={load} />
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <EmptyState
              icon={FileText}
              title="Belum ada proposal"
              description="Ketika freelancer mengirimkan proposal ke lowongan Anda, mereka akan muncul di sini."
              action={
                <Link
                  to="/jobs/create"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold text-white rounded-full transition-all hover:scale-105 shadow-md shadow-red-500/20"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Buat Lowongan
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pageItems.map((p, idx) => {
                const offer = p.latestOffer;
                return (
                  <Link
                    key={p.id}
                    to={`/proposals/${p.id}`}
                    className="block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-sm"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(217,30,46,0.3)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(217,30,46,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-base font-extrabold uppercase"
                          style={{ backgroundColor: 'rgba(217,30,46,0.1)', color: 'var(--color-primary)' }}
                        >
                          {(p.freelancerName || 'F').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <h3 className="text-lg font-bold truncate" style={{ color: 'var(--color-text-main)' }}>
                              {p.freelancerName || 'Freelancer'}
                            </h3>
                            <ProposalStatusBadge status={p.status} />
                          </div>
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {p.jobTitle} · diupdate {timeAgo(p.updatedAt || p.createdAt)}
                          </p>
                          {offer && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                              <MessagesSquare className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                              <span style={{ color: 'var(--color-text-muted)' }}>Penawaran terakhir:</span>
                              <span className="font-bold" style={{ color: 'var(--color-text-main)' }}>{formatIDR(offer.price)} · {offer.durationDays} hari</span>
                              <span className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: offer.status === 'PENDING' ? 'rgba(217,30,46,0.1)' : 'var(--color-surface)', color: offer.status === 'PENDING' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                {offer.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                        <span className="inline-flex items-center text-lg font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                          {formatIDR(p.initialPrice)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-md" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                          <Clock className="w-3.5 h-3.5" />{p.initialDurationDays} hari
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Navigasi halaman">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-xl inline-flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-black/5"
                  style={{ backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-border)`, color: 'var(--color-text-main)' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className="w-10 h-10 rounded-xl text-sm font-bold transition-all"
                    style={
                      p === page
                        ? { backgroundColor: 'var(--color-primary)', color: '#fff', boxShadow: '0 4px 12px rgba(217,30,46,0.2)' }
                        : { backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-border)`, color: 'var(--color-text-muted)' }
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === pageCount}
                  className="w-10 h-10 rounded-xl inline-flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-black/5"
                  style={{ backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-border)`, color: 'var(--color-text-main)' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
