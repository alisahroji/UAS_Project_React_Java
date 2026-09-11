import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Code2, Eye, EyeOff, MessagesSquare, FileText, ShieldCheck, ArrowRight } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: MessagesSquare, title: 'Diskusi Sebelum Sepakat', text: 'Chat real-time antara klien dan developer sebelum kontrak disetujui.' },
  { icon: FileText, title: 'Negosiasi Interaktif', text: 'Kirim proposal dengan penawaran terstruktur — tawar-menawar hingga mencapai kesepakatan.' },
  { icon: ShieldCheck, title: 'Reputasi Terpercaya', text: 'Ulasan hanya berasal dari proyek yang benar-benar selesai. Tanpa manipulasi.' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await login({ email, password });
      addToast({
        title: 'Selamat datang kembali!',
        description: 'Berhasil login ke DEVLINK.',
        variant: 'success'
      });

      const from = location.state?.from?.pathname || '/jobs';
      navigate(from, { replace: true });
    } catch (error) {
      if (error.status === 401) {
        setErrors({ form: 'Email atau password salah.' });
      } else if (error.status === 500) {
        setErrors({ form: 'Kredensial tidak ditemukan. Pastikan email dan password Anda benar.' });
      } else {
        setErrors({ form: error.message || 'Terjadi kesalahan yang tidak terduga.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Brand panel — desktop only */}
      <aside
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #b3121f 0%, #e0311f 55%, #ef4444 100%)' }}
        aria-hidden="true"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 15%, #fff 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-white opacity-[0.04] blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white opacity-[0.04] blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">DEVLINK</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-6">
            Tempat web developer<br />dan proyek hebat<br />bertemu.
          </h1>
          <p className="text-white/90 text-lg leading-relaxed font-medium">
            Social freelance marketplace yang dibangun untuk kolaborasi nyata — dari pesan pertama hingga ulasan akhir.
          </p>

          <ul className="mt-12 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-1 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <div>
                  <p className="font-extrabold text-base mb-1">{title}</p>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm font-medium text-white/80">
          Belum punya akun DEVLINK?{' '}
          <Link to="/register" className="font-extrabold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-10 sm:py-16 bg-[#fdfcfb] relative overflow-hidden">
        {/* Subtle background glow for the form area */}
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-400 opacity-[0.015] blur-[100px] pointer-events-none"></div>
        
        {/* Subtle DEVLINK watermark */}
        <div className="absolute top-10 right-10 text-[8rem] font-extrabold tracking-tighter text-black/[0.02] pointer-events-none select-none z-0">
          DL.
        </div>

        {/* Editorial mini statement */}
        <div className="absolute top-12 left-12 hidden xl:flex items-center gap-4 opacity-40 pointer-events-none select-none">
          <div className="w-8 h-[1px] bg-black"></div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em]">Bangun. Terhubung. Berkarya.</span>
        </div>

        <div className="w-full max-w-[420px] mx-auto relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-main)' }}>DEVLINK</span>
          </div>

          <h2 className="text-3xl sm:text-[2.5rem] font-extrabold tracking-tight mb-3 leading-tight" style={{ color: 'var(--color-text-main)' }}>
            Masuk ke akun Anda.
          </h2>
          <p className="text-base font-medium mb-10" style={{ color: 'var(--color-text-muted)' }}>
            Selamat datang kembali — masukkan kredensial untuk melanjutkan.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input
              id="email"
              type="email"
              label="Alamat Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-4 top-[38px] transition-colors focus:outline-none hover:text-[var(--color-primary)]"
                style={{ color: 'var(--color-text-muted)' }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {errors.form && (
              <div className="p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-1" role="alert" style={{ backgroundColor: 'rgba(217,30,46,0.08)', border: '1px solid rgba(217,30,46,0.2)', color: 'var(--color-primary)' }}>
                {errors.form}
              </div>
            )}

            <Button type="submit" className="w-full py-3.5 text-base shadow-lg transition-transform hover:scale-[1.02] hover:shadow-red-500/20" loading={isSubmitting}>
              Masuk
            </Button>

            <p className="text-center text-sm font-medium mt-6" style={{ color: 'var(--color-text-muted)' }}>
              Belum punya akun?{' '}
              <Link to="/register" className="font-extrabold transition-colors hover:underline underline-offset-4" style={{ color: 'var(--color-primary)' }}>
                Daftar gratis
              </Link>
            </p>
          </form>

          <div className="mt-12 pt-8 flex items-center justify-center gap-2 text-xs font-bold" style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)' }}>
            <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <span>Social Freelance Marketplace for Web Developers</span>
          </div>
        </div>
      </main>
    </div>
  );
}
