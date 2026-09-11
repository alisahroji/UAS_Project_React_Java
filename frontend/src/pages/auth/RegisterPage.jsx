import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Code2, Eye, EyeOff, Briefcase, GraduationCap, Check } from 'lucide-react';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    bio: '',
    skills: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password harus minimal 6 karakter';
    }

    if (!formData.role) {
      newErrors.role = 'Pilih peran Anda di DEVLINK';
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
      const payload = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      await register(payload);
      addToast({
        title: 'Registrasi Berhasil',
        description: 'Akun Anda telah dibuat. Silakan login.',
        variant: 'success'
      });
      navigate('/login');
    } catch (error) {
      if (error.status === 409) {
        setErrors({ email: 'Email sudah terdaftar.' });
      } else {
        setErrors({ form: error.message || 'Terjadi kesalahan yang tidak terduga.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ROLE_OPTIONS = [
    {
      value: 'CLIENT',
      icon: Briefcase,
      title: 'Saya ingin Merekrut',
      text: 'Buat lowongan, tinjau proposal, dan kelola proyek.',
    },
    {
      value: 'FREELANCER',
      icon: GraduationCap,
      title: 'Saya seorang Developer',
      text: 'Cari proyek, kirim penawaran, dan bangun reputasi.',
    },
  ];

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
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white opacity-[0.04] blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white opacity-[0.04] blur-3xl"></div>

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
            Bergabung di<br />marketplace khusus<br />web developer.
          </h1>
          <p className="text-white/90 text-lg leading-relaxed font-medium">
            Satu akun. Percakapan nyata, negosiasi terstruktur, dan reputasi yang dibangun dari hasil karya.
          </p>

          <ul className="mt-12 space-y-5">
            {['Chat real-time dengan klien & developer', 'Tawarkan harga, bukan sekadar melamar', 'Ulasan asli dari proyek yang selesai'].map((item) => (
              <li key={item} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span className="text-base font-bold text-white/95">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm font-medium text-white/80">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-extrabold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white transition-colors">
            Masuk di sini
          </Link>
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-10 sm:py-16 bg-[#fdfcfb] relative overflow-hidden">
        {/* Subtle background glow for the form area */}
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-400 opacity-[0.015] blur-[100px] pointer-events-none"></div>

        {/* Subtle DEVLINK watermark */}
        <div className="absolute bottom-10 right-10 text-[8rem] font-extrabold tracking-tighter text-black/[0.02] pointer-events-none select-none z-0">
          PRO.
        </div>

        {/* Editorial mini statement */}
        <div className="absolute top-12 left-12 hidden xl:flex items-center gap-4 opacity-40 pointer-events-none select-none">
          <div className="w-8 h-[1px] bg-black"></div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em]">Bergabung dengan Jaringan Profesional</span>
        </div>

        <div className="w-full max-w-[500px] mx-auto relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-main)' }}>DEVLINK</span>
          </div>

          <h2 className="text-3xl sm:text-[2.5rem] font-extrabold tracking-tight mb-3 leading-tight" style={{ color: 'var(--color-text-main)' }}>
            Buat akun baru.
          </h2>
          <p className="text-base font-medium mb-10" style={{ color: 'var(--color-text-muted)' }}>
            Gratis untuk bergabung — beritahu kami siapa Anda dan tujuan Anda.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Role selection */}
            <div>
              <p className="text-sm font-extrabold mb-3" style={{ color: 'var(--color-text-main)' }}>
                Tujuan Anda di DEVLINK? <span aria-hidden="true" style={{ color: 'var(--color-primary)' }}>*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Account role">
                {ROLE_OPTIONS.map(({ value, icon: Icon, title, text }) => {
                  const selected = formData.role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isSubmitting}
                      onClick={() => setFormData(prev => ({ ...prev, role: value }))}
                      className="relative text-left rounded-2xl p-5 transition-all duration-300 disabled:opacity-60 bg-white"
                      style={{
                        border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        boxShadow: selected ? '0 8px 24px rgba(217,30,46,0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
                        transform: selected ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      {selected && (
                        <span className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center animate-in zoom-in" style={{ backgroundColor: 'var(--color-primary)' }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                      )}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors" style={{ backgroundColor: selected ? 'rgba(217,30,46,0.1)' : 'var(--color-background)' }}>
                         <Icon className="w-5 h-5" style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                      </div>
                      <p className="font-extrabold text-base mb-1" style={{ color: 'var(--color-text-main)' }}>{title}</p>
                      <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{text}</p>
                    </button>
                  );
                })}
              </div>
              {errors.role && (
                <p className="mt-2 text-xs font-bold animate-in fade-in" style={{ color: 'var(--color-primary)' }} role="alert">{errors.role}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                id="name"
                label="Nama Lengkap"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                disabled={isSubmitting}
              />

              <Input
                id="email"
                type="email"
                label="Alamat Email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                autoComplete="new-password"
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Textarea
                id="bio"
                label="Bio (Opsional)"
                placeholder="Ceritakan sedikit tentang Anda"
                value={formData.bio}
                onChange={handleChange}
                error={errors.bio}
                disabled={isSubmitting}
                rows={3}
              />

              <Input
                id="skills"
                label="Keahlian (Opsional)"
                placeholder="Pisahkan dengan koma (React, Java)"
                value={formData.skills}
                onChange={handleChange}
                error={errors.skills}
                disabled={isSubmitting}
              />
            </div>

            {errors.form && (
              <div className="p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-1" role="alert" style={{ backgroundColor: 'rgba(217,30,46,0.08)', border: '1px solid rgba(217,30,46,0.2)', color: 'var(--color-primary)' }}>
                {errors.form}
              </div>
            )}

            <Button type="submit" className="w-full py-3.5 text-base shadow-lg transition-transform hover:scale-[1.02] hover:shadow-red-500/20" loading={isSubmitting}>
              Buat Akun
            </Button>

            <p className="text-center text-sm font-medium mt-6" style={{ color: 'var(--color-text-muted)' }}>
              Sudah punya akun?{' '}
              <Link to="/login" className="font-extrabold transition-colors hover:underline underline-offset-4" style={{ color: 'var(--color-primary)' }}>
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
