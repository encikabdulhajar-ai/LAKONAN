import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  History,
  UsersRound,
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Calendar,
  CreditCard,
  Phone,
  Briefcase,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PageId } from '../components/Navigation.tsx';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { AiSession, HumanConsultation, OFFICIAL_CONSULTANTS } from '../types/index.ts';
import { RESEARCH_STAGES } from '../constants/stages.ts';
import { LogoKepri } from '../components/LogoKepri.tsx';

interface DashboardProps {
  onNavigate: (page: PageId, extra?: { stageId?: string; sessionId?: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { userProfile, currentUser, isConsultant } = useAuth();
  const [recentAiSession, setRecentAiSession] = useState<AiSession | null>(null);
  const [totalAiSessions, setTotalAiSessions] = useState<number>(0);
  const [recentConsultation, setRecentConsultation] = useState<HumanConsultation | null>(null);
  const [totalConsultations, setTotalConsultations] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const aiQuery = query(
          collection(db, 'aiSessions'),
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc'),
          limit(1)
        );
        const aiSnap = await getDocs(aiQuery);
        if (!aiSnap.empty) {
          const doc = aiSnap.docs[0];
          setRecentAiSession({ id: doc.id, ...doc.data() } as AiSession);
        }

        const allAiQuery = query(
          collection(db, 'aiSessions'),
          where('userId', '==', currentUser.uid)
        );
        const allAiSnap = await getDocs(allAiQuery);
        setTotalAiSessions(allAiSnap.size);

        const consultQuery = query(
          collection(db, 'consultations'),
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc'),
          limit(1)
        );
        const consultSnap = await getDocs(consultQuery);
        if (!consultSnap.empty) {
          const doc = consultSnap.docs[0];
          setRecentConsultation({ id: doc.id, ...doc.data() } as HumanConsultation);
        }

        const allConsultQuery = query(
          collection(db, 'consultations'),
          where('userId', '==', currentUser.uid)
        );
        const allConsultSnap = await getDocs(allConsultQuery);
        setTotalConsultations(allConsultSnap.size);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const lastStage = recentAiSession
    ? RESEARCH_STAGES.find((s) => s.id === recentAiSession.stageId)
    : RESEARCH_STAGES[0];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'waiting':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Menunggu Koordinasi Admin</span>;
      case 'assigned':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Konsultan Ditugaskan</span>;
      case 'answered':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Sudah Dijawab</span>;
      case 'closed':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Selesai</span>;
      default:
        return null;
    }
  };

  const isConsultantProfileIncomplete = isConsultant && !userProfile?.consultantExpertise;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Consultant Profile Incomplete Warning Banner */}
      {isConsultantProfileIncomplete && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold">Lengkapi Profil Kepakaran Konsultan Anda</h4>
              <p className="text-[11px] text-amber-800">
                Sebagai konsultan akademik, silakan isi NIP, bidang kepakaran riset, dan jadwal bimbingan Anda di menu Profil.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('profil')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-colors"
          >
            Lengkapi Profil Sekarang
          </button>
        </div>
      )}

      {/* Main Welcome Hero Banner with Inovasi LAKONAN & Dispusip Kepri */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-sky-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-3.5 pb-1">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shrink-0 shadow-md">
              <LogoKepri size="sm" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-semibold border border-sky-400/30">
                  Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau
                </span>
                {userProfile?.libraryCardNumber && (
                  <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-semibold border border-amber-300/30 flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" />
                    <span>Kartu: {userProfile.libraryCardNumber}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Selamat Datang, {userProfile?.name || 'Konsulti'}
              </h1>
            </div>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            <strong>INOVASI LAKONAN (Layanan Konsultasi Penelitian)</strong> siap mendampingi mahasiswa S1, S2, dan masyarakat umum dalam menemukan masalah, kajian pustaka, formulasi instrumen, metodologi, dan penulisan laporan penelitian.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => onNavigate('lakonan-ai')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Konsultasi dengan LAKONAN AI</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('konsultasi')}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors"
            >
              <UsersRound className="w-4 h-4 text-sky-300" />
              <span>Ajukan Bimbingan ke Pakar</span>
            </button>

            {isConsultant && (
              <button
                onClick={() => onNavigate('progress-layanan')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-400/30 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Dashboard Progress Layanan</span>
              </button>
            )}
          </div>
        </div>

        {/* Schedule Strip on bottom of banner */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Senin - Jum'at (10:00 - 15:00 WIB)</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Tersedia OFFLINE & ONLINE Zoom</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Hotline: 0812 6668 9796</span>
          </div>
        </div>
      </div>

      {/* 3 Core Cards Required by Brief */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Riwayat Konsultasi AI */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <History className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {totalAiSessions} Sesi
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">Riwayat Konsultasi AI</h3>
            <p className="text-xs text-slate-500 mb-4">
              Akses kembali catatan bimbingan, pertanyaan, dan telaah metodologi sebelumnya.
            </p>

            {loading ? (
              <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ) : recentAiSession ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 mb-4">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                  <Compass className="w-3 h-3" />
                  <span className="truncate">{recentAiSession.stageName}</span>
                </div>
                <p className="text-xs font-medium text-slate-800 line-clamp-1">
                  {recentAiSession.title}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 mb-4">
                Belum ada sesi konsultasi AI yang tersimpan.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('riwayat')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
          >
            <span>Buka Riwayat Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Konsultasi dengan Konsultan */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <UsersRound className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {totalConsultations} Bimbingan
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">Konsultasi dengan Konsultan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ajukan pertanyaan khusus dengan memilih beberapa konsultan pakar yang Anda inginkan.
            </p>

            {loading ? (
              <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ) : recentConsultation ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {recentConsultation.subject}
                  </span>
                  {getStatusBadge(recentConsultation.status)}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  PIC: {recentConsultation.consultantName || 'Sedang dikoordinasikan admin'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 mb-4">
                Belum ada permohonan bimbingan ke pakar.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('konsultasi')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span>Ajukan Konsultasi ke Pakar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Tahap Penelitian Terakhir */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                Tahap {lastStage?.code || '01'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">Tahap Penelitian Terakhir</h3>
            <p className="text-xs text-slate-500 mb-4">
              Lanjutkan fokus metodologi pada tahapan riset yang sedang Anda kembangkan.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 mb-4">
              <h4 className="text-xs font-bold text-slate-900">{lastStage?.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">{lastStage?.description}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('lakonan-ai', { stageId: lastStage?.id })}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <span>Konsultasikan Tahap Ini</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dewan Konsultan Resmi Preview per Flyer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Dewan Konsultan Resmi Inovasi LAKONAN</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pakar bimbingan penelitian Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau.
            </p>
          </div>

          <button
            onClick={() => onNavigate('konsultasi')}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Pilih Konsultan</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OFFICIAL_CONSULTANTS.slice(0, 6).map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate('konsultasi')}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all text-left"
            >
              <h4 className="text-xs font-bold text-slate-900 truncate">{c.title}</h4>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{c.expertise}</p>
              <span className="text-[10px] text-blue-700 font-semibold block mt-1">
                {c.schedule}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 16 Tahapan Alur Penelitian */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">16 Tahapan Alur Penelitian Ilmiah</h3>
          </div>
          <span className="text-xs text-slate-500">Pilih tahapan untuk mulai berdiskusi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {RESEARCH_STAGES.map((stg) => (
            <button
              key={stg.id}
              onClick={() => onNavigate('lakonan-ai', { stageId: stg.id })}
              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-left transition-all group"
            >
              <div className="text-[11px] font-black text-sky-700 mb-0.5 group-hover:text-sky-800">
                {stg.code}
              </div>
              <div className="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">
                {stg.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
