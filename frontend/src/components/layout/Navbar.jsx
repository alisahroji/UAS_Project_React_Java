import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { LogoWordmark } from '../brand/brandAssets';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();

  const isClient = isAuthenticated && user?.role === 'CLIENT';
  const isFreelancer = isAuthenticated && user?.role === 'FREELANCER';
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = isAuthenticated
    ? [
        { name: 'Beranda', href: '/' },
        isFreelancer
          ? { name: 'Cari Pekerjaan', href: '/jobs' }
          : { name: 'Lowongan Saya', href: '/jobs' },
        isFreelancer
          ? { name: 'Proposal Saya', href: '/proposals' }
          : { name: 'Proposal Masuk', href: '/proposals/received' },
        { name: 'Pesan', href: '/messages' },
        { name: 'Ruang Proyek', href: '/projects' },
      ]
    : [
        { name: 'Beranda', href: '/' },
        { name: 'Cari Pekerjaan', href: '/jobs' },
      ];

  const isActive = (item) =>
    item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);

  const handleLogout = () => {
    logout();
    addToast({
      title: 'Berhasil Keluar',
      description: 'Anda telah keluar dari DEVLINK.',
      variant: 'info'
    });
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? isLanding 
            ? 'bg-[#fdfcfb]/95 backdrop-blur-md shadow-sm border-b border-[#e6e4df]' 
            : 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 shrink-0 transition-transform hover:scale-105" aria-label="DEVLINK — beranda">
              <LogoWordmark variant={!scrolled && isLanding ? "light" : "dark"} />
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-12 lg:flex lg:space-x-2">
              {navigation.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative inline-flex items-center px-4 py-2 text-[13px] font-extrabold uppercase tracking-widest rounded-full transition-all duration-300
                      ${active 
                        ? (!scrolled && isLanding ? 'text-white bg-white/10' : 'text-[var(--color-primary)] bg-red-50/80')
                        : (!scrolled && isLanding ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')
                      }`}
                  >
                    {item.name}
                    {active && (
                      <span className="absolute bottom-1.5 left-1/2 w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full -translate-x-1/2"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right side (Auth/Profile) */}
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className={`text-[13px] font-extrabold uppercase tracking-widest px-4 py-2 transition-colors ${
                    !scrolled && isLanding ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-2.5 rounded-full text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Posting Proyek
                </Link>
              </>
            ) : (
              <>
                {isClient && (
                  <Link
                    to="/jobs/create"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-extrabold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md mr-2"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Posting Proyek
                  </Link>
                )}
                <div className="flex items-center gap-4 border-l border-gray-200 pl-4 py-2">
                  <Link to="/profile" className="flex items-center gap-3 group" title="Lihat profil">
                    <div className="p-1.5 rounded-full bg-gray-50 border border-gray-200 transition-all group-hover:bg-[rgba(217,30,46,0.08)] group-hover:border-[var(--color-primary)]">
                      <User className="h-4 w-4 text-gray-500 group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>
                    <div className="leading-tight text-right">
                      <div className={`font-extrabold text-[13px] transition-colors ${
                        !scrolled && isLanding ? 'text-white group-hover:text-white/80' : 'text-gray-900 group-hover:text-[var(--color-primary)]'
                      }`}>
                        {user?.name}
                      </div>
                      <div className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        !scrolled && isLanding ? 'text-white/60' : 'text-gray-400'
                      }`}>
                        {isFreelancer ? 'Developer' : 'Klien'}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    aria-label="Keluar"
                    title="Keluar"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)]"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Buka menu utama</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden absolute w-full shadow-lg border-t ${isLanding ? 'bg-[#f7f6f3] border-[#e6e4df]' : 'bg-white border-gray-100'}`}>
          <div className="pt-4 pb-4 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-6 py-3 text-[13px] font-extrabold uppercase tracking-widest border-l-4 transition-colors
                    ${active 
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-red-50/50' 
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
            {isAuthenticated && (
              <Link
                to="/profile"
                className={`flex items-center px-6 py-3 text-[13px] font-extrabold uppercase tracking-widest border-l-4 transition-colors
                  ${location.pathname.startsWith('/profile')
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-red-50/50'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="mr-3 h-4 w-4" />
                Profil Saya
              </Link>
            )}
          </div>
          <div className="pt-4 pb-6 border-t border-gray-100 bg-gray-50">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-3 px-6">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center text-sm font-extrabold">Masuk ke Akun</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center text-sm font-extrabold">Daftar Sekarang</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-3 rounded-full bg-gray-50 border border-gray-100">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-gray-900">{user?.name}</div>
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-primary)] mt-0.5">{isFreelancer ? 'Developer' : 'Klien'}</div>
                  </div>
                </div>
                {isClient && (
                  <Link
                    to="/jobs/create"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-extrabold text-white rounded-xl shadow-md transition-transform hover:scale-105"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <PlusCircle className="w-4 h-4" /> Posting Proyek Baru
                  </Link>
                )}
                <Button variant="outline" className="w-full justify-center gap-2 text-sm font-extrabold border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Keluar dari Akun
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
