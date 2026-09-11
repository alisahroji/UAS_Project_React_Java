import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SiteFooter } from '../../components/brand/SiteFooter';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

import heroImage from '../../assets/hero-developer.jpg';
import collaborationImage from '../../assets/collaboration-client-developer.jpg';
import discoveryImage from '../../assets/project-discovery.jpg';

const BG_COLOR = '#fdfcfb';
const TEXT_DARK = '#1c1c1c';
const DEVLINK_RED = '#d91e2e';

export function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const isClient = isAuthenticated && user?.role === 'CLIENT';
  const isFreelancer = isAuthenticated && user?.role === 'FREELANCER';

  const primaryCta = isClient
    ? { to: '/jobs/create', label: 'Posting Proyek Baru' }
    : isFreelancer
      ? { to: '/jobs', label: 'Cari Pekerjaan' }
      : { to: '/jobs', label: 'Cari Pekerjaan' };

  const [offsetY, setOffsetY] = useState(0);

  // Scroll to top on mount and parallax listener
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: BG_COLOR, color: TEXT_DARK, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* ================= 1. HERO (IMMERSIVE FULL-BLEED) ================= */}
      <section className="relative min-h-screen w-full flex items-center pt-20">
        {/* Background Image with subtle parallax */}
        <div 
          className="absolute inset-0 w-full h-full z-0 overflow-hidden"
          style={{ transform: `translateY(${offsetY * 0.3}px)` }}
        >
          <img 
            src={heroImage} 
            alt="Professional Web Developer working in premium workspace" 
            className="w-full h-full object-cover object-[70%_center] sm:object-[80%_center] devlink-kenburns scale-110"
          />
          {/* Gradient overlay specifically for text readability on the left, leaving the right subject exposed */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
          <div className="absolute inset-0 bg-black/20 sm:bg-transparent"></div> {/* Extra dim for mobile */}
        </div>

        {/* Subtitle / Supporting copy without the floating card */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 flex flex-col justify-center">
          <div className="max-w-4xl">
            <ScrollReveal animation="fade-up" delay={100}>
              <h1 className="text-[3.5rem] sm:text-[5.5rem] lg:text-[7.5rem] leading-[0.95] tracking-tight font-extrabold text-white mb-8">
                <span className="block opacity-95">Bangun</span>
                <span className="block opacity-95">Produk</span>
                <span className="block italic mt-2 text-white/90">bersama</span>
                <span className="block" style={{ color: DEVLINK_RED }}>Developer.</span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={300}>
              <p className="text-xl sm:text-2xl font-medium leading-relaxed mb-12 text-white/80 max-w-2xl">
                Platform premium untuk menemukan talenta digital. Diskusi langsung, negosiasi mandiri, dan eksekusi tanpa hambatan.
              </p>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={500}>
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <Link
                  to={primaryCta.to}
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-none text-white text-lg font-extrabold transition-all hover:bg-white hover:text-black w-full sm:w-auto"
                  style={{ backgroundColor: DEVLINK_RED }}
                >
                  {primaryCta.label} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= 2. DISCOVER (EDGE-TO-EDGE LEFT IMAGE) ================= */}
      <section className="relative w-full bg-[#fdfcfb]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Edge-to-edge image on the left */}
          <div className="relative w-full h-[50vh] lg:h-auto lg:min-h-[80vh] overflow-hidden">
            <img 
              src={discoveryImage} 
              alt="Discovering project requirements" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>

          {/* Typography block on the right */}
          <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-24 lg:py-40">
            <ScrollReveal animation="fade-left">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] mb-6" style={{ color: DEVLINK_RED }}>01 — Eksplorasi</h3>
              <h2 className="text-[2.5rem] sm:text-[4rem] xl:text-[5rem] font-extrabold leading-[0.95] tracking-tight mb-8">
                Temukan proyek <br/>
                <span className="italic opacity-50">yang pantas.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal animation="fade-left" delay={200}>
              <p className="text-lg sm:text-xl font-medium opacity-70 leading-relaxed mb-12 max-w-lg">
                Jelajahi marketplace dengan pekerjaan berkualitas tinggi. Kami menghilangkan sistem bidding buta yang merugikan. Di sini, keahlian teknis Anda dihargai secara profesional.
              </p>
            </ScrollReveal>
            
            <ul className="space-y-8 max-w-md">
              <ScrollReveal animation="fade-up" delay={300}>
                <li className="flex items-start gap-5">
                  <CheckCircle2 className="w-6 h-6 shrink-0 mt-1" style={{ color: DEVLINK_RED }} />
                  <div>
                    <h4 className="font-extrabold text-lg">Deskripsi Teknis Jelas</h4>
                    <p className="opacity-70 mt-1 font-medium">Setiap proyek mensyaratkan ekspektasi dan spesifikasi yang matang.</p>
                  </div>
                </li>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={400}>
                <li className="flex items-start gap-5">
                  <CheckCircle2 className="w-6 h-6 shrink-0 mt-1" style={{ color: DEVLINK_RED }} />
                  <div>
                    <h4 className="font-extrabold text-lg">Budget Transparan</h4>
                    <p className="opacity-70 mt-1 font-medium">Ketahui anggaran klien sejak awal tanpa tebak-tebakan.</p>
                  </div>
                </li>
              </ScrollReveal>
            </ul>
          </div>
          
        </div>
      </section>

      {/* ================= 3. CONNECT (EDGE-TO-EDGE RIGHT IMAGE) ================= */}
      <section className="relative w-full bg-[#1c1c1c] text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Typography block on the left */}
          <div className="order-2 lg:order-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 py-24 lg:py-40">
            <ScrollReveal animation="fade-right">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] mb-6" style={{ color: DEVLINK_RED }}>02 — Kolaborasi</h3>
              <h2 className="text-[2.5rem] sm:text-[4rem] xl:text-[5rem] font-extrabold leading-[0.95] tracking-tight mb-8">
                Dimulai dari <br/>
                <span className="italic opacity-50">koneksi yang tepat.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal animation="fade-right" delay={200}>
              <p className="text-lg sm:text-xl font-medium opacity-70 leading-relaxed mb-12 max-w-lg">
                DEVLINK bukanlah sekadar papan pengumuman lowongan. Kami menyediakan lingkungan tempat negosiasi terjalin secara langsung antara klien dan developer.
              </p>
            </ScrollReveal>
            
            <ScrollReveal animation="fade-up" delay={400}>
              <div className="p-8 sm:p-10 bg-white/5 border border-white/10 rounded-none max-w-lg">
                <h4 className="font-extrabold text-xl mb-4">Negosiasi Live (WebSocket)</h4>
                <p className="opacity-70 font-medium leading-relaxed">Gunakan fitur pesan terintegrasi kami untuk membahas ruang lingkup pekerjaan dan langsung membuat penawaran balik secara real-time.</p>
              </div>
            </ScrollReveal>
          </div>

          {/* Edge-to-edge image on the right */}
          <div className="order-1 lg:order-2 relative w-full h-[50vh] lg:h-auto lg:min-h-[80vh] overflow-hidden">
            <img 
              src={collaborationImage} 
              alt="Client and developer collaborating" 
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
            />
          </div>
          
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="relative py-32 sm:py-48 px-4 sm:px-6 text-center bg-white overflow-hidden border-t border-black/5">
        {/* Decorative huge typography in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-[15vw] font-extrabold text-black/[0.04] whitespace-nowrap pointer-events-none select-none">
          DEVLINK WORKSPACE
        </div>
        
        <div className="relative z-10">
          <ScrollReveal animation="fade-up">
            <h2 className="text-[3.5rem] sm:text-[5.5rem] lg:text-[7rem] font-extrabold leading-[0.9] tracking-tight mb-12">
              Siap mencari <br/>
              <span className="italic" style={{ color: DEVLINK_RED }}>partner</span> digital?
            </h2>
          </ScrollReveal>
          
          <ScrollReveal animation="fade-up" delay={200}>
            <div className="flex justify-center">
              {isAuthenticated ? (
                <Link
                  to="/projects"
                  className="inline-flex items-center justify-center gap-3 px-12 py-6 rounded-none text-white text-xl font-extrabold transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: DEVLINK_RED }}
                >
                  Masuk ke Ruang Proyek <ArrowRight className="w-6 h-6" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 px-12 py-6 rounded-none text-white text-xl font-extrabold transition-transform hover:-translate-y-1"
                  style={{ backgroundColor: DEVLINK_RED }}
                >
                  Mulai Sekarang <ArrowRight className="w-6 h-6" />
                </Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <div className="mt-auto">
        <SiteFooter variant="light" />
      </div>

    </div>
  );
}
