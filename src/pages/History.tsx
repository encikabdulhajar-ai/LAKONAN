import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  ExternalLink,
  MessageSquare,
  Calendar,
  Clock,
  Compass,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PageId } from '../components/Navigation.tsx';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { AiSession } from '../types/index.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

interface HistoryProps {
  onContinueSession: (sessionId: string, stageId: string) => void;
  onNavigateToNew: () => void;
}

export const History: React.FC<HistoryProps> = ({ onContinueSession, onNavigateToNew }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [sessionToDelete, setSessionToDelete] = useState<AiSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSessions = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'aiSessions'),
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      const list: AiSession[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AiSession, 'id'>),
      }));
      setSessions(list);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      handleFirestoreError(err, OperationType.LIST, 'aiSessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentUser]);

  const handleDeleteSession = async () => {
    if (!sessionToDelete || !currentUser) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'aiSessions', sessionToDelete.id));
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch (err) {
      console.error('Error deleting session:', err);
      handleFirestoreError(err, OperationType.DELETE, `aiSessions/${sessionToDelete.id}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStageFilter === 'ALL' || s.stageId === selectedStageFilter;
    return matchesSearch && matchesStage;
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HistoryIcon className="w-5 h-5 text-sky-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Riwayat Konsultasi AI</h1>
          </div>
          <p className="text-xs text-slate-500">
            Daftar sesi tanya-jawab metodologi dan bimbingan akademik Anda bersama LAKONAN AI.
          </p>
        </div>

        <button
          onClick={onNavigateToNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mulai Konsultasi Baru</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari topik atau tahapan penelitian..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="ALL">Semua Tahapan Riset</option>
            {Array.from({ length: 16 }, (_, i) => {
              const num = String(i + 1).padStart(2, '0');
              return (
                <option key={num} value={num}>
                  Tahap {num}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-white rounded-2xl border border-slate-200 p-4 animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak ada sesi yang ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedStageFilter !== 'ALL'
              ? 'Tidak ada riwayat yang cocok dengan kata kunci pencarian Anda.'
              : 'Anda belum memiliki sesi konsultasi tersimpan. Buka LAKONAN AI untuk memulai konsultasi pertama.'}
          </p>
          <button
            onClick={onNavigateToNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
          >
            <span>Konsultasi Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                    Tahap {session.stageId}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 truncate">
                    {session.stageName}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                  {session.title}
                </h3>

                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Dibuat: {formatDate(session.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Aktivitas Terakhir: {formatDate(session.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onContinueSession(session.id, session.stageId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                  title="Lanjutkan Konsultasi"
                >
                  <span>Lanjutkan Konsultasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSessionToDelete(session)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Hapus Sesi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Sesi Konsultasi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sesi "<strong>{sessionToDelete.title}</strong>" beserta seluruh riwayat pesannya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={deleting}
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteSession}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Sesi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
