import React, { useState, useEffect, useMemo } from 'react';
import { jobService } from '../../services/jobService';
import { JobCard } from '../../components/jobs/JobCard';
import { JobCardSkeleton } from '../../components/jobs/JobCardSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, ChevronLeft, ChevronRight, FileText, Briefcase, FolderKanban } from 'lucide-react';
import { SiteFooter } from '../../components/brand/SiteFooter';
import { LogoMark } from '../../components/brand/brandAssets';

const PAGE_SIZE = 5;

function SkillPill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
      style={{
        color: active ? '#fff' : 'var(--color-text-muted)',
        backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface)',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        boxShadow: active ? '0 4px 12px rgba(217,30,46,0.15)' : 'none'
      }}
    >
      {label}
      {typeof count === 'number' && <span className={active ? "opacity-90" : "opacity-60"}>({count})</span>}
    </button>
  );
}

function SidebarCard({ title, children, action }) {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-border)`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-extrabold" style={{ color: 'var(--color-text-main)' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/**
 * FIND WORK — marketplace utama.
 */
export function JobMarketplace() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', sortBy: 'createdAt', direction: 'desc' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { user, isAuthenticated } = useAuth();
  const isClient = isAuthenticated && user?.role === 'CLIENT';

  // For clients, we only show their jobs
  const clientJobs = jobs.filter(j => j.clientId === user?.id);
  const displayJobs = isClient ? clientJobs : jobs;

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const data = await jobService.getJobs(filters);
        if (!ignore) {
          setJobs(data);
          setError(null);
          setPage(1);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Gagal memuat lowongan.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, [filters]);

  const applyFilters = (next) => {
    setSearchInput(next.search || '');
    setFilters(next);
  };

  const openJobs = displayJobs.filter((j) => j.status === 'OPEN');

  const pageCount = Math.max(1, Math.ceil(displayJobs.length / PAGE_SIZE));
  const pageJobs = useMemo(
    () => displayJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [displayJobs, page]
  );

  const skillCounts = useMemo(() => {
    const map = new Map();
    for (const job of displayJobs) {
      for (const s of job.requiredSkills || []) {
        const key = s.trim();
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [displayJobs]);

  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Terbaru' },
    { value: 'createdAt-asc', label: 'Terlama' },
    { value: 'budget-desc', label: 'Anggaran: Tinggi ke Rendah' },
    { value: 'budget-asc', label: 'Anggaran: Rendah ke Tinggi' },
    { value: 'deadline-asc', label: 'Deadline: Terdekat' },
    { value: 'deadline-desc', label: 'Deadline: Terjauh' },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* HERO / INTRO */}
      <div style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4">
                {isClient ? (
                  <>
                    <span style={{ color: 'var(--color-text-main)' }}>Kelola </span>
                    <span style={{ color: 'var(--color-primary)' }}>lowongan Anda.</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--color-text-main)' }}>Temukan </span>
                    <span style={{ color: 'var(--color-primary)' }}>proyek impian.</span>
                  </>
                )}
              </h1>
              <p className="text-lg sm:text-xl font-medium leading-relaxed opacity-70 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                {isClient 
                  ? 'Pantau status rekrutmen dan temukan talenta terbaik untuk proyek Anda.' 
                  : 'Platform terkurasi dengan klien terverifikasi. Tidak ada bidding buta.'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-6 shrink-0 animate-in fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-right">
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-50 mb-1">Status</div>
                <div className="text-xl font-extrabold">{loading ? '...' : openJobs.length} Lowongan Aktif</div>
              </div>
            </div>
          </div>

          {/* Search panel */}
          <div
            className="mt-10 rounded-2xl p-6 devlink-fade-up devlink-fade-up-2"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search input */}
              <form
                className="flex gap-3 flex-1"
                onSubmit={(e) => { e.preventDefault(); applyFilters({ ...filters, search: searchInput }); }}
              >
                <div className="relative flex-1 group">
                  <SearchIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <input
                    id="search-jobs"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari pekerjaan, teknologi, atau keahlian..."
                    disabled={loading}
                    aria-label="Cari lowongan"
                    className="w-full h-14 rounded-xl pl-12 pr-4 text-base font-medium outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-main)',
                    }}
                  />
                </div>

                {/* Sort select */}
                <div className="relative shrink-0 lg:w-56 group">
                  <select
                    id="sort-jobs"
                    value={`${filters.sortBy}-${filters.direction}`}
                    onChange={(e) => {
                      const [sortBy, direction] = e.target.value.split('-');
                      applyFilters({ ...filters, sortBy, direction });
                    }}
                    disabled={loading}
                    aria-label="Urutkan lowongan"
                    className="w-full h-14 rounded-xl pl-4 pr-10 text-sm font-bold appearance-none cursor-pointer outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ▾
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-8 h-14 text-sm font-extrabold text-white rounded-xl transition-all hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-50 shrink-0"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Cari <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Skill pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              <SkillPill
                label={`Semua (${displayJobs.length})`}
                active={!filters.search}
                onClick={() => applyFilters({ ...filters, search: '' })}
              />
              {skillCounts.map(([skill, count]) => (
                <SkillPill
                  key={skill}
                  label={skill}
                  count={count}
                  active={filters.search.toLowerCase() === skill.toLowerCase()}
                  onClick={() => applyFilters({ ...filters, search: skill })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT: feed + sidebar */}
      <div className="flex-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* MAIN feed */}
            <div className="lg:col-span-2">
              {!loading && !error && displayJobs.length > 0 && (
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/5">
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {isClient ? 'Daftar Lowongan Anda' : 'Pekerjaan Terbaru'}
                  </h2>
                  <p className="text-sm font-medium opacity-60">
                    Menampilkan {pageJobs.length} dari {displayJobs.length}
                    {filters.search ? ` untuk "${filters.search}"` : ''}
                  </p>
                </div>
              )}

              {error ? (
                <div style={{ filter: 'none' }}>
                  <ErrorState
                    title="Gagal memuat lowongan"
                    message={error}
                    onRetry={() => applyFilters({ ...filters })}
                  />
                </div>
              ) : loading ? (
                <div className="space-y-5">
                  {[...Array(4)].map((_, i) => <JobCardSkeleton key={i} />)}
                </div>
              ) : displayJobs.length === 0 ? (
                <div className="rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-border)` }}>
                  <EmptyState
                    title="Tidak ada lowongan ditemukan"
                    description={filters.search
                      ? `Tidak ada hasil untuk "${filters.search}". Coba kata kunci lain atau hapus pencarian.`
                      : 'Belum ada lowongan terbuka saat ini. Silakan kembali lagi nanti.'}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {pageJobs.map((job, idx) => (
                      <div key={job.id} className="devlink-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <JobCard job={job} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pageCount > 1 && (
                    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Navigasi halaman">
                      <button
                        type="button"
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        className="w-10 h-10 rounded-xl inline-flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-black/5"
                        style={{ backgroundColor: 'var(--color-surface)', border: `1px solid var(--color-border)`, color: 'var(--color-text-main)' }}
                        aria-label="Halaman sebelumnya"
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
                        aria-label="Halaman berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-6">
              {/* Profile / CTA card */}
              {isAuthenticated ? (
                <SidebarCard title="Profil Saya">
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg"
                      style={{ backgroundColor: 'rgba(217,30,46,0.1)', color: 'var(--color-primary)' }}
                    >
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-base truncate" style={{ color: 'var(--color-text-main)' }}>{user?.name}</p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {isClient ? 'Klien' : 'Freelancer'} · Web Developer
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:underline underline-offset-4"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Lihat profil publik <ArrowRight className="w-4 h-4" />
                  </Link>
                </SidebarCard>
              ) : (
                <div className="rounded-2xl p-7 text-white shadow-xl shadow-red-500/10" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #b3121f 100%)' }}>
                  <LogoMark size="md" />
                  <h3 className="text-lg font-extrabold mb-2 mt-4">Gabung DEVLINK</h3>
                  <p className="text-sm text-white/90 mb-6 leading-relaxed font-medium">
                    Buat akun gratis untuk mengajukan proposal, chat dengan klien, dan membangun reputasi profesional.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center w-full py-3 rounded-full bg-white text-sm font-extrabold transition-all hover:scale-[1.02] shadow-sm"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Mulai Gratis
                  </Link>
                </div>
              )}

              {/* Popular technologies */}
              {skillCounts.length > 0 && (
                <SidebarCard title="Teknologi Populer">
                  <div className="flex flex-wrap gap-2">
                    {skillCounts.slice(0, 6).map(([skill, count]) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-md text-xs font-bold"
                        style={{ backgroundColor: 'var(--color-background)', border: `1px solid var(--color-border)`, color: 'var(--color-text-muted)' }}
                      >
                        {skill} <span className="opacity-50 ml-1 font-medium">{count}</span>
                      </span>
                    ))}
                  </div>
                </SidebarCard>
              )}

              {/* Marketplace info */}
              <SidebarCard title="Jelajahi">
                <ul className="space-y-1.5">
                  {[
                    { icon: FileText, label: 'Proposal saya', to: isClient ? '/proposals/received' : '/proposals' },
                    { icon: Briefcase, label: 'Lowongan terbuka', to: '/jobs' },
                    { icon: FolderKanban, label: 'Proyek berjalan', to: '/projects' },
                  ].map(({ icon: Icon, label, to }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="flex items-center gap-3 text-sm font-bold py-2.5 rounded-lg px-3 -mx-3 transition-colors hover:bg-black/5 group"
                        style={{ color: 'var(--color-text-main)' }}
                      >
                        <Icon className="w-4 h-4 transition-colors" style={{ color: 'var(--color-text-muted)' }} />
                        {label}
                        <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" style={{ color: 'var(--color-primary)' }} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </SidebarCard>
            </aside>
          </div>
        </div>
      </div>

      <SiteFooter variant="light" />
    </div>
  );
}
