import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  Calendar,
  Clock,
  Phone,
  QrCode,
  MapPin,
  Video,
  BookOpen,
  CheckCircle2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { OFFICIAL_CONSULTANTS } from '../types/index.ts';
import { LogoKepri } from './LogoKepri.tsx';

export const LoginView: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(
        err.message || 'Gagal masuk dengan Google. Pastikan jendela popup tidak diblokir oleh browser.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-blue-900 to-slate-950 text-white flex flex-col justify-between selection:bg-sky-400 selection:text-slate-950 font-sans">
      {/* Top Header per Flyer: Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau */}
      <header className="w-full bg-white text-slate-900 shadow-md border-b border-sky-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Provincial Logo Symbol Kepri */}
            <LogoKepri size="sm" />

            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-sky-950 tracking-tight uppercase leading-tight">
                Dinas Perpustakaan dan Kearsipan
              </h2>
              <p className="text-[11px] sm:text-xs font-bold text-sky-700 tracking-wide uppercase">
                Provinsi Kepulauan Riau
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <span>{signingIn ? 'Menghubungkan...' : 'Masuk / Daftar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Flyer Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center space-y-6 sm:space-y-8 relative">
        {/* FREE Ribbon Tag matching flyer */}
        <div className="relative w-full max-w-4xl flex justify-end pr-4 sm:pr-8 pointer-events-none">
          <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white font-black text-sm sm:text-base px-5 py-1.5 rounded-l-full rounded-r-md shadow-xl uppercase tracking-widest border-2 border-white rotate-[-6deg] animate-pulse">
            FREE
          </div>
        </div>

        {/* Visual Library Images Mockup Grid (reflecting the physical library pictures on flyer) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-3xl px-2">
          <div className="rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-sky-950/40 relative aspect-video group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80"
              alt="Ruang Baca & Riset Perpustakaan"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute bottom-2 left-2.5 z-20 text-[11px] font-bold text-sky-200">
              Ruang Konsultasi Riset
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-sky-950/40 relative aspect-video group hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80"
              alt="Koleksi Buku & Referensi Ilmiah"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute bottom-2 left-2.5 z-20 text-[11px] font-bold text-sky-200">
              Kajian Pustaka & Jurnal
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-sky-950/40 relative aspect-video group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80"
              alt="Bimbingan Metodologi Ilmiah"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute bottom-2 left-2.5 z-20 text-[11px] font-bold text-sky-200">
              Bimbingan Tatap Muka
            </span>
          </div>
        </div>

        {/* Centerpiece Official Logo Provinsi Kepulauan Riau */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="p-3 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl shadow-sky-950/60 ring-1 ring-white/30 hover:scale-105 transition-transform duration-300">
            <LogoKepri size="xl" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300 drop-shadow-md mt-2">
            Pemerintah Provinsi Kepulauan Riau
          </span>
        </div>

        {/* Big 3D Title Typography from Flyer: INOVASI LAKONAN */}
        <div className="text-center space-y-1">
          <span className="text-xs sm:text-sm font-extrabold tracking-widest text-sky-300 uppercase block">
            INOVASI
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white font-sans drop-shadow-[0_8px_16px_rgba(2,132,199,0.5)]">
            LAKONAN
          </h1>
          <h2 className="text-lg sm:text-2xl font-black tracking-wider text-sky-200 uppercase pt-1">
            LAYANAN KONSULTASI PENELITIAN
          </h2>
        </div>

        {/* BERSAMA Badge */}
        <div className="inline-block px-8 py-1.5 rounded-full bg-blue-950 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-md border border-sky-400/50">
          BERSAMA
        </div>

        {/* Official Consultants White Card from Flyer */}
        <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-sky-100 space-y-5">
          {/* List of 9 Official Consultants */}
          <div className="text-center space-y-2">
            <div className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {OFFICIAL_CONSULTANTS.map((c, idx) => (
                <React.Fragment key={c.id}>
                  <span className="hover:text-sky-700 transition-colors font-extrabold text-slate-900">
                    {c.title}
                  </span>
                  {idx < OFFICIAL_CONSULTANTS.length - 1 && (
                    <span className="text-sky-600 font-bold">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-600 pt-3 border-t border-slate-100 max-w-2xl mx-auto leading-relaxed">
              Dibuka untuk <strong>mahasiswa S1, S2</strong> dan <strong>Masyarakat umum</strong> yang melakukan penelitian. Membantu menemukan masalah, kajian pustaka, metodologi, referensi yang relevan dan Laporan penelitian.
            </p>
          </div>

          {/* Schedule & Operational Mode Pills per Flyer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-50 text-sky-950 text-xs font-bold border border-sky-100">
              <Calendar className="w-4 h-4 text-sky-700 shrink-0" />
              <span>senin - jum'at</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-50 text-sky-950 text-xs font-bold border border-sky-100">
              <Clock className="w-4 h-4 text-sky-700 shrink-0" />
              <span>10:00 - 15:00 WIB</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-50 text-blue-950 text-xs font-bold border border-blue-100">
              <Users className="w-4 h-4 text-blue-700 shrink-0" />
              <span>tersedia OFFLINE & ONLINE</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Primary Google Login CTA Button */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="inline-flex items-center gap-3.5 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm sm:text-base shadow-2xl shadow-sky-950/60 transition-all hover:scale-[1.03] active:scale-[0.98] border border-slate-200"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{signingIn ? 'Menghubungkan Akun...' : 'Masuk / Daftar Konsulti Baru'}</span>
          </button>

          <p className="text-xs text-sky-200">
            *Pengguna baru wajib menginput pasfoto dan Nomor Kartu Pustaka Provinsi Kepri.
          </p>
        </div>

        {/* Footer Contact Banner per Flyer (INFO LEBIH LANJUT & QR Code Zoom) */}
        <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-md rounded-2xl border border-sky-400/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider">
              INFO LEBIH LANJUT
            </span>
            <a
              href="https://wa.me/6281266689796"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm sm:text-base font-bold text-white hover:text-emerald-400 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>0812 6668 9796</span>
            </a>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-3.5 py-2 rounded-xl border border-white/20">
            <QrCode className="w-6 h-6 text-sky-300" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-sky-200 block">Scan / Akses</span>
              <span className="text-xs font-black text-white">Link Zoom Meeting</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950/80 border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau • Inovasi LAKONAN.
        </p>
      </footer>
    </div>
  );
};
