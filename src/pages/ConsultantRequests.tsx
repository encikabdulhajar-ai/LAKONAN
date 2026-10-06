import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  CheckCircle2,
  FolderOpen,
  MessageSquare,
  Send,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  FileText,
  CreditCard,
  Phone,
  MapPin,
  Video,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { HumanConsultation, ConsultationStatus } from '../types/index.ts';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

export const ConsultantRequests: React.FC = () => {
  const { currentUser, userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'waiting' | 'assigned' | 'completed'>('waiting');
  const [consultations, setConsultations] = useState<HumanConsultation[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected consultation for viewing and responding
  const [selectedItem, setSelectedItem] = useState<HumanConsultation | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<ConsultationStatus>('answered');
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchConsultations = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'consultations'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      const list: HumanConsultation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HumanConsultation, 'id'>),
      }));
      setConsultations(list);
    } catch (err) {
      console.error('Error fetching consultant requests:', err);
      handleFirestoreError(err, OperationType.LIST, 'consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, [currentUser]);

  const waitingList = consultations.filter((c) => c.status === 'waiting');
  const assignedList = consultations.filter((c) => c.status === 'assigned');
  const completedList = consultations.filter(
    (c) => c.status === 'answered' || c.status === 'closed'
  );

  const currentList =
    activeTab === 'waiting'
      ? waitingList
      : activeTab === 'assigned'
      ? assignedList
      : completedList;

  const handleOpenDetail = (item: HumanConsultation) => {
    setSelectedItem(item);
    setResponseText(item.response || '');
    setNewStatus(item.status === 'waiting' ? 'answered' : item.status);
    setActionSuccess(null);
  };

  const handleAssignToMe = async (item: HumanConsultation) => {
    if (!currentUser) return;
    setUpdating(true);
    try {
      const docRef = doc(db, 'consultations', item.id);
      const updateData = {
        consultantId: currentUser.uid,
        consultantName: userProfile?.name || 'Konsultan LAKONAN',
        status: 'assigned',
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, updateData);

      setConsultations((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, ...updateData, status: 'assigned' as const } : c))
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem((prev) => (prev ? { ...prev, ...updateData, status: 'assigned' as const } : null));
      }
      setActionSuccess('Konsultasi berhasil ditugaskan ke Anda.');
    } catch (err) {
      console.error('Error assigning consultation:', err);
      handleFirestoreError(err, OperationType.UPDATE, `consultations/${item.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedItem || !currentUser) return;
    setUpdating(true);
    try {
      const docRef = doc(db, 'consultations', selectedItem.id);
      const updateData = {
        response: responseText.trim(),
        status: newStatus,
        consultantId: selectedItem.consultantId || currentUser.uid,
        consultantName: selectedItem.consultantName || userProfile?.name || 'Konsultan LAKONAN',
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, updateData);

      setConsultations((prev) =>
        prev.map((c) => (c.id === selectedItem.id ? { ...c, ...updateData } : c))
      );
      setSelectedItem((prev) => (prev ? { ...prev, ...updateData } : null));
      setActionSuccess('Tanggapan dan status konsultasi berhasil disimpan.');
    } catch (err) {
      console.error('Error saving consultant response:', err);
      handleFirestoreError(err, OperationType.UPDATE, `consultations/${selectedItem.id}`);
    } finally {
      setUpdating(false);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Permintaan Konsultasi Akademik
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Dinas Perpustakaan dan Kearsipan Provinsi Kepri • Panel penelaahan pertanyaan metodologi dan bimbingan konsulti.
          </p>
        </div>

        <button
          onClick={fetchConsultations}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 self-start sm:self-auto"
        >
          Perbarui Data
        </button>
      </div>

      {/* Consultant Profile Notice if Incomplete */}
      {(!userProfile?.consultantExpertise || !userProfile?.consultantBio) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold">Harap Lengkapi Profil Konsultan Anda</h4>
              <p className="text-[11px] text-amber-800">
                Lengkapi bidang kepakaran, biografi singkat, dan jam bimbingan di menu Profil agar konsulti dapat mengenal keahlian Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Permintaan Baru, Sedang Ditangani, Selesai */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('waiting')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'waiting'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Permintaan Baru</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
            {waitingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'assigned'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Sedang Ditangani</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
            {assignedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Selesai</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
            {completedList.length}
          </span>
        </button>
      </div>

      {/* Main Grid: List and Detail Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List of items */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : currentList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p>Tidak ada konsultasi dalam kategori ini.</p>
            </div>
          ) : (
            currentList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedItem?.id === item.id
                    ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    Tahap {item.stageId}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                  {item.subject}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                  {item.message}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1 truncate font-medium">
                    <User className="w-3 h-3 text-slate-400" />
                    {item.userName || 'Peneliti'}
                  </span>
                  {item.consultantName && (
                    <span className="text-blue-700 font-semibold truncate">
                      PIC: {item.consultantName}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column: Detail & Response Workbench */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-sky-700 uppercase">
                    Detail Pertanyaan Konsultasi
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {selectedItem.subject}
                  </h2>
                </div>

                {selectedItem.status === 'waiting' && (
                  <button
                    disabled={updating}
                    onClick={() => handleAssignToMe(selectedItem)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Tugaskan ke Saya
                  </button>
                )}
              </div>

              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Inquirer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Konsulti / Peneliti:</span>
                  <span className="font-bold text-slate-900">{selectedItem.userName || '-'}</span>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedItem.userEmail || '-'}</div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">No. Kartu Pustaka Kepri:</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-amber-600" />
                    {selectedItem.userLibraryCard || 'Belum diisi'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor WhatsApp:</span>
                  {selectedItem.userPhone ? (
                    <a
                      href={`https://wa.me/${selectedItem.userPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {selectedItem.userPhone}
                    </a>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Mode Bimbingan & Tahap:</span>
                  <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                    {selectedItem.consultationMode === 'online' ? (
                      <Video className="w-3 h-3 text-blue-600" />
                    ) : (
                      <MapPin className="w-3 h-3 text-sky-600" />
                    )}
                    <span className="uppercase text-[11px] font-bold text-sky-800">
                      {selectedItem.consultationMode || 'offline'}
                    </span>
                    <span>• Tahap {selectedItem.stageId}</span>
                  </span>
                </div>

                {selectedItem.preferredConsultantNames && selectedItem.preferredConsultantNames.length > 0 && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Pilihan Konsultan yang Diinginkan Konsulti:</span>
                    <p className="text-[11px] font-semibold text-blue-900 mt-0.5">
                      {selectedItem.preferredConsultantNames.join(' • ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Pertanyaan & Kendala:
                </label>
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedItem.message}
                </div>
              </div>

              {/* Response Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Tulis Tanggapan Konsultan:
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 font-medium">Ubah Status:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ConsultationStatus)}
                      className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                    >
                      <option value="assigned">Sedang Ditangani (assigned)</option>
                      <option value="answered">Sudah Dijawab (answered)</option>
                      <option value="closed">Selesai (closed)</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Tuliskan telaah ilmiah, arahan metodologis, koreksi variabel, dan saran perbaikan untuk peneliti..."
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
                />

                <div className="flex justify-end">
                  <button
                    disabled={updating || !responseText.trim()}
                    onClick={handleSaveResponse}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{updating ? 'Menyimpan...' : 'Simpan & Kirim Tanggapan'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-200" />
              <p>Pilih salah satu konsultasi di sebelah kiri untuk membaca dan memberikan tanggapan ahli.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
