import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { ProjectStatusBadge, getProjectStatusLabel } from '../../components/projects/ProjectStatusBadge';
import { ReviewSection } from '../../components/projects/ReviewSection';
import { formatIDR, formatDateID } from '../../utils/format';
import {
  ArrowLeft, DollarSign, Clock, Calendar, Send, RotateCcw, CheckCircle2,
  User, Briefcase, AlertCircle, Lock,
} from 'lucide-react';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'submit' | 'resubmit' | 'revision' | 'complete'
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionError, setRevisionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setErrorStatus(null);
        const data = await projectService.getProjectById(id);
        if (!ignore) setProject(data);
      } catch (err) {
        if (!ignore) {
          setErrorStatus(err.status || null);
          if (err.status === 404) setError('Proyek tidak ditemukan.');
          else if (err.status === 403) setError('Anda bukan partisipan dalam proyek ini.');
          else setError(err.message || 'Gagal memuat detail proyek.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, [id]);

  const handleStatusChange = async (targetStatus, successTitle, successDescription, message) => {
    if (processing) return; // prevent duplicate submissions
    try {
      setProcessing(true);
      const updated = await projectService.updateProjectStatus(id, targetStatus, message);
      setProject(updated); // authoritative response from backend
      addToast({ title: successTitle, description: successDescription, variant: 'success' });
    } catch (err) {
      if (err.status === 403) addToast({ title: 'Akses Ditolak', description: err.message || 'Anda tidak diizinkan melakukan tindakan ini.', variant: 'error' });
      else if (err.status === 409 || err.status === 400) addToast({ title: 'Transisi Tidak Valid', description: err.message || 'Perubahan status ini tidak diizinkan.', variant: 'error' });
      else if (err.status === 404) addToast({ title: 'Proyek Tidak Ditemukan', description: 'Proyek mungkin telah dihapus.', variant: 'error' });
      else addToast({ title: 'Gagal', description: err.message || 'Tidak dapat memperbarui status proyek.', variant: 'error' });
      // Refresh from backend to stay authoritative even after an error
      try {
        const fresh = await projectService.getProjectById(id);
        setProject(fresh);
      } catch {
        // keep current state if refresh fails
      }
    } finally {
      setProcessing(false);
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
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {errorStatus === 403 ? <Lock className="w-8 h-8" style={{ color: '#ef4444' }} /> : <AlertCircle className="w-8 h-8" style={{ color: '#ef4444' }} />}
        </div>
        <p className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-main)' }}>
          {errorStatus === 404 ? 'Proyek tidak ditemukan' : errorStatus === 403 ? 'Akses Dibatasi' : 'Tidak Dapat Memuat Proyek'}
        </p>
        <p className="text-sm font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-sm font-bold transition-transform hover:-translate-x-1"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Proyek
        </button>
      </div>
    );
  }

  if (!project) return null;

  const isClient = !!user && user.id === project.clientId;
  const isFreelancer = !!user && user.id === project.freelancerId;
  const status = project.status;

  const isInProgress = status === 'IN_PROGRESS';
  const isSubmitted = status === 'SUBMITTED';
  const isRevision = status === 'REVISION';
  const isCompleted = status === 'COMPLETED';

  const canSubmit = isFreelancer && isInProgress;        // IN_PROGRESS -> SUBMITTED
  const canResubmit = isFreelancer && isRevision;        // REVISION -> SUBMITTED
  const canRequestRevision = isClient && isSubmitted;    // SUBMITTED -> REVISION
  const canComplete = isClient && isSubmitted;           // SUBMITTED -> COMPLETED
  const hasActions = canSubmit || canResubmit || canRequestRevision || canComplete;

  const CONFIRM_CONFIG = {
    submit: {
      title: 'Serahkan Pekerjaan',
      message: 'Apakah Anda yakin ingin menyerahkan pekerjaan untuk ditinjau? Klien dapat meminta revisi atau menyelesaikan proyek ini.',
      confirmLabel: 'Ya, Serahkan',
      target: 'SUBMITTED',
      successTitle: 'Pekerjaan Diserahkan',
      successDescription: 'Hasil kerja Anda telah dikirim ke klien untuk ditinjau.',
    },
    resubmit: {
      title: 'Serahkan Revisi',
      message: 'Kirim ulang pekerjaan yang telah direvisi? Klien akan meninjaunya kembali.',
      confirmLabel: 'Ya, Kirim Revisi',
      target: 'SUBMITTED',
      successTitle: 'Revisi Diserahkan',
      successDescription: 'Hasil revisi Anda telah dikirim ke klien.',
    },
    revision: {
      title: 'Minta Revisi',
      message: 'Minta revisi dari developer? Status proyek akan kembali untuk dikerjakan ulang.',
      confirmLabel: 'Ya, Minta Revisi',
      target: 'REVISION',
      successTitle: 'Revisi Diminta',
      successDescription: 'Developer telah diminta untuk merevisi pekerjaannya.',
    },
    complete: {
      title: 'Selesaikan Proyek',
      message: 'Selesaikan proyek ini? Tindakan ini final: lowongan akan ditutup dan proyek tidak dapat dibuka kembali.',
      confirmLabel: 'Ya, Selesaikan Proyek',
      target: 'COMPLETED',
      successTitle: 'Proyek Selesai',
      successDescription: 'Proyek telah selesai dan pekerjaan ditutup. Silakan tinggalkan ulasan.',
    },
  };

  const currentConfirm = confirmAction ? CONFIRM_CONFIG[confirmAction] : null;

  return (
    <div className="min-h-screen pb-24 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Back nav */}
      <div className="sticky top-16 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors group"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" style={{ color: 'var(--color-primary)' }} />
            <span className="group-hover:text-[var(--color-text-main)]">Kembali ke Proyek</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug mb-1" style={{ color: 'var(--color-text-main)' }}>
                {project.jobTitle || project.title || 'Proyek'}
              </h1>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {project.title && project.jobTitle && project.title !== project.jobTitle ? project.title : 'Ruang Kerja Proyek'}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <ProjectStatusBadge status={project.status} />
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex flex-wrap gap-4 p-5 rounded-xl mb-8" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(217,30,46,0.08)' }}>
                 <DollarSign className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Nilai Disepakati</div>
                <div className="text-lg font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                  {formatIDR(project.agreedPrice)}
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-px self-stretch opacity-60" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                 <Clock className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Durasi</div>
                <div className="text-sm font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                  {project.agreedDurationDays} Hari
                </div>
              </div>
            </div>
            {project.deadline && (
              <>
                <div className="hidden sm:block w-px self-stretch opacity-60" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                     <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Tenggat Waktu</div>
                    <div className="text-sm font-extrabold" style={{ color: 'var(--color-text-main)' }}>
                      {formatDateID(project.deadline)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <div className="flex items-center gap-4 p-4 rounded-xl transition-shadow hover:shadow-sm" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold uppercase shrink-0"
                style={{ backgroundColor: 'rgba(217,30,46,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(217,30,46,0.18)' }}
              >
                {(project.clientName || 'K').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Klien</div>
                <div className="text-base font-extrabold truncate" style={{ color: 'var(--color-text-main)' }}>
                  {project.clientName || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl transition-shadow hover:shadow-sm" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold uppercase shrink-0"
                style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                {(project.freelancerName || 'D').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Developer</div>
                <div className="text-base font-extrabold truncate" style={{ color: 'var(--color-text-main)' }}>
                  {project.freelancerName || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            {project.startedAt && <span className="bg-gray-50 px-2 py-1 rounded">Dimulai {formatDateID(project.startedAt)}</span>}
            {project.completedAt && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Selesai {formatDateID(project.completedAt)}</span>}
            {project.createdAt && <span className="bg-gray-50 px-2 py-1 rounded">Dibuat {formatDateID(project.createdAt)}</span>}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            {project.jobId && (
              <Link
                to={`/jobs/${project.jobId}`}
                className="inline-flex items-center gap-2 text-sm font-bold bg-gray-50 px-4 py-2 rounded-xl transition-all hover:bg-gray-100"
                style={{ color: 'var(--color-text-main)' }}
              >
                <Briefcase className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> Lihat Lowongan Pekerjaan
              </Link>
            )}
            {project.proposalId && (
              <Link
                to={`/proposals/${project.proposalId}`}
                className="inline-flex items-center gap-2 text-sm font-bold bg-gray-50 px-4 py-2 rounded-xl transition-all hover:bg-gray-100"
                style={{ color: 'var(--color-text-main)' }}
              >
                <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> Lihat Proposal Awal
              </Link>
            )}
          </div>
        </div>

        {/* Lifecycle stepper */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider mb-6" style={{ color: 'var(--color-text-main)' }}>
            Progress Pengerjaan
          </h2>
          <ol className="flex items-start" aria-label="Project lifecycle progress">
            {[
              { key: 'IN_PROGRESS', label: 'Dikerjakan' },
              { key: 'SUBMITTED', label: 'Diserahkan' },
              { key: 'COMPLETED', label: 'Selesai' },
            ].map((step, idx) => {
              const stepIndex = { IN_PROGRESS: 0, SUBMITTED: 1, REVISION: 1, COMPLETED: 2 }[status] ?? 0;
              const done = idx < stepIndex;
              const current = idx === stepIndex;
              const isLast = idx === 2;
              return (
                <li key={step.key} className={`flex ${isLast ? '' : 'flex-1'} items-start`} aria-current={current ? 'step' : undefined}>
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors z-10"
                      style={done
                        ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'white' }
                        : current
                          ? { backgroundColor: 'rgba(217,30,46,0.1)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)', boxShadow: '0 0 0 4px rgba(217,30,46,0.05)' }
                          : { backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      {done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </span>
                    <span className="text-[12px] font-extrabold whitespace-nowrap" style={{ color: current ? 'var(--color-primary)' : done ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                      {step.label}{current && status === 'REVISION' ? ' (Revisi)' : ''}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-1 mt-5 mx-2 rounded-full" style={{ backgroundColor: done ? 'var(--color-primary)' : 'var(--color-border)' }} />
                  )}
                </li>
              );
            })}
          </ol>
          {status === 'REVISION' && (
            <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-100 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-orange-800 mb-1">Klien meminta revisi atas pekerjaan Anda.</p>
                {project.revisionMessage ? (
                  <p className="font-medium text-orange-700 whitespace-pre-line">
                    &ldquo;{project.revisionMessage}&rdquo;
                  </p>
                ) : (
                  <p className="font-medium text-orange-700">Silakan lakukan perbaikan dan serahkan kembali.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action panel */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider mb-5" style={{ color: 'var(--color-text-main)' }}>
            Aksi Proyek
          </h2>

          {hasActions ? (
            <div className="flex flex-wrap gap-4">
              {canSubmit && (
                <button
                  onClick={() => setConfirmAction('submit')}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold text-white rounded-xl transition-transform hover:scale-105 disabled:opacity-50 shadow-md"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Send className="w-4 h-4" /> Serahkan Pekerjaan
                </button>
              )}
              {canResubmit && (
                <button
                  onClick={() => setConfirmAction('resubmit')}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold text-white rounded-xl transition-transform hover:scale-105 disabled:opacity-50 shadow-md"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <RotateCcw className="w-4 h-4" /> Serahkan Revisi
                </button>
              )}
              {canRequestRevision && (
                <button
                  onClick={() => {
                    setRevisionReason('');
                    setRevisionError(null);
                    setConfirmAction('revision');
                  }}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold rounded-xl border transition-colors hover:bg-gray-50 disabled:opacity-50"
                  style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <RotateCcw className="w-4 h-4" /> Minta Revisi
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => setConfirmAction('complete')}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold text-white rounded-xl transition-transform hover:scale-105 disabled:opacity-50 shadow-md"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Selesaikan Proyek
                </button>
              )}
            </div>
          ) : isSubmitted && isFreelancer ? (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm font-medium text-blue-800">
                Pekerjaan telah diserahkan. Menunggu klien untuk meninjau dan menyelesaikan proyek.
              </p>
            </div>
          ) : isInProgress && isClient ? (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex gap-3 items-center">
               <Clock className="w-5 h-5 text-gray-500 shrink-0" />
              <p className="text-sm font-medium text-gray-700">
                Menunggu developer untuk menyelesaikan dan menyerahkan pekerjaannya.
              </p>
            </div>
          ) : isCompleted ? (
            <div className="rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 shrink-0">
                <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <p className="text-lg font-extrabold mb-1" style={{ color: 'var(--color-success)' }}>
                  Proyek Telah Selesai{project.completedAt ? ` pada ${formatDateID(project.completedAt)}` : ''}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                  Pekerjaan ini telah ditutup dan tidak dapat diubah lagi. Anda dapat meninggalkan ulasan di bawah ini.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Status: {getProjectStatusLabel(status)} — Tidak ada aksi yang tersedia saat ini.
            </p>
          )}
        </div>

        {/* Reviews (component handles COMPLETED/participant/already-reviewed rules internally) */}
        <div className="mt-8">
          <ReviewSection project={project} />
        </div>
      </div>

      {/* Confirm modal (with revision reason form for SUBMITTED -> REVISION) */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => !processing && setConfirmAction(null)}
        title={currentConfirm?.title || ''}
      >
        <div className="p-8">
          <p className="text-center text-lg font-medium mb-8 leading-relaxed" style={{ color: 'var(--color-text-main)' }}>
            {currentConfirm?.message}
          </p>

          {confirmAction === 'revision' && (
            <div className="mb-8 text-left">
              <label htmlFor="revision-reason" className="block text-sm font-extrabold mb-2" style={{ color: 'var(--color-text-main)' }}>
                Alasan Revisi <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <textarea
                id="revision-reason"
                value={revisionReason}
                onChange={(e) => {
                  setRevisionReason(e.target.value);
                  if (revisionError) setRevisionError(null);
                }}
                rows={4}
                maxLength={1000}
                required
                disabled={processing}
                placeholder="Jelaskan revisi yang diperlukan..."
                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-[rgba(217,30,46,0.2)] disabled:opacity-60 resize-y"
                style={{
                  backgroundColor: 'var(--color-background)',
                  border: `1px solid ${revisionError ? '#ef4444' : 'var(--color-border)'}`,
                  color: 'var(--color-text-main)',
                }}
                aria-required="true"
                aria-invalid={!!revisionError}
                aria-describedby={revisionError ? 'revision-reason-error' : undefined}
              />
              {revisionError ? (
                <p id="revision-reason-error" className="mt-2 text-xs font-semibold" style={{ color: '#ef4444' }} role="alert">
                  {revisionError}
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Alasan ini akan dilihat oleh developer sebelum memperbaiki pekerjaan.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setConfirmAction(null)}
              disabled={processing}
              className="flex-1 py-3 text-sm font-bold rounded-xl border transition-colors hover:bg-gray-50"
              style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (confirmAction === 'revision') {
                  const reason = revisionReason.trim();
                  if (!reason) {
                    setRevisionError('Alasan revisi wajib diisi (tidak boleh kosong atau spasi saja).');
                    return;
                  }
                  setRevisionError(null);
                  handleStatusChange('REVISION', currentConfirm.successTitle, currentConfirm.successDescription, reason);
                  setConfirmAction(null);
                  return;
                }
                const cfg = currentConfirm;
                setConfirmAction(null);
                if (cfg) {
                  handleStatusChange(cfg.target, cfg.successTitle, cfg.successDescription);
                }
              }}
              disabled={processing}
              className="flex-1 py-3 text-sm font-extrabold rounded-xl transition-transform hover:scale-105 shadow-sm disabled:opacity-50"
              style={{
                color: 'white',
                backgroundColor: confirmAction === 'complete' ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            >
              {processing ? 'Memproses…' : currentConfirm?.confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
