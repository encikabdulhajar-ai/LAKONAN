import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  UsersRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Calendar,
  Activity,
  BarChart3,
  Search,
  Filter,
  ExternalLink,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Eye,
  MapPin,
  Video,
  CreditCard,
  Phone,
  Shield,
  Crown,
  BookOpen,
  FileText,
  UserCheck,
  ChevronRight,
  Layers,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  HumanConsultation,
  UserProfile,
  OFFICIAL_CONSULTANTS,
  ConsultationStatus,
  ConsultationMode,
} from '../types/index.ts';
import { RESEARCH_STAGES } from '../constants/stages.ts';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';
import { PageId } from '../components/Navigation.tsx';

interface ServiceProgressDashboardProps {
  onNavigate?: (page: PageId, extra?: { stageId?: string; sessionId?: string }) => void;
}

export const ServiceProgressDashboard: React.FC<ServiceProgressDashboardProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, isAdmin, isSuperAdmin, isConsultant } = useAuth();

  const [consultations, setConsultations] = useState<HumanConsultation[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalAiSessions, setTotalAiSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConsultationStatus>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | ConsultationMode>('ALL');
  const [consultantFilter, setConsultantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewScope, setViewScope] = useState<'ALL' | 'MY_ASSIGNMENT'>('ALL');

  // Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<HumanConsultation | null>(null);

  const fetchServiceProgressData = async () => {
    if (!currentUser || !isConsultant) return;
    setLoading(true);
    try {
      // 1. Fetch all consultations
      const consultSnap = await getDocs(
        query(collection(db, 'consultations'), orderBy('updatedAt', 'desc'))
      );
      const consultList: HumanConsultation[] = consultSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HumanConsultation, 'id'>),
      }));
      setConsultations(consultList);

      // 2. Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const userList: UserProfile[] = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserProfile, 'uid'>),
      }));
      setUsers(userList);

      // 3. Fetch AI sessions count
      const aiSnap = await getDocs(collection(db, 'aiSessions'));
      setTotalAiSessions(aiSnap.size);
    } catch (err) {
      console.error('Error fetching service progress data:', err);
      handleFirestoreError(err, OperationType.LIST, 'consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceProgressData();
  }, [currentUser, isConsultant]);

  // Derived Metrics
  const totalConsultations = consultations.length;
  const waitingCount = consultations.filter((c) => c.status === 'waiting').length;
  const assignedCount = consultations.filter((c) => c.status === 'assigned').length;
  const completedCount = consultations.filter(
    (c) => c.status === 'answered' || c.status === 'closed'
  ).length;

  const offlineCount = consultations.filter((c) => c.consultationMode === 'offline').length;
  const onlineCount = consultations.filter((c) => c.consultationMode === 'online').length;

  const completionRate =
    totalConsultations > 0 ? Math.round((completedCount / totalConsultations) * 100) : 0;

  // Consultant-specific metrics
  const myAssignedConsultations = consultations.filter(
    (c) =>
      c.consultantId === currentUser?.uid ||
      (userProfile?.name && c.consultantName?.toLowerCase().includes(userProfile.name.toLowerCase()))
  );

  // Stage Breakdown
  const stageStats = RESEARCH_STAGES.map((stage) => {
    const count = consultations.filter((c) => c.stageId === stage.id).length;
    const percentage = totalConsultations > 0 ? Math.round((count / totalConsultations) * 100) : 0;
    return {
      stage,
      count,
      percentage,
    };
  }).sort((a, b) => b.count - a.count);

  // Filtered List for Table Tracker
  const filteredConsultations = consultations.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || c.consultationMode === modeFilter;
    const matchesConsultant =
      consultantFilter === 'ALL' ||
      c.consultantId === consultantFilter ||
      (c.consultantName && c.consultantName.includes(consultantFilter));

    const matchesScope =
      viewScope === 'ALL' ||
      c.consultantId === currentUser?.uid ||
      (userProfile?.name && c.consultantName?.toLowerCase().includes(userProfile.name.toLowerCase()));

    const queryLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.userName?.toLowerCase().includes(queryLower) ||
      c.userLibraryCard?.toLowerCase().includes(queryLower) ||
      c.subject?.toLowerCase().includes(queryLower) ||
      c.stageName?.toLowerCase().includes(queryLower) ||
      c.consultantName?.toLowerCase().includes(queryLower);

    return matchesStatus && matchesMode && matchesConsultant && matchesScope && matchesSearch;
  });

  const formatDate = (dateStr?: any) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return String(dateStr);
    }
  };

  const getStepProgress = (status: ConsultationStatus) => {
    switch (status) {
      case 'waiting':
        return { step: 1, label: 'Menunggu Koordinasi', color: 'text-amber-600 bg-amber-500' };
      case 'assigned':
        return { step: 2, label: 'Bimbingan Aktif (Ditugaskan)', color: 'text-blue-600 bg-blue-500' };
      case 'answered':
        return { step: 3, label: 'Telaah Selesai Diberikan', color: 'text-emerald-600 bg-emerald-500' };
      case 'closed':
        return { step: 4, label: 'Bimbingan Tuntas', color: 'text-slate-600 bg-slate-500' };
      default:
        return { step: 1, label: 'Menunggu', color: 'text-slate-600 bg-slate-500' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner / Role Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Monitoring Real-Time Layanan Riset</span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                isSuperAdmin
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                  : isAdmin
                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              }`}>
                {isSuperAdmin
                  ? 'Super Admin Otoritas'
                  : isAdmin
                  ? 'Koordinator Admin'
                  : 'Konsultan Akademik'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Dashboard Progress Layanan Konsultasi & Bimbingan
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau • Pantau alur bimbingan konsulti, distribusi 16 tahap penelitian, dan evaluasi beban kinerja konsultan secara komprehensif.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
            <button
              onClick={fetchServiceProgressData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Perbarui Data</span>
            </button>

            {isAdmin && onNavigate && (
              <button
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/30 transition-all hover:scale-105"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Panel Pengelolaan Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Consultations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Masuk</span>
            <UsersRound className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalConsultations}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {offlineCount} Tatap Muka • {onlineCount} Zoom
          </p>
        </div>

        {/* Card 2: Waiting for admin coordination */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Menunggu PIC</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
            {waitingCount}
          </div>
          <p className="text-[10px] text-amber-700/80 mt-1 font-semibold">
            Perlu Alokasi Admin
          </p>
        </div>

        {/* Card 3: Active In-Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sedang Bimbingan</span>
            <FolderOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
            {assignedCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Ditangani Konsultan
          </p>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Selesai / Dijawab</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {completedCount}
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">
            {completionRate}% Tingkat Selesai
          </p>
        </div>

        {/* Card 5: Registered Users with library card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Konsulti Terdaftar</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-900 font-mono">
            {users.length}
          </div>
          <p className="text-[10px] text-indigo-700 mt-1 truncate">
            Kartu Pustaka Kepri
          </p>
        </div>

        {/* Card 6: AI Sessions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sesi LAKONAN AI</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-800 font-mono">
            {totalAiSessions}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Bimbingan AI 16 Tahap
          </p>
        </div>
      </div>

      {/* SPECIAL CONSULTANT BANNER: JIKA LOGIN SEBAGAI KONSULTAN */}
      {isConsultant && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Beban & Progres Bimbingan Anda ({userProfile?.name})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {myAssignedConsultations.length} Konsulti Ditugaskan
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {myAssignedConsultations.filter((c) => c.status === 'assigned').length} bimbingan sedang aktif ditangani,{' '}
                {myAssignedConsultations.filter((c) => c.status === 'answered' || c.status === 'closed').length} telah selesai Anda telaah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewScope(viewScope === 'ALL' ? 'MY_ASSIGNMENT' : 'ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                viewScope === 'MY_ASSIGNMENT'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              {viewScope === 'MY_ASSIGNMENT' ? 'Tampilkan Semua Layanan' : 'Hanya Bimbingan Saya'}
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('permintaan-konsultasi')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Buka Workbench Bimbingan
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: GRAFIK & DISTRIBUSI 16 TAHAP PENELITIAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 16 Tahap Progress Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Distribusi Topik Menurut 16 Tahap Penelitian</span>
              </h2>
              <p className="text-xs text-slate-500">
                Memetakan tahapan riset yang paling intensif dikonsultasikan oleh konsulti.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              16 Tahapan Alur
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {stageStats.map(({ stage, count, percentage }) => (
              <div
                key={stage.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
                      {stage.code}
                    </span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{stage.title}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {count} Konsultasi ({percentage}%)
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Beban Kerja Dewan Konsultan Resmi (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Beban Bimbingan Konsultan</span>
              </h2>
              <p className="text-xs text-slate-500">
                Alokasi pembimbingan para pakar Dispusip Kepri.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {OFFICIAL_CONSULTANTS.length} Pakar
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {OFFICIAL_CONSULTANTS.map((cons) => {
              const assignedToThisCons = consultations.filter(
                (c) =>
                  c.consultantId === cons.id ||
                  (c.consultantName && c.consultantName.toLowerCase().includes(cons.name.toLowerCase()))
              );
              const activeCount = assignedToThisCons.filter((c) => c.status === 'assigned').length;
              const doneCount = assignedToThisCons.filter(
                (c) => c.status === 'answered' || c.status === 'closed'
              ).length;

              return (
                <div
                  key={cons.id}
                  className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-blue-300 transition-all text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">{cons.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0 font-mono">
                      {assignedToThisCons.length} Total
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1">{cons.expertise}</p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Aktif: <strong>{activeCount}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Selesai: <strong>{doneCount}</strong>
                    </span>
                    <span className="text-sky-800 font-semibold">{cons.schedule.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: TABEL PELACAKAN PROGRESS ALUR LAYANAN (LIVE SERVICE TRACKER) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              <span>Pelacakan Alur & Kemajuan Layanan Konsultasi</span>
            </h2>
            <p className="text-xs text-slate-500">
              Lacak setiap tahap bimbingan konsulti dari pengajuan awal, koordinasi admin, hingga telaah akhir konsultan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl font-mono">
              Menampilkan {filteredConsultations.length} dari {consultations.length} Data
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, kartu pustaka, topik..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-xs text-slate-800 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="ALL">Semua Status Layanan</option>
              <option value="waiting">Menunggu Koordinasi Admin</option>
              <option value="assigned">Sedang Ditangani Konsultan</option>
              <option value="answered">Sudah Dijawab / Ditelaah</option>
              <option value="closed">Selesai / Tuntas</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="ALL">Semua Mode Layanan</option>
              <option value="offline">Tatap Muka (OFFLINE)</option>
              <option value="online">Daring (ONLINE Zoom)</option>
            </select>
          </div>

          {/* Consultant Filter */}
          <div>
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="ALL">Semua Konsultan</option>
              {OFFICIAL_CONSULTANTS.map((oc) => (
                <option key={oc.id} value={oc.id}>
                  {oc.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tracker Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Konsulti & Kartu Pustaka</th>
                <th className="py-3 px-3.5">Topik & Tahapan Riset</th>
                <th className="py-3 px-3.5">Mode</th>
                <th className="py-3 px-3.5">Konsultan Pembimbing (PIC)</th>
                <th className="py-3 px-3.5">Kemajuan Alur Layanan</th>
                <th className="py-3 px-3.5">Waktu Update</th>
                <th className="py-3 px-3.5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data layanan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((item) => {
                  const progress = getStepProgress(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Column 1: Konsulti */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {item.userName || 'Konsulti'}
                          </span>
                          <span className="font-mono font-bold text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-flex items-center gap-1">
                            <CreditCard className="w-2.5 h-2.5 text-amber-600" />
                            {item.userLibraryCard || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Topik & Tahapan */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block line-clamp-1 max-w-[220px]">
                            {item.subject}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                            Tahap {item.stageId} • {item.stageName}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Mode */}
                      <td className="py-3 px-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.consultationMode === 'online'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}>
                          {item.consultationMode === 'online' ? (
                            <Video className="w-3 h-3 text-blue-700" />
                          ) : (
                            <MapPin className="w-3 h-3 text-sky-700" />
                          )}
                          <span className="uppercase">{item.consultationMode || 'offline'}</span>
                        </span>
                      </td>

                      {/* Column 4: Consultant PIC */}
                      <td className="py-3 px-3.5">
                        {item.consultantName ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block truncate max-w-[170px]">
                              {item.consultantName}
                            </span>
                            {item.assignedByAdminName && (
                              <span className="text-[10px] text-slate-400 block">
                                PIC dari: {item.assignedByAdminName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Menunggu Alokasi Admin
                          </span>
                        )}
                      </td>

                      {/* Column 5: Progress Bar */}
                      <td className="py-3 px-3.5 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className={progress.color.split(' ')[0]}>{progress.label}</span>
                            <span className="font-mono text-slate-400">Step {progress.step}/4</span>
                          </div>

                          {/* 4-Segment Progress Bar */}
                          <div className="grid grid-cols-4 gap-1">
                            {[1, 2, 3, 4].map((seg) => (
                              <div
                                key={seg}
                                className={`h-1.5 rounded-full ${
                                  seg <= progress.step
                                    ? progress.color.split(' ')[1]
                                    : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Date */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDate(item.updatedAt || item.createdAt)}
                      </td>

                      {/* Column 7: Action */}
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => setSelectedDetail(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL POPUP */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                  Rincian Kemajuan Bimbingan
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedDetail.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inquirer Identity Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Konsulti:</span>
                <span className="font-bold text-slate-900">{selectedDetail.userName || '-'}</span>
                <div className="text-slate-500 font-mono text-[11px]">{selectedDetail.userEmail || '-'}</div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">No. Kartu Pustaka Kepri:</span>
                <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-amber-600" />
                  {selectedDetail.userLibraryCard || 'Belum diisi'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Nomor WhatsApp:</span>
                {selectedDetail.userPhone ? (
                  <a
                    href={`https://wa.me/${selectedDetail.userPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {selectedDetail.userPhone}
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Mode Layanan & Tahap:</span>
                <span className="font-semibold text-slate-800">
                  <span className="uppercase font-bold text-sky-800">{selectedDetail.consultationMode || 'offline'}</span> • Tahap {selectedDetail.stageId}
                </span>
              </div>

              {selectedDetail.preferredConsultantNames && selectedDetail.preferredConsultantNames.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Konsultan yang Diajukan Konsulti:</span>
                  <span className="font-semibold text-blue-900">
                    {selectedDetail.preferredConsultantNames.join(' • ')}
                  </span>
                </div>
              )}
            </div>

            {/* PIC Assignment Box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
              <span className="text-slate-500 font-bold block text-[11px]">
                Konsultan Pembimbing Resmi (PIC):
              </span>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-950 text-sm">
                  {selectedDetail.consultantName || 'Belum Ditetapkan (Menunggu Koordinasi Admin)'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  selectedDetail.status === 'waiting'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedDetail.status === 'assigned'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Status: {selectedDetail.status}
                </span>
              </div>
            </div>

            {/* Inquiry Content */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800 block">Pertanyaan / Draf Riset Konsulti:</label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 whitespace-pre-wrap text-slate-800 leading-relaxed max-h-40 overflow-y-auto">
                {selectedDetail.message}
              </div>
            </div>

            {/* Consultant Response */}
            {selectedDetail.response && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-emerald-800 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Telaah & Tanggapan Ilmiah Konsultan:
                </label>
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 whitespace-pre-wrap text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedDetail.response}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
