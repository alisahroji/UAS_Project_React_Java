import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { ArrowLeft, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 5;

export function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const isClient = user?.role === 'CLIENT';

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await projectService.getMyProjects();
        if (!ignore) {
          // Sort projects: Active first, then newest
          const sorted = (data || []).sort((a, b) => {
            if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
            if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });
          setProjects(sorted);
          setPage(1);
        }
      } catch (err) {
        if (!ignore) {
          if (err.status === 401) setError('Please sign in to view your projects.');
          else if (err.status === 403) setError('You are not authorized to view projects.');
          else setError(err.message || 'Failed to load projects.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => { ignore = true; };
  }, [user]);

  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const pageProjects = useMemo(
    () => projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [projects, page]
  );

  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="min-h-screen pb-20 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <ErrorState
              title="Gagal memuat proyek"
              message={error}
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
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
            Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest mb-2" style={{ color: 'var(--color-primary)' }}>
              {isClient ? 'Workspace Klien' : 'Workspace Freelancer'}
            </p>
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-text-main)' }}>
              Proyek Aktif & Selesai
            </h1>
            <p className="text-base mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Pantau proyek berjalan Anda, berikan pembayaran/review, atau lihat proyek sebelumnya.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-8 flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                 <div className="h-16 w-full rounded-lg" style={{ backgroundColor: 'var(--color-border)', opacity: 0.5 }} />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <EmptyState
              title="Belum ada proyek berjalan"
              description="Proyek akan otomatis dibuat ketika proposal disetujui. Jelajahi marketplace untuk mendapatkan proyek!"
              action={
                <Link to="/jobs">
                  <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-extrabold text-white rounded-full transition-all hover:scale-105 shadow-md shadow-red-500/20" style={{ backgroundColor: 'var(--color-primary)' }}>
                    <LayoutDashboard className="w-4 h-4" /> Cari Lowongan
                  </button>
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pageProjects.map((project, idx) => (
                <div key={project.id} className="devlink-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <ProjectCard project={project} />
                </div>
              ))}
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
