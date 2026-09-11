import React from 'react';
import { Link } from 'react-router-dom';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { formatDate } from './projectFormat';
import { formatIDR } from '../../utils/format';

export function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
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
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-lg font-bold truncate" style={{ color: 'var(--color-text-main)' }}>
              {project.jobTitle || project.title || 'Proyek Tanpa Judul'}
            </h3>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Freelancer: <span style={{ color: 'var(--color-text-main)' }}>{project.freelancerName || '—'}</span> · Klien: <span style={{ color: 'var(--color-text-main)' }}>{project.clientName || '—'}</span>
          </p>
          {project.startedAt && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Dimulai {formatDate(project.startedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="inline-flex items-center text-lg font-extrabold"
            style={{ color: 'var(--color-text-main)' }}
          >
            {formatIDR(project.agreedPrice)}
          </span>
          {project.agreedDurationDays && (
            <span
              className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
            >
              {project.agreedDurationDays} hari
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
