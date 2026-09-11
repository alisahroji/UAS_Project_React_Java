import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Briefcase, ArrowLeft } from 'lucide-react';
import { conversationService } from '../../services/conversationService';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProposalStatusBadge } from '../../components/proposals/ProposalStatusBadge';
import { timeAgoID } from '../../utils/format';

/**
 * Messages inbox (Step 9) — a real, role-aware conversation list assembled from
 * existing backend endpoints (see conversationService). Every entry deep-links into
 * the existing ChatPage (/chat/:proposalId) — no new chat implementation.
 */
export function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await conversationService.getConversations();
      setConversations(data || []);
    } catch (err) {
      if (err.status === 401) setError('Sesi Anda telah berakhir. Silakan login kembali.');
      else if (err.status === 403) setError('Anda tidak diizinkan untuk melihat percakapan.');
      else setError(err.message || 'Gagal memuat percakapan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 pt-32 text-center">
        <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
           <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-main)' }}>
          Masuk untuk melihat pesan Anda
        </p>
        <p className="text-sm font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Percakapan bersifat privat untuk partisipan proposal.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-md transition-transform hover:scale-105"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Masuk ke Akun
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-16 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors group"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" style={{ color: 'var(--color-primary)' }} />
            <span className="group-hover:text-[var(--color-text-main)]">Kembali</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-[11px] font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
            Kotak Masuk
          </p>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-text-main)' }}>
            Percakapan Anda
          </h1>
          <p className="text-sm font-medium mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Ruang chat yang terhubung dengan proposal Anda — lakukan negosiasi dan koordinasi secara real-time.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <ErrorState title="Gagal memuat percakapan" message={error} onRetry={load} />
          </div>
        ) : loading ? (
          <div className="rounded-2xl p-12 flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <Spinner size="lg" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <EmptyState
              icon={MessageSquare}
              title="Belum ada percakapan"
              description={
                user.role === 'FREELANCER'
                  ? 'Percakapan akan dimulai setelah Anda mengirim proposal, atau ketika klien membalas proposal Anda.'
                  : 'Percakapan akan dimulai ketika ada developer yang mengirimkan proposal pada lowongan Anda.'
              }
              action={
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 px-6 py-3 mt-4 text-sm font-extrabold text-white rounded-xl shadow-md transition-transform hover:scale-105"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Briefcase className="w-4 h-4" />
                  {user.role === 'FREELANCER' ? 'Cari Pekerjaan' : 'Lihat Marketplace'}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((c) => (
              <Link
                key={c.proposalId}
                to={`/chat/${c.proposalId}`}
                className="group block rounded-2xl p-6 transition-all duration-300 bg-white"
                style={{ border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(217,30,46,0.3)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(217,30,46,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-extrabold text-lg uppercase shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(217,30,46,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(217,30,46,0.18)' }}
                    >
                      {(c.counterpartyName || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <h3 className="text-lg font-extrabold truncate group-hover:text-[var(--color-primary)] transition-colors" style={{ color: 'var(--color-text-main)' }}>
                          {c.jobTitle}
                        </h3>
                        <ProposalStatusBadge status={c.status} />
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-muted)' }}>
                        Chat dengan <span className="font-extrabold" style={{ color: 'var(--color-text-main)' }}>{c.counterpartyName}</span> <span className="mx-1.5 opacity-50">•</span> {c.isFreelancer ? 'Anda sebagai Developer' : 'Anda sebagai Klien'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 mt-2 sm:mt-0">
                    {c.lastActivity && (
                      <span className="text-[11px] font-extrabold tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>
                        {timeAgoID(c.lastActivity)}
                      </span>
                    )}
                    <span className="text-xs font-bold transition-transform group-hover:translate-x-1" style={{ color: 'var(--color-primary)' }}>
                      Buka Chat →
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
