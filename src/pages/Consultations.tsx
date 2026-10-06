import React, { useState, useEffect } from 'react';
import {
  UsersRound,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronDown,
  MessageSquare,
  Sparkles,
  MapPin,
  Video,
  CreditCard,
  Phone,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RESEARCH_STAGES } from '../constants/stages.ts';
import {
  HumanConsultation,
  ConsultationStatus,
  ConsultationMode,
  OFFICIAL_CONSULTANTS,
} from '../types/index.ts';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { syncToGoogleSheet } from '../lib/googleSheetSync.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

export const Consultations: React.FC = () => {
  const { currentUser, userProfile } = useAuth();

  const [subject, setSubject] = useState('');
  const [stageId, setStageId] = useState('01');
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('offline');
  const [selectedConsultantIds, setSelectedConsultantIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [consultations, setConsultations] = useState<HumanConsultation[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchUserConsultations = async () => {
    if (!currentUser) return;
    setLoadingList(true);
    try {
      const q = query(
        collection(db, 'consultations'),
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      const list: HumanConsultation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HumanConsultation, 'id'>),
      }));
      setConsultations(list);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      handleFirestoreError(err, OperationType.LIST, 'consultations');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUserConsultations();
  }, [currentUser]);

  const toggleConsultantSelection = (id: string) => {
    setSelectedConsultantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!userProfile?.libraryCardNumber) {
      setErrorBanner('Anda wajib mengisi Nomor Kartu Pustaka Provinsi Kepri di Profil sebelum mengajukan bimbingan.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setErrorBanner('Mohon lengkapi topik dan rincian pertanyaan konsultasi.');
      return;
    }

    if (selectedConsultantIds.length === 0) {
      setErrorBanner('Silakan pilih minimal satu atau beberapa konsultan yang Anda inginkan.');
      return;
    }

    setSubmitting(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    const nowIso = new Date().toISOString();
    const targetStage =
      RESEARCH_STAGES.find((s) => s.id === stageId) || RESEARCH_STAGES[0];

    const chosenNames = selectedConsultantIds.map(
      (cid) => OFFICIAL_CONSULTANTS.find((oc) => oc.id === cid)?.name || cid
    );

    try {
      const newRef = doc(collection(db, 'consultations'));
      const consultationData: Omit<HumanConsultation, 'id'> = {
        userId: currentUser.uid,
        userName: userProfile?.name || 'Konsulti',
        userEmail: currentUser.email || '',
        userPhone: userProfile?.phone || '',
        userLibraryCard: userProfile?.libraryCardNumber || '',
        consultantId: null,
        consultantName: null,
        preferredConsultantIds: selectedConsultantIds,
        preferredConsultantNames: chosenNames,
        consultationMode,
        assignedByAdminId: null,
        assignedByAdminName: null,
        subject: subject.trim(),
        stageId: targetStage.id,
        stageName: targetStage.title,
        message: message.trim(),
        response: '',
        status: 'waiting',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await setDoc(newRef, consultationData);

      // Background sync to Google Sheet webhook
      syncToGoogleSheet('NEW_CONSULTATION', {
        id: newRef.id,
        ...consultationData,
      }).catch((err) => console.warn('Google Sheet sync notice:', err));

      setSuccessBanner(
        'Permintaan konsultasi Anda berhasil dikirim! Koordinator Admin akan mengoordinasikan penugasan konsultan yang Anda pilih.'
      );
      setSubject('');
      setMessage('');
      setSelectedConsultantIds([]);
      fetchUserConsultations();
    } catch (err: any) {
      console.error('Error submitting consultation:', err);
      setErrorBanner('Gagal mengirim konsultasi. Silakan periksa koneksi Anda.');
      handleFirestoreError(err, OperationType.CREATE, 'consultations');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Menunggu Koordinasi Admin
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" />
            Konsultan Ditugaskan
          </span>
        );
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Sudah Dijawab
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Selesai
          </span>
        );
    }
  };

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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersRound className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Konsultasi Penelitian dengan Pakar
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau • Layanan bimbingan riset terstruktur bersama konsultan ahli.
          </p>
        </div>

        {/* User Card ID Pill */}
        <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 shrink-0">
          <CreditCard className="w-4 h-4 text-amber-700" />
          <span>No. Kartu Pustaka: <strong>{userProfile?.libraryCardNumber || '-'}</strong></span>
        </div>
      </div>

      {/* Form Submission */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          Formulir Pengajuan Bimbingan Riset Baru
        </h2>

        {successBanner && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {errorBanner && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Topik Konsultasi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Topik / Judul Konsultasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Formulasi Hipotesis & Instrumen Angket"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
              />
            </div>

            {/* Tahap Penelitian */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tahap Penelitian <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 pr-9 font-medium"
                >
                  {RESEARCH_STAGES.map((stg) => (
                    <option key={stg.id} value={stg.id}>
                      {stg.code} {stg.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mode Konsultasi: Offline vs Online */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilihan Mode Konsultasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                  consultationMode === 'offline'
                    ? 'bg-sky-50/70 border-sky-500 ring-1 ring-sky-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="consultationMode"
                  value="offline"
                  checked={consultationMode === 'offline'}
                  onChange={() => setConsultationMode('offline')}
                  className="sr-only"
                />
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Tatap Muka (OFFLINE)</span>
                  <span className="text-[11px] text-slate-500">
                    Di Dinas Perpustakaan dan Kearsipan Provinsi Kepri (10:00 - 15:00 WIB)
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-colors ${
                  consultationMode === 'online'
                    ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="consultationMode"
                  value="online"
                  checked={consultationMode === 'online'}
                  onChange={() => setConsultationMode('online')}
                  className="sr-only"
                />
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Daring (ONLINE Zoom)</span>
                  <span className="text-[11px] text-slate-500">
                    Sesi virtual interaktif via tautan Zoom meeting resmi
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* PILIHAN BEBERAPA KONSULTAN YANG DIINGINKAN (PER REQUEST USER) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Pilih Beberapa Konsultan yang Anda Inginkan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                {selectedConsultantIds.length} Konsultan Dipilih
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Anda dapat mencentang lebih dari satu konsultan. Koordinator Admin akan mengalokasikan konsultan yang paling selaras dengan topik Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {OFFICIAL_CONSULTANTS.map((cons) => {
                const isSelected = selectedConsultantIds.includes(cons.id);
                return (
                  <div
                    key={cons.id}
                    onClick={() => toggleConsultantSelection(cons.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {cons.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                        {cons.expertise}
                      </p>
                      <span className="text-[10px] text-sky-700 font-semibold block mt-1">
                        Jadwal: {cons.schedule}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pertanyaan atau Masalah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Rincian Pertanyaan, Kendala, atau Draf yang Ingin Dikonsultasikan <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Jelaskan secara spesifik masalah riset, instrumen yang perlu ditelaah, atau pertanyaan metodologi..."
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Permintaan Konsultasi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User's Consultation Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <span>Daftar Permintaan Konsultasi Saya</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {consultations.length} Permintaan
          </span>
        </h2>

        {loadingList ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p>Belum ada konsultasi yang diajukan. Gunakan formulir di atas untuk mengajukan pertanyaan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 space-y-2.5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Tahap {item.stageId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
                      Mode: {item.consultationMode || 'offline'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.subject}
                    </h3>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Preferred vs Assigned Consultant */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-[11px] space-y-1">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700">Pilihan Konsultan Diinginkan:</span>{' '}
                    {(item.preferredConsultantNames && item.preferredConsultantNames.length > 0)
                      ? item.preferredConsultantNames.join(', ')
                      : 'Belum ditentukan'}
                  </div>

                  <div className="text-slate-700 font-semibold">
                    <span>Konsultan Pembimbing (PIC):</span>{' '}
                    {item.consultantName ? (
                      <span className="text-emerald-700 font-bold">{item.consultantName}</span>
                    ) : (
                      <span className="text-amber-600 italic">Sedang dikoordinasikan oleh Admin</span>
                    )}
                    {item.assignedByAdminName && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        (Dikoordinir oleh: {item.assignedByAdminName})
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 bg-white p-2.5 rounded-lg border border-slate-100">
                  {item.message}
                </p>

                {item.response && (
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span>Tanggapan dari Konsultan {item.consultantName ? `(${item.consultantName})` : ''}:</span>
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {item.response}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Diajukan: {formatDate(item.createdAt)}</span>
                  <span>Diperbarui: {formatDate(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
