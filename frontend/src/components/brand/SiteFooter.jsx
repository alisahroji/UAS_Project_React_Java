import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogoWordmark } from './brandAssets';

/**
 * DEVLINK site footer.
 * variant "dark"  — marketplace dark layout (Find Work page)
 * variant "light" — light Mayora pages (landing, others)
 *
 * Only real, existing routes are linked — no dead links, no fake socials.
 */
export function SiteFooter({ variant = 'light' }) {
  const { isAuthenticated, user } = useAuth();
  const isClient = isAuthenticated && user?.role === 'CLIENT';
  const isFreelancer = isAuthenticated && user?.role === 'FREELANCER';

  const dark = variant === 'dark';
  const bg = dark ? '#131013' : 'var(--color-surface)';
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'var(--color-border)';
  const headingColor = dark ? '#ffffff' : 'var(--color-text-main)';
  const textColor = dark ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)';
  const linkColor = dark ? 'rgba(255,255,255,0.75)' : 'var(--color-text-main)';

  const marketplaceLinks = [
    { label: isFreelancer ? 'Cari Pekerjaan' : 'Cari Developer', to: '/jobs' },
    ...(isClient ? [{ label: 'Posting Proyek', to: '/jobs/create' }] : []),
    { label: 'Proposal Saya', to: '/proposals' },
    ...(isClient ? [{ label: 'Proposal Masuk', to: '/proposals/received' }] : []),
    { label: 'Ruang Proyek', to: '/projects' },
    { label: 'Pesan & Negosiasi', to: '/messages' },
  ];

  const accountLinks = [
    ...(isAuthenticated ? [{ label: 'Profil Saya', to: '/profile' }] : []),
    ...(isAuthenticated
      ? []
      : [
          { label: 'Masuk ke Akun', to: '/login' },
          { label: 'Daftar Sekarang', to: '/register' },
        ]),
  ];

  return (
    <footer style={{ backgroundColor: bg, borderTop: `1px solid ${borderColor}` }} className="transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          {/* Brand */}
          <div className="max-w-sm">
            <LogoWordmark variant={dark ? 'light' : 'dark'} />
            <p className="mt-4 text-sm leading-relaxed font-medium" style={{ color: textColor }}>
              Ekosistem talenta terverifikasi yang menghubungkan web developer profesional dengan klien visioner di seluruh Indonesia.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-x-16 gap-y-10">
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-5" style={{ color: headingColor }}>
                Marketplace
              </h3>
              <ul className="space-y-3">
                {marketplaceLinks.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm font-semibold transition-colors"
                      style={{ color: linkColor }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#e5484d')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = linkColor)
                      }
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {accountLinks.length > 0 && (
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest mb-5" style={{ color: headingColor }}>
                  Akun & Pengaturan
                </h3>
                <ul className="space-y-3">
                  {accountLinks.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-sm font-semibold transition-colors"
                        style={{ color: linkColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e5484d')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <p className="text-xs font-bold" style={{ color: textColor }}>
            &copy; {new Date().getFullYear()} DEVLINK. Platform Freelance Web Developer.
          </p>
          <p className="text-xs font-bold" style={{ color: textColor }}>
            Dibuat untuk profesional di Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
