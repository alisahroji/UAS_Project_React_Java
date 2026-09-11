import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { proposalService } from '../../services/proposalService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { ProposalForm } from '../../components/proposals/ProposalForm';
import { ProposalList } from '../../components/proposals/ProposalList';
import { ArrowLeft, DollarSign, Calendar, Pencil, Trash2, Briefcase, CheckCircle2, ShieldCheck, Zap, Users } from 'lucide-react';
import { formatIDR } from '../../utils/format';
import { SiteFooter } from '../../components/brand/SiteFooter';

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

const STATUS_CONFIG = {
  OPEN: { label: 'Menerima Proposal', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  IN_PROGRESS: { label: 'Sedang Berjalan', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  CLOSED: { label: 'Ditutup', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
};

export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Proposal state for FREELANCER
  const [myProposal, setMyProposal] = useState(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Proposal list state for CLIENT (owner of job)
  const [jobProposals, setJobProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchJob() {
      try {
        setLoading(true);
        setError(null);
        const data = await jobService.getJobById(id);
        if (!ignore) setJob(data);
      } catch (err) {
        if (!ignore) setError(err.message || 'Gagal memuat lowongan.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchJob();
    return () => { ignore = true; };
  }, [id]);

  // For FREELANCER: find their existing proposal for this job
  useEffect(() => {
    if (!user || user.role !== 'FREELANCER' || !id) return;
    let ignore = false;
    async function loadMyProposal() {
      try {
        const proposals = await proposalService.getMyProposals();
        if (ignore) return;
        const mine = Array.isArray(proposals) ? proposals.find(p => p.jobId === id) : null;
        setMyProposal(mine || null);
      } catch (err) {
        // Silent — don't block job view
      }
    }
    loadMyProposal();
    return () => { ignore = true; };
  }, [id, user]);

  // For CLIENT owner: load proposals for this job
  useEffect(() => {
    if (!user || user.role !== 'CLIENT' || !job || !id) return;
    // Only the owner of the job can see the proposal list
    if (job.clientId && user.id && job.clientId !== user.id) return;
    let ignore = false;
    async function loadJobProposals() {
      try {
        setProposalsLoading(true);
        const proposals = await proposalService.getProposals(id);
        if (!ignore) setJobProposals(proposals || []);
      } catch (err) {
        // 403 if not owner — ignore
      } finally {
        if (!ignore) setProposalsLoading(false);
      }
    }
    loadJobProposals();
    return () => { ignore = true; };
  }, [id, user, job]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await jobService.deleteJob(id);
      addToast({ title: 'Lowongan Dihapus', description: 'Lowongan telah dihapus dari sistem.', variant: 'success' });
      navigate('/jobs');
    } catch (err) {
      addToast({ title: 'Gagal Menghapus', description: err.message || 'Anda tidak memiliki akses.', variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleSubmitProposal = async (payload) => {
    try {
      setSubmittingProposal(true);
      const created = await proposalService.createProposal(id, payload);
      setMyProposal(created);
      setProposalModalOpen(false);
      addToast({
        title: 'Proposal Terkirim',
        description: 'Proposal Anda telah dikirimkan ke klien.',
        variant: 'success',
      });
    } catch (err) {
      if (err.status === 409) {
        addToast({
          title: 'Proposal Sudah Ada',
          description: 'Anda sudah mengirimkan proposal untuk lowongan ini.',
          variant: 'error',
        });
      } else if (err.status === 400) {
        addToast({
          title: 'Proposal Tidak Valid',
          description: err.message || 'Harap periksa kembali input Anda.',
          variant: 'error',
        });
      } else if (err.status === 401) {
        addToast({
          title: 'Harap Login',
          description: 'Anda harus login untuk mengirim proposal.',
          variant: 'error',
        });
      } else if (err.status === 403) {
        addToast({
          title: 'Tidak Diizinkan',
          description: 'Anda tidak dapat mengirim proposal untuk lowongan ini.',
          variant: 'error',
        });
      } else if (err.status === 404) {
        addToast({
          title: 'Lowongan Tidak Ditemukan',
          description: 'Lowongan ini mungkin sudah dihapus.',
          variant: 'error',
        });
      } else {
        addToast({
          title: 'Gagal Mengirim',
          description: err.message || 'Terjadi kesalahan. Silakan coba lagi.',
          variant: 'error',
        });
      }
    } finally {
      setSubmittingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <p className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-main)' }}>
            {error.includes('404') ? 'Lowongan Tidak Ditemukan' : 'Gagal Memuat Lowongan'}
          </p>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            {error.includes('404')
              ? 'Lowongan yang Anda tuju mungkin telah dihapus oleh klien atau URL tidak valid.'
              : error}
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Marketplace
          </Link>
        </div>
        <SiteFooter variant="light" />
      </div>
    );
  }

  if (!job) return null;

  const isClient = user?.role === 'CLIENT';
  const isFreelancer = user?.role === 'FREELANCER';
  const isJobOwner = isClient && job.clientId && user?.id && job.clientId === user.id;
  const statusCfg = STATUS_CONFIG[job.status] || { label: job.status, color: 'var(--color-text-muted)', bg: 'var(--color-surface-elevated)', border: 'var(--color-border)' };
  const formattedDeadline = formatDate(job.deadline);
  const isJobOpen = job.status === 'OPEN';

  return (
    <div className="flex flex-col min-h-screen pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Back nav */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-main)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Marketplace
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Job header */}
            <div className="pb-10" style={{ borderBottom: '1px solid var(--color-border)' }}>
              {/* Status + title */}
              <div className="mb-6">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border mb-5"
                  style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.color }} />
                  {statusCfg.label}
                </span>
                <h1 className="text-3xl sm:text-[2.5rem] font-extrabold leading-tight tracking-tight mb-8" style={{ color: 'var(--color-text-main)' }}>
                  {job.title}
                </h1>
              </div>

              {/* Key metrics */}
              <div className="flex flex-wrap gap-10 mb-10">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-2">Anggaran Proyek</div>
                  <div className="text-2xl font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                    {formatIDR(job.budget)}
                  </div>
                </div>

                {formattedDeadline && (
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-2">Batas Waktu</div>
                    <div className="text-base font-bold flex items-center gap-2 mt-1" style={{ color: 'var(--color-text-main)' }}>
                      <Calendar className="w-4 h-4 opacity-70" />
                      {formattedDeadline}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-4">
                  Deskripsi Proyek
                </h2>
                <div className="text-base leading-relaxed whitespace-pre-wrap opacity-80" style={{ color: 'var(--color-text-main)' }}>
                  {job.description}
                </div>
              </div>
            </div>

            {/* Skills card */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="pb-10 border-b border-black/5">
                <h2 className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-5">
                  Keahlian & Teknologi
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 text-xs font-bold bg-black/[0.03] text-black/80 border border-black/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CLIENT owner: Proposals for this job */}
            {isJobOwner && (
              <ProposalList proposals={jobProposals} loading={proposalsLoading} showJob={false} />
            )}

            {/* ANONYMOUS VISITOR CTA BLOCK (Promotional Layout) */}
            {!isClient && !isFreelancer && (
              <div className="mt-12 mb-8 bg-gradient-to-br from-[#1a151a] to-[#2d1b2e] rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-red-500 opacity-20 blur-3xl mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-orange-500 opacity-10 blur-3xl mix-blend-screen pointer-events-none" />
                
                <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Tertarik dengan proyek ini?</h2>
                  <p className="text-white/80 text-lg mb-8 max-w-xl">
                    Gabung dengan DEVLINK sekarang untuk mengajukan proposal ke klien ini dan ribuan proyek lainnya.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div>
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-red-400" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Klien Terverifikasi</h4>
                      <p className="text-sm text-white/70 leading-relaxed">Berinteraksi hanya dengan klien profesional yang telah diverifikasi.</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-red-400" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Tanpa Potongan</h4>
                      <p className="text-sm text-white/70 leading-relaxed">Nikmati 100% dari hasil kerja Anda tanpa biaya platform tersembunyi.</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-red-400" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Komunitas Solid</h4>
                      <p className="text-sm text-white/70 leading-relaxed">Bangun reputasi dan koneksi di ekosistem khusus Web Developer.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-extrabold bg-white text-black transition-transform hover:scale-105 shadow-xl"
                    >
                      Daftar sebagai Freelancer
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-bold border border-white/30 text-white hover:bg-white/10 transition-colors"
                    >
                      Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Action Card */}
            <div className="rounded-2xl p-7 shadow-sm sticky top-24" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {/* Freelancer actions */}
              {isFreelancer && (
                <div>
                  {myProposal ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                        <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                        <span className="text-sm font-bold" style={{ color: 'var(--color-success-text)' }}>
                          Proposal Terkirim
                        </span>
                      </div>
                      <Link
                        to={`/proposals/${myProposal.id}`}
                        className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold rounded-xl text-center transition-all hover:shadow-lg shadow-sm"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                      >
                        <Briefcase className="w-4 h-4" />
                        Lihat Proposal
                      </Link>
                    </div>
                  ) : isJobOpen ? (
                    <button
                      onClick={() => setProposalModalOpen(true)}
                      className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-extrabold text-white rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Briefcase className="w-5 h-5" />
                      Ajukan Proposal
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                        Lowongan ini sudah ditutup.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Client actions */}
              {isClient && isJobOwner && (
                <div className="space-y-4">
                  <Link
                    to={`/jobs/${job.id}/edit`}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold rounded-xl border transition-colors hover:bg-black/5"
                    style={{
                      color: 'var(--color-text-main)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Proyek
                  </Link>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold rounded-xl border transition-colors"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'}
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Proyek
                  </button>
                </div>
              )}

              {/* Anonymous minimalist CTA (for sidebar) */}
              {!isClient && !isFreelancer && (
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Ingin mengajukan proposal?
                  </p>
                  <Link
                    to="/login"
                    className="block w-full py-3 text-sm font-extrabold text-white rounded-xl text-center transition-transform hover:scale-105 shadow-md"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Login / Daftar
                  </Link>
                </div>
              )}

              {/* Divider + about */}
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
                <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Informasi Klien
                </h3>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold uppercase"
                    style={{ backgroundColor: 'rgba(217,30,46,0.1)', color: 'var(--color-primary)' }}
                  >
                    {job.clientName ? job.clientName.charAt(0) : 'C'}
                  </div>
                  <div>
                    <div className="text-base font-bold" style={{ color: 'var(--color-text-main)' }}>
                      {job.clientName || 'Klien Terverifikasi'}
                    </div>
                    {job.createdAt ? (
                      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Diposting {formatDate(job.createdAt)}</div>
                    ) : (
                      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Remote</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter variant="light" />

      {/* Submit Proposal Modal */}
      <Modal
        isOpen={proposalModalOpen}
        onClose={() => !submittingProposal && setProposalModalOpen(false)}
        title="Ajukan Proposal"
      >
        <div className="px-6 py-4">
          <div className="p-4 rounded-xl mb-6 flex items-start gap-3" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600 mt-0.5">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Anda akan mengirimkan penawaran kepada <strong style={{ color: 'var(--color-text-main)' }}>{job.clientName || 'klien'}</strong>. Klien akan meninjau penawaran Anda dan berhak melakukan negosiasi jika diperlukan.
              </p>
            </div>
          </div>
          <ProposalForm
            onSubmit={handleSubmitProposal}
            submitting={submittingProposal}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Hapus Lowongan">
        <div className="p-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            <Trash2 className="w-6 h-6" style={{ color: '#ef4444' }} />
          </div>
          <p className="text-center font-bold text-lg mb-2" style={{ color: 'var(--color-text-main)' }}>
            Hapus lowongan ini?
          </p>
          <p className="text-sm text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Lowongan <strong style={{ color: 'var(--color-text-main)' }}>"{job.title}"</strong> akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="flex-1 py-3 text-sm font-bold rounded-xl border transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-3 text-sm font-bold text-white rounded-xl transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-red-500/20"
              style={{ backgroundColor: '#ef4444' }}
            >
              {deleting ? 'Menghapus…' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}