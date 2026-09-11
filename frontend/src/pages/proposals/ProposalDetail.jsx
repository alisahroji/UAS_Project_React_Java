import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { proposalService } from '../../services/proposalService';
import { offerService } from '../../services/offerService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { ProposalStatusBadge } from '../../components/proposals/ProposalStatusBadge';
import { OfferStatusBadge } from '../../components/proposals/ProposalStatusBadge';
import { OfferForm } from '../../components/proposals/OfferForm';
import { ArrowLeft, DollarSign, Clock, MessageSquare, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { formatIDR, formatDateID } from '../../utils/format';

export function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [proposal, setProposal] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAction, setOfferAction] = useState(null); // 'counter' or 'accept' or 'reject'
  const [processingOffer, setProcessingOffer] = useState(false);

  // For accept/reject actions on specific offers
  const [pendingOfferAction, setPendingOfferAction] = useState(null); // { offerId, action: 'accept' | 'reject' }

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [proposalData, offersData] = await Promise.all([
          proposalService.getProposalById(id),
          offerService.getOffers(id),
        ]);
        if (!ignore) {
          setProposal(proposalData);
          setOffers(offersData || []);
        }
      } catch (err) {
        if (!ignore) {
          if (err.status === 404) setError('Proposal tidak ditemukan.');
          else if (err.status === 403) setError('Anda tidak memiliki akses ke proposal ini.');
          else setError(err.message || 'Gagal memuat detail proposal.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, [id]);

  const handleCreateOffer = async (offerData) => {
    try {
      setSubmittingOffer(true);
      await offerService.createOffer(id, offerData);
      setOfferModalOpen(false);
      addToast({
        title: 'Penawaran Balasan Terkirim',
        description: 'Penawaran Anda telah dikirim ke pihak terkait.',
        variant: 'success',
      });
      // Refresh
      const [updatedProposal, updatedOffers] = await Promise.all([
        proposalService.getProposalById(id),
        offerService.getOffers(id),
      ]);
      setProposal(updatedProposal);
      setOffers(updatedOffers || []);
    } catch (err) {
      if (err.status === 400) addToast({ title: 'Penawaran Tidak Valid', description: err.message || 'Harap periksa kembali input Anda.', variant: 'error' });
      else if (err.status === 403) addToast({ title: 'Akses Ditolak', description: 'Anda tidak dapat membuat penawaran saat ini.', variant: 'error' });
      else if (err.status === 404) addToast({ title: 'Proposal Tidak Ditemukan', description: 'Proposal mungkin telah dihapus.', variant: 'error' });
      else addToast({ title: 'Gagal', description: err.message || 'Tidak dapat mengirim penawaran.', variant: 'error' });
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      setProcessingOffer(true);
      await offerService.acceptOffer(id, offerId);
      addToast({ title: 'Proposal Diterima', description: 'Proposal telah diterima. Proyek resmi dibuat.', variant: 'success' });
      // Refresh
      const [updatedProposal, updatedOffers] = await Promise.all([
        proposalService.getProposalById(id),
        offerService.getOffers(id),
      ]);
      setProposal(updatedProposal);
      setOffers(updatedOffers || []);
    } catch (err) {
      if (err.status === 403) addToast({ title: 'Akses Ditolak', description: 'Anda tidak diizinkan untuk menerima penawaran ini.', variant: 'error' });
      else if (err.status === 409) addToast({ title: 'Sudah Diputuskan', description: 'Penawaran ini sudah diputuskan sebelumnya.', variant: 'error' });
      else addToast({ title: 'Gagal', description: err.message || 'Tidak dapat menerima penawaran.', variant: 'error' });
    } finally {
      setProcessingOffer(false);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      setProcessingOffer(true);
      await offerService.rejectOffer(id, offerId);
      addToast({ title: 'Penawaran Ditolak', description: 'Penawaran ini telah ditolak.', variant: 'info' });
      const updatedOffers = await offerService.getOffers(id);
      setOffers(updatedOffers || []);
    } catch (err) {
      if (err.status === 403) addToast({ title: 'Akses Ditolak', description: 'Anda tidak diizinkan untuk menolak penawaran ini.', variant: 'error' });
      else addToast({ title: 'Gagal', description: err.message || 'Tidak dapat menolak penawaran.', variant: 'error' });
    } finally {
      setProcessingOffer(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setProcessingOffer(true);
      const updatedProposal = await proposalService.withdrawProposal(id);
      setProposal(updatedProposal);
      addToast({ title: 'Proposal Ditarik', description: 'Proposal Anda telah ditarik kembali.', variant: 'info' });
    } catch (err) {
      if (err.status === 403) addToast({ title: 'Akses Ditolak', description: 'Anda tidak diizinkan untuk menarik proposal ini.', variant: 'error' });
      else if (err.status === 409) addToast({ title: 'Tidak Dapat Ditarik', description: err.message || 'Proposal ini tidak dapat lagi ditarik.', variant: 'error' });
      else addToast({ title: 'Gagal', description: err.message || 'Tidak dapat menarik proposal.', variant: 'error' });
    } finally {
      setProcessingOffer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 pt-32 text-center">
        <p className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>Tidak Dapat Memuat Proposal</p>
        <p className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        <button onClick={() => navigate('/proposals')} className="inline-flex items-center gap-2 text-sm font-bold transition-transform hover:-translate-x-1" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Kembali ke Proposal
        </button>
      </div>
    );
  }

  if (!proposal) return null;

  const isClient = user?.role === 'CLIENT';
  const isFreelancer = user?.role === 'FREELANCER';

  const isNegotiating = proposal.status === 'NEGOTIATING';
  const isPending = proposal.status === 'PENDING';
  const isAccepted = proposal.status === 'ACCEPTED';
  const isRejected = proposal.status === 'REJECTED';
  const isWithdrawn = proposal.status === 'WITHDRAWN';

  const freelancerId = proposal.freelancerId;
  const isCurrentUserFreelancer = freelancerId && user?.id === freelancerId;

  const pendingOffer = offers.find((o) => o.status === 'PENDING') || null;
  const isRecipientOfPending = !!pendingOffer && pendingOffer.offeredById !== user?.id;
  const canCreateOffer = (isPending || isNegotiating) && (!pendingOffer || isRecipientOfPending);

  return (
    <div className="min-h-screen pb-24 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Back nav */}
      <div className="sticky top-16 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/proposals')}
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors group"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" style={{ color: 'var(--color-primary)' }} />
            <span className="group-hover:text-[var(--color-text-main)]">Kembali ke Proposal</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug mb-1" style={{ color: 'var(--color-text-main)' }}>
                {proposal.jobTitle || 'Proposal Proyek'}
              </h1>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Proposal diajukan untuk <strong>{proposal.jobTitle || 'lowongan ini'}</strong>
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <ProposalStatusBadge status={proposal.status} />
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex flex-wrap gap-4 p-5 rounded-xl mb-8" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(217,30,46,0.08)' }}>
                 <DollarSign className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Estimasi Anggaran</div>
                <div className="text-lg font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                  {formatIDR(proposal.initialPrice)}
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-px self-stretch opacity-60" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                 <Clock className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Durasi Pekerjaan</div>
                <div className="text-sm font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                  {proposal.initialDurationDays} Hari
                </div>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Surat Pengantar (Cover Letter)
            </h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium p-5 rounded-xl" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-main)' }}>
              {proposal.coverLetter || 'Tidak ada surat pengantar yang diberikan.'}
            </div>
          </div>
        </div>

        {/* Offer History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '2px solid var(--color-border)' }}>
            <h2 className="text-sm font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-text-main)' }}>
              Riwayat Negosiasi
            </h2>
            {(isPending || isNegotiating || isAccepted) && (
              <Link
                to={`/chat/${proposal.id}`}
                className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-transform hover:scale-105 shadow-sm"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                <MessageSquare className="w-4 h-4" /> Buka Ruang Chat
              </Link>
            )}
          </div>

          {offers.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}>
              <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <MessageSquare className="h-8 w-8" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Belum ada penawaran tambahan. Proposal awal adalah titik awal diskusi.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div aria-hidden="true" className="absolute left-[23px] top-8 bottom-8 w-px bg-gray-200" />
              <div className="space-y-6">
                {offers.map((offer, index) => (
                <div key={offer.id} className="relative pl-14">
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-8 w-4 h-4 rounded-full border-4 z-10"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: offer.status === 'PENDING' ? 'var(--color-primary)' : offer.status === 'ACCEPTED' ? 'var(--color-success)' : 'var(--color-border)',
                      boxShadow: offer.status === 'PENDING' ? '0 0 0 4px rgba(217,30,46,0.1)' : 'none'
                    }}
                  />
                  <div
                    className="rounded-2xl p-6 relative transition-shadow hover:shadow-md"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)' }}>
                          Penawaran #{offers.length - index}
                        </span>
                        {index === offers.length - 1 && offers.length > 1 && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ color: 'var(--color-primary)', backgroundColor: 'rgba(217,30,46,0.08)' }}>
                            Awal
                          </span>
                        )}
                        <span className="text-sm font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                          {offer.offeredByName}
                        </span>
                        <OfferStatusBadge status={offer.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="inline-flex items-center gap-1.5 font-bold"
                        style={{ color: 'var(--color-text-main)' }}
                      >
                        <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                        {formatIDR(offer.price)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold border-l pl-2 border-gray-300"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {offer.durationDays} Hari
                      </span>
                    </div>
                  </div>

                  {offer.message && (
                    <div className="mb-4 bg-[var(--color-background)] p-4 rounded-xl">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Pesan</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium" style={{ color: 'var(--color-text-main)' }}>
                        {offer.message}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDateID(offer.createdAt)}
                    </span>
                    {/* Recipient of a PENDING offer may Counter, Reject, or Accept. */}
                    {offer.status === 'PENDING' && offer.offeredById !== user?.id && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setOfferAction('counter');
                            setOfferModalOpen(true);
                          }}
                          disabled={submittingOffer}
                          className="px-4 py-2 text-xs font-bold rounded-xl border transition-all hover:bg-gray-50"
                          style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 inline mr-1.5" /> Tawar Balik
                        </button>
                        <button
                          onClick={() => setPendingOfferAction({ offerId: offer.id, action: 'reject' })}
                          disabled={processingOffer}
                          className="px-4 py-2 text-xs font-bold rounded-xl border transition-all hover:opacity-90"
                          style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }}
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => setPendingOfferAction({ offerId: offer.id, action: 'accept' })}
                          disabled={processingOffer}
                          className="px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-transform hover:scale-105"
                          style={{ color: 'white', backgroundColor: 'var(--color-success)' }}
                        >
                          Terima Penawaran
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* Actions for PENDING initial proposal */}
          {(isPending || isNegotiating) && (
            <div className="flex flex-wrap gap-3 pt-6 mt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
              {/* Client: Accept / Reject / Counter */}
              {isClient && (
                <div className="flex flex-wrap gap-3 flex-1">
                  {isPending && (
                    <button
                      onClick={() => {
                        if (pendingOffer) {
                          setPendingOfferAction({ offerId: pendingOffer.id, action: 'accept' });
                        }
                      }}
                      disabled={processingOffer}
                      className="px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-transform hover:scale-105"
                      style={{ color: 'white', backgroundColor: 'var(--color-success)' }}
                    >
                      Terima Proposal
                    </button>
                  )}
                  {canCreateOffer && (
                    <button
                      onClick={() => {
                        setOfferAction('counter');
                        setOfferModalOpen(true);
                      }}
                      disabled={submittingOffer}
                      className="px-6 py-2.5 text-sm font-bold rounded-xl border transition-all hover:bg-gray-50 shadow-sm"
                      style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <ArrowDownLeft className="w-4 h-4 inline mr-2" /> Ajukan Tawaran Baru
                    </button>
                  )}
                </div>
              )}
              {/* Freelancer: Withdraw */}
              {isFreelancer && isCurrentUserFreelancer && (isPending || isNegotiating) && (
                <button
                  onClick={handleWithdraw}
                  disabled={processingOffer}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl border transition-all hover:bg-red-50"
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }}
                >
                  Tarik Proposal
                </button>
              )}
            </div>
          )}

          {/* Accepted state */}
          {isAccepted && (
            <div className="rounded-2xl p-6 sm:p-8 mt-6" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold mb-1" style={{ color: 'var(--color-success)' }}>Proposal Telah Disetujui</h3>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                    Proyek resmi dibuat dari proposal ini. Silakan kelola pengerjaan di menu Proyek.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejected/Withdrawn state */}
          {(isRejected || isWithdrawn) && (
            <div className="rounded-2xl p-6 sm:p-8 mt-6 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px dashed rgba(239,68,68,0.3)' }}>
              <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-danger)' }}>
                {isRejected ? 'Proposal Ditolak' : 'Proposal Ditarik'}
              </h3>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Proposal ini sudah tidak aktif dan tidak dapat dinegosiasikan lagi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Counter-Offer Modal */}
      <Modal
        isOpen={offerModalOpen}
        onClose={() => !submittingOffer && setOfferModalOpen(false)}
        title={offerAction === 'counter' ? 'Kirim Penawaran Balasan' : 'Kirim Penawaran'}
      >
        <div className="px-6 py-4">
          <p className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Masukkan penawaran baru Anda untuk <strong style={{ color: 'var(--color-text-main)' }}>{proposal.jobTitle || 'proyek ini'}</strong>.
          </p>
          <OfferForm
            onSubmit={handleCreateOffer}
            submitting={submittingOffer}
            submitLabel="Kirim Penawaran"
          />
        </div>
      </Modal>

      {/* Confirm Accept/Reject Modal */}
      <Modal
        isOpen={!!pendingOfferAction}
        onClose={() => !processingOffer && setPendingOfferAction(null)}
        title={pendingOfferAction?.action === 'accept' ? 'Terima Penawaran' : 'Tolak Penawaran'}
      >
        <div className="p-8">
          <p className="text-center text-lg font-medium mb-8 leading-relaxed" style={{ color: 'var(--color-text-main)' }}>
            Apakah Anda yakin ingin <strong>{pendingOfferAction?.action === 'accept' ? 'menerima' : 'menolak'}</strong> penawaran ini?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setPendingOfferAction(null)}
              disabled={processingOffer}
              className="flex-1 py-3 text-sm font-bold rounded-xl border transition-colors hover:bg-gray-50"
              style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (pendingOfferAction?.action === 'accept') {
                  handleAcceptOffer(pendingOfferAction.offerId);
                } else {
                  handleRejectOffer(pendingOfferAction.offerId);
                }
                setPendingOfferAction(null);
              }}
              disabled={processingOffer}
              className="flex-1 py-3 text-sm font-extrabold rounded-xl transition-transform hover:scale-105 shadow-sm"
              style={{
                color: pendingOfferAction?.action === 'accept' ? 'white' : 'white',
                backgroundColor: pendingOfferAction?.action === 'accept' ? 'var(--color-success)' : '#ef4444',
                borderColor: 'transparent',
              }}
            >
              {pendingOfferAction?.action === 'accept' ? 'Ya, Terima' : 'Ya, Tolak'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}