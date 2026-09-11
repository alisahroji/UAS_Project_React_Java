import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { formatIDR, formatDateID, timeAgoID } from '../../utils/format';

const STATUS_STYLES = {
  OPEN: { label: 'Terbuka', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  IN_PROGRESS: { label: 'Berjalan', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  CLOSED: { label: 'Ditutup', color: '#e02d2d', bg: 'rgba(224,45,45,0.1)', border: 'rgba(224,45,45,0.2)' },
};

export function JobStatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { label: status, color: 'var(--color-text-muted)', bg: 'var(--color-surface-elevated)', border: 'var(--color-border)' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}

/**
 * Kartu lowongan gaya marketplace (Light Theme).
 */
export function JobCard({ job }) {
  const posted = timeAgoID(job.createdAt);
  const deadline = formatDateID(job.deadline);

  return (
    <article
      className="group relative bg-white border border-black/5 hover:border-primary/30 transition-all duration-300"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
    >
      <div className="flex flex-col sm:flex-row p-6 sm:p-8 gap-6 sm:gap-8">
        
        {/* Left Content (Info) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold uppercase shrink-0"
              style={{ backgroundColor: 'rgba(217,30,46,0.1)', color: 'var(--color-primary)' }}
            >
              {(job.clientName || 'C').charAt(0)}
            </div>
            <span className="text-sm font-bold truncate opacity-80" style={{ color: 'var(--color-text-main)' }}>
              {job.clientName || 'Klien'}
            </span>
            <span className="opacity-30">•</span>
            {posted && (
              <span className="text-xs font-semibold opacity-60 uppercase tracking-widest">
                {posted}
              </span>
            )}
            <div className="ml-auto sm:hidden">
              <JobStatusBadge status={job.status} />
            </div>
          </div>

          <Link to={`/jobs/${job.id}`} className="block mb-3">
            <h3 className="text-2xl sm:text-[1.75rem] font-extrabold leading-tight tracking-tight transition-colors group-hover:text-primary">
              {job.title}
            </h3>
          </Link>

          {job.description && (
            <p className="text-base leading-relaxed opacity-70 mb-5 line-clamp-2 max-w-3xl">
              {job.description}
            </p>
          )}

          {job.requiredSkills?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 text-xs font-bold bg-black/[0.03] text-black/70 rounded-none border border-black/5"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Content (Meta & CTA) */}
        <div className="sm:w-48 xl:w-64 sm:border-l border-black/5 sm:pl-8 flex flex-col justify-center sm:items-end gap-5">
          <div className="hidden sm:block">
            <JobStatusBadge status={job.status} />
          </div>
          
          <div className="text-left sm:text-right w-full">
            <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">Anggaran Proyek</div>
            <div className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--color-text-main)' }}>
              {formatIDR(job.budget)}
            </div>
          </div>
          
          {deadline && (
            <div className="text-left sm:text-right w-full">
              <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">Batas Waktu</div>
              <div className="text-sm font-bold flex items-center justify-start sm:justify-end gap-1.5 opacity-80">
                <Clock className="w-3.5 h-3.5" />
                {deadline}
              </div>
            </div>
          )}

          <div className="mt-2 w-full">
            <Link
              to={`/jobs/${job.id}`}
              className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 border border-black/10 text-sm font-extrabold transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary"
            >
              Lihat Detail
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
      </div>
    </article>
  );
}
