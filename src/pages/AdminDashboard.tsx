import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  UserCheck,
  Sparkles,
  MessageSquare,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Crown,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Copy,
  Check,
  Phone,
  CreditCard,
  Building,
  User,
  Settings,
  Edit3,
  GraduationCap,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  UserProfile,
  UserRole,
  HumanConsultation,
  ROLE_DETAILS,
  OFFICIAL_CONSULTANTS,
  SystemSetting,
} from '../types/index.ts';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import {
  getSystemSettings,
  saveSystemSettings,
  syncToGoogleSheet,
  exportUsersToCsv,
  exportConsultationsToCsv,
  downloadCsvFile,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '../lib/googleSheetSync.ts';
import {
  exportToGoogleSheet,
  GoogleSheetExportResult,
} from '../services/googleSheetsService.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

export const AdminDashboard: React.FC = () => {
  const { currentUser, userProfile, isAdmin, isSuperAdmin, requestGoogleAccessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<'coordination' | 'users' | 'consultants' | 'googlesheet'>('coordination');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [consultations, setConsultations] = useState<HumanConsultation[]>([]);
  const [totalAiSessions, setTotalAiSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  // Coordination assignment state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [coordinationSuccess, setCoordinationSuccess] = useState<string | null>(null);

  // Users Filter & Search
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Add User / Admin State Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'user' as UserRole,
    phone: '',
    libraryCardNumber: '',
    institution: '',
    educationLevel: 'Mahasiswa Sarjana (S1)',
    studyProgram: '',
  });

  // Edit User State Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete User Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Google Sheet Integration Settings
  const [systemSettings, setSystemSettings] = useState<SystemSetting>({
    googleSheetWebhookUrl: '',
    googleSpreadsheetId: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!currentUser || !isAdmin) return;
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const userList: UserProfile[] = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserProfile, 'uid'>),
      }));
      setUsers(userList);

      // 2. Fetch Consultations
      const consultSnap = await getDocs(
        query(collection(db, 'consultations'), orderBy('updatedAt', 'desc'))
      );
      const consultList: HumanConsultation[] = consultSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HumanConsultation, 'id'>),
      }));
      setConsultations(consultList);

      // 3. Fetch AI Sessions Count
      const aiSnap = await getDocs(collection(db, 'aiSessions'));
      setTotalAiSessions(aiSnap.size);

      // 4. Fetch System Settings
      const settings = await getSystemSettings();
      setSystemSettings(settings);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      handleFirestoreError(err, OperationType.LIST, 'admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Akses Dibatasi</h2>
        <p className="text-xs text-slate-500">
          Halaman ini khusus untuk Administrator dan Super Admin sistem LAKONAN AI.
        </p>
      </div>
    );
  }

  // COORDINATION: Admin assigns a specific consultant to a konsulti
  const handleAssignConsultant = async (consultation: HumanConsultation, consultantId: string) => {
    if (!consultantId || !currentUser) return;
    setAssigningId(consultation.id);
    setCoordinationSuccess(null);

    const targetConsultant = OFFICIAL_CONSULTANTS.find((oc) => oc.id === consultantId);
    const consultantName = targetConsultant ? targetConsultant.name : consultantId;
    const adminName = userProfile?.name || 'Administrator';

    const nowIso = new Date().toISOString();
    const updatePayload = {
      consultantId,
      consultantName,
      assignedByAdminId: currentUser.uid,
      assignedByAdminName: adminName,
      status: 'assigned' as const,
      updatedAt: nowIso,
    };

    try {
      const docRef = doc(db, 'consultations', consultation.id);
      await updateDoc(docRef, updatePayload);

      setConsultations((prev) =>
        prev.map((c) => (c.id === consultation.id ? { ...c, ...updatePayload } : c))
      );

      // Sync assignment to Google Sheet Webhook
      syncToGoogleSheet('UPDATE_CONSULTATION', {
        ...consultation,
        ...updatePayload,
      }).catch((err) => console.warn('Google Sheet sync notice:', err));

      setCoordinationSuccess(
        `Berhasil mengalokasikan bimbingan ${consultation.subject} kepada ${consultantName}.`
      );
    } catch (err: any) {
      console.error('Error assigning consultant:', err);
      handleFirestoreError(err, OperationType.UPDATE, `consultations/${consultation.id}`);
    } finally {
      setAssigningId(null);
    }
  };

  // ADD USER / ADMIN: Super Admin can add Admin & Pengguna; Admin can add Pengguna
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    if (!isSuperAdmin && (newUserForm.role === 'admin' || newUserForm.role === 'super_admin')) {
      alert('Hanya Super Admin yang berhak menambahkan Administrator.');
      return;
    }

    setAddingUser(true);
    setActionFeedback(null);

    const generatedUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newUserData: UserProfile = {
      uid: generatedUid,
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim().toLowerCase(),
      role: newUserForm.role,
      phone: newUserForm.phone.trim(),
      libraryCardNumber: newUserForm.libraryCardNumber.trim().toUpperCase(),
      institution: newUserForm.institution.trim(),
      educationLevel: newUserForm.educationLevel,
      studyProgram: newUserForm.studyProgram.trim(),
      isProfileComplete: Boolean(newUserForm.libraryCardNumber.trim()),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(db, 'users', generatedUid), newUserData);
      setUsers((prev) => [newUserData, ...prev]);

      // Push to Google Sheet Webhook
      syncToGoogleSheet('NEW_USER', newUserData).catch((err) =>
        console.warn('Google Sheet sync notice:', err)
      );

      setActionFeedback(
        `Berhasil menambahkan ${newUserData.name} sebagai ${ROLE_DETAILS[newUserData.role]?.label}.`
      );
      setIsAddUserModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        role: 'user',
        phone: '',
        libraryCardNumber: '',
        institution: '',
        educationLevel: 'Mahasiswa Sarjana (S1)',
        studyProgram: '',
      });
    } catch (err: any) {
      console.error('Error adding user:', err);
      alert('Gagal menambahkan pengguna: ' + err?.message);
    } finally {
      setAddingUser(false);
    }
  };

  // EDIT USER: Admin can edit Pengguna; Super Admin can edit all
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!isSuperAdmin && (editingUser.role === 'admin' || editingUser.role === 'super_admin')) {
      alert('Hanya Super Admin yang berhak mengedit akun Administrator.');
      return;
    }

    setSavingEdit(true);
    setActionFeedback(null);

    const nowIso = new Date().toISOString();
    const updatePayload = {
      name: editingUser.name.trim(),
      phone: (editingUser.phone || '').trim(),
      libraryCardNumber: (editingUser.libraryCardNumber || '').trim().toUpperCase(),
      institution: (editingUser.institution || '').trim(),
      educationLevel: editingUser.educationLevel,
      studyProgram: (editingUser.studyProgram || '').trim(),
      role: editingUser.role,
      updatedAt: nowIso,
    };

    try {
      await updateDoc(doc(db, 'users', editingUser.uid), updatePayload);
      setUsers((prev) =>
        prev.map((u) => (u.uid === editingUser.uid ? { ...u, ...updatePayload } : u))
      );
      setActionFeedback(`Data ${editingUser.name} berhasil diperbarui.`);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error saving edited user:', err);
      alert('Gagal menyimpan perubahan: ' + err?.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // DELETE USER: Super Admin can delete Admin & Pengguna; Admin can delete Pengguna
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete.email === 'encikabdulhajar@gmail.com') {
      alert('Root Super Admin terlindungi dan tidak dapat dihapus.');
      return;
    }

    if (!isSuperAdmin && (userToDelete.role === 'admin' || userToDelete.role === 'super_admin')) {
      alert('Hanya Super Admin yang berwenang menghapus Administrator.');
      return;
    }

    setDeletingUser(true);
    setActionFeedback(null);

    try {
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      setActionFeedback(`Pengguna ${userToDelete.name} (${userToDelete.email}) berhasil dihapus dari sistem.`);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Gagal menghapus pengguna: ' + err?.message);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSaveGoogleSheetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      await saveSystemSettings(systemSettings, userProfile?.name);
      setSettingsFeedback('Konfigurasi Google Sheet berhasil disimpan.');
    } catch (err: any) {
      setSettingsFeedback('Gagal menyimpan konfigurasi: ' + err?.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSyncAllToGoogleSheet = async () => {
    setSyncingAll(true);
    setSettingsFeedback(null);
    try {
      for (const u of users) {
        await syncToGoogleSheet('NEW_USER', u);
      }
      for (const c of consultations) {
        await syncToGoogleSheet('NEW_CONSULTATION', c);
      }
      setSettingsFeedback(
        `Berhasil menyinkronkan ${users.length} data pengguna dan ${consultations.length} data konsultasi ke Google Sheet!`
      );
    } catch (err: any) {
      setSettingsFeedback('Terjadi kendala sinkronisasi: ' + err?.message);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Direct Google Sheets API Export State
  const [exportingSheetsApi, setExportingSheetsApi] = useState(false);
  const [sheetsExportResult, setSheetsExportResult] = useState<GoogleSheetExportResult | null>(null);
  const [sheetsExportError, setSheetsExportError] = useState<string | null>(null);
  const [exportTargetOption, setExportTargetOption] = useState<'NEW' | 'EXISTING'>('NEW');
  const [existingSheetIdInput, setExistingSheetIdInput] = useState('');
  const [customExportTitle, setCustomExportTitle] = useState('');
  const [confirmUpdateExistingModal, setConfirmUpdateExistingModal] = useState(false);

  // Extracts pure Spreadsheet ID if user entered full Google Sheet URL
  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : trimmed;
  };

  const executeGoogleSheetsApiExport = async () => {
    setExportingSheetsApi(true);
    setSheetsExportError(null);
    setSheetsExportResult(null);

    try {
      const token = await requestGoogleAccessToken();
      if (!token) {
        throw new Error('Token akses Google Sheets tidak berhasil didapatkan. Mohon izinkan otorisasi akun Google.');
      }

      const targetId =
        exportTargetOption === 'EXISTING'
          ? extractSpreadsheetId(existingSheetIdInput)
          : undefined;

      const result = await exportToGoogleSheet({
        users,
        consultations,
        accessToken: token,
        title: customExportTitle.trim() || undefined,
        existingSpreadsheetId: targetId,
      });

      setSheetsExportResult(result);
      setConfirmUpdateExistingModal(false);
    } catch (err: any) {
      console.error('Error exporting to Google Sheets API:', err);
      setSheetsExportError(err?.message || 'Gagal mengekspor data ke Google Sheets API.');
    } finally {
      setExportingSheetsApi(false);
    }
  };

  const handleStartGoogleSheetsExport = () => {
    setSheetsExportError(null);
    if (exportTargetOption === 'EXISTING') {
      const parsedId = extractSpreadsheetId(existingSheetIdInput);
      if (!parsedId) {
        setSheetsExportError('Mohon masukkan Spreadsheet ID atau URL Google Spreadsheet yang valid.');
        return;
      }
      // Mandatory user confirmation dialog before updating existing user data
      setConfirmUpdateExistingModal(true);
    } else {
      executeGoogleSheetsApiExport();
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.institution?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.libraryCardNumber?.toLowerCase().includes(searchUser.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Panel Koordinator Admin & Pengelolaan Sistem
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Dinas Perpustakaan dan Kearsipan Provinsi Kepri • Koordinasi konsultan pembimbing, integrasi Google Sheet, dan tata kelola konsulti.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() =>
              downloadCsvFile(exportConsultationsToCsv(consultations), `LAKONAN_Konsultasi_${Date.now()}.csv`)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Ekspor CSV Konsultasi</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 shadow-xs"
          >
            Perbarui
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="font-bold underline text-emerald-900">
            Tutup
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('coordination')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'coordination'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Koordinasi Pembimbing</span>
          <span className="ml-1 text-[11px] px-2 py-0.2 rounded-full bg-black/20 text-white font-mono">
            {consultations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengguna & Admin</span>
          <span className="ml-1 text-[11px] px-2 py-0.2 rounded-full bg-black/20 text-white font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('googlesheet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'googlesheet'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Integrasi Google Sheet</span>
        </button>

        <button
          onClick={() => setActiveTab('consultants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'consultants'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Daftar Konsultan Resmi</span>
        </button>
      </div>

      {/* TAB 1: KOORDINASI KONSULTAN PEMBIMBING */}
      {activeTab === 'coordination' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Koordinasi Alokasi Pembimbing oleh Koordinator Admin</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                Multi-Admin Diizinkan
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Admin bertindak mengoordinasikan dan menetapkan konsultan yang akan membimbing seorang konsulti berdasarkan pilihan beberapa konsultan yang diajukan oleh konsulti.
            </p>
          </div>

          {coordinationSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{coordinationSuccess}</span>
            </div>
          )}

          {consultations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              Belum ada permintaan konsultasi masuk.
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Tahap {c.stageId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
                          Mode: {c.consultationMode || 'offline'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {c.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{c.subject}</h3>
                    </div>

                    <div className="shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        c.status === 'waiting'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : c.status === 'assigned'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        Status: {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Konsulti Card Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nama Konsulti:</span>
                      <span className="font-bold text-slate-900">{c.userName || '-'}</span>
                      <div className="text-[11px] text-slate-500 font-mono">{c.userEmail}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">No. WhatsApp & Kartu Pustaka:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {c.userPhone || '-'}
                      </span>
                      <span className="font-bold text-amber-800 flex items-center gap-1 text-[11px]">
                        <CreditCard className="w-3 h-3 text-amber-600" />
                        {c.userLibraryCard || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Pilihan Konsultan Diinginkan:</span>
                      <div className="font-semibold text-blue-900 text-[11px] line-clamp-2">
                        {c.preferredConsultantNames && c.preferredConsultantNames.length > 0
                          ? c.preferredConsultantNames.join(' | ')
                          : 'Bebas (ditentukan admin)'}
                      </div>
                    </div>
                  </div>

                  {/* Question details */}
                  <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold block text-slate-800 mb-1">Pertanyaan / Draf:</span>
                    <p className="line-clamp-3 whitespace-pre-wrap">{c.message}</p>
                  </div>

                  {/* Coordination Action Box: Assign Consultant */}
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-700" />
                        <span>Penetapan Konsultan Pembimbing (PIC):</span>
                      </span>
                      <p className="text-[11px] text-blue-800">
                        {c.consultantName ? (
                          <>Saat ini dibimbing oleh: <strong>{c.consultantName}</strong> {c.assignedByAdminName && `(Ditugaskan oleh: ${c.assignedByAdminName})`}</>
                        ) : (
                          'Belum ada konsultan yang ditugaskan. Pilih konsultan di bawah ini.'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={c.consultantId || ''}
                        onChange={(e) => handleAssignConsultant(c, e.target.value)}
                        disabled={assigningId === c.id}
                        className="py-1.5 px-3 rounded-xl border border-blue-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                      >
                        <option value="">-- Pilih & Tetapkan Konsultan --</option>
                        {OFFICIAL_CONSULTANTS.map((cons) => (
                          <option key={cons.id} value={cons.id}>
                            {cons.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENGGUNA & ADMIN (TAMBAH, EDIT, HAPUS PER PERMINTAAN USER) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Pengelolaan Pengguna & Administrator</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isSuperAdmin
                  ? 'Super Admin dapat menambah & menghapus Admin dan Pengguna.'
                  : 'Admin dapat menambah, mengedit, dan menghapus Pengguna.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Add User / Admin Button */}
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>{isSuperAdmin ? 'Tambah Admin / Pengguna' : 'Tambah Pengguna Baru'}</span>
              </button>

              <button
                onClick={() =>
                  downloadCsvFile(exportUsersToCsv(users), `LAKONAN_Data_Konsulti_${Date.now()}.csv`)
                }
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span>Unduh CSV</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs overflow-x-auto">
              {(['ALL', 'super_admin', 'admin', 'consultant', 'user'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    roleFilter === r
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {r === 'ALL'
                    ? 'Semua'
                    : r === 'super_admin'
                    ? 'Super Admin'
                    : r === 'admin'
                    ? 'Admin'
                    : r === 'consultant'
                    ? 'Konsultan'
                    : 'Pengguna'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Cari nama, email, kartu pustaka..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Users Table with Edit and Delete Action Buttons */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Pasfoto & Nama</th>
                  <th className="py-2.5 px-3">Kartu Pustaka Kepri</th>
                  <th className="py-2.5 px-3">Kontak WA</th>
                  <th className="py-2.5 px-3">Institusi & Jenjang</th>
                  <th className="py-2.5 px-3">Peran</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isBootstrapSuperAdmin = u.email === 'encikabdulhajar@gmail.com';
                  const canEdit = isSuperAdmin || (isAdmin && (u.role === 'user' || u.role === 'consultant'));
                  const canDelete =
                    !isBootstrapSuperAdmin &&
                    (isSuperAdmin || (isAdmin && (u.role === 'user' || u.role === 'consultant')));

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-sky-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                              {u.name}
                              {u.role === 'super_admin' && (
                                <Crown className="w-3 h-3 text-purple-600 inline shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {u.libraryCardNumber ? (
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {u.libraryCardNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum diinput</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {u.phone || '-'}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800 truncate">{u.institution || '-'}</div>
                        <div className="text-[11px] text-slate-400">{u.educationLevel}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            u.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : u.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : u.role === 'consultant'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {u.role?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit ? (
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              title="Edit Pengguna"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic px-1">-</span>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE SHEET INTEGRATION */}
      {activeTab === 'googlesheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Koneksi & Ekspor Google Spreadsheet
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Kelola ekspor langsung seluruh data pendaftaran konsulti dan log konsultasi penelitian ke Google Spreadsheet menggunakan Google Sheets API resmi atau sinkronisasi Webhook otomatis.
            </p>
          </div>

          {/* CARD 1: GOOGLE SHEETS API V4 DIRECT EXPORT */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border border-emerald-800/60 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Ekspor Langsung via Google Sheets API (v4)</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      OAuth2 Terhubung
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Otomatis membuat/memperbarui spreadsheet dengan 2 lembar kerja rapi: <strong>Data Konsulti & Pengguna</strong> dan <strong>Log Konsultasi Penelitian</strong>.
                  </p>
                </div>
              </div>
            </div>

            {sheetsExportError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{sheetsExportError}</span>
              </div>
            )}

            {sheetsExportResult && (
              <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-400/50 text-emerald-100 text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ekspor Berhasil! {sheetsExportResult.usersExported} data pengguna dan {sheetsExportResult.consultationsExported} log konsultasi telah ditulis ke Google Sheets.</span>
                  </div>
                  <a
                    href={sheetsExportResult.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-400/20 transition-all hover:scale-105"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="text-[11px] text-emerald-300 font-mono truncate">
                  URL: {sheetsExportResult.spreadsheetUrl}
                </div>
              </div>
            )}

            {/* Options Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Judul File Spreadsheet (Opsional)
                </label>
                <input
                  type="text"
                  value={customExportTitle}
                  onChange={(e) => setCustomExportTitle(e.target.value)}
                  placeholder={`LAKONAN AI - Data & Log (${new Date().toLocaleDateString('id-ID')})`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilihan Tujuan Dokumen
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExportTargetOption('NEW')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      exportTargetOption === 'NEW'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs'
                        : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Buat File Baru
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportTargetOption('EXISTING')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      exportTargetOption === 'EXISTING'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs'
                        : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Perbarui Sheet Ada
                  </button>
                </div>
              </div>

              {exportTargetOption === 'EXISTING' && (
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    ID atau Tautan Google Spreadsheet yang Ingin Diperbarui
                  </label>
                  <input
                    type="text"
                    value={existingSheetIdInput}
                    onChange={(e) => setExistingSheetIdInput(e.target.value)}
                    placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau URL lengkap"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 font-mono text-xs"
                  />
                  <p className="text-[11px] text-amber-300/80 mt-1">
                    *Data pada tab 'Data Konsulti & Pengguna' dan 'Log Konsultasi Penelitian' akan ditimpa dengan data terbaru.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-wrap gap-2">
              <span className="text-[11px] text-slate-400">
                Memproses {users.length} pengguna dan {consultations.length} bimbingan.
              </span>

              <button
                type="button"
                disabled={exportingSheetsApi}
                onClick={handleStartGoogleSheetsExport}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {exportingSheetsApi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengekspor ke Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>
                      {exportTargetOption === 'NEW'
                        ? 'Ekspor ke Google Spreadsheet Baru'
                        : 'Perbarui Spreadsheet Sekarang'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {settingsFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsFeedback}</span>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSaveGoogleSheetSettings} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pengaturan URL Webhook Google Sheet (Apps Script Web App)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Google Sheet Webhook URL
              </label>
              <input
                type="url"
                value={systemSettings.googleSheetWebhookUrl || ''}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, googleSheetWebhookUrl: e.target.value })
                }
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Setiap ada konsulti baru yang mendaftar atau konsultasi baru masuk, data otomatis dikirimkan ke URL ini.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={syncingAll}
                onClick={handleSyncAllToGoogleSheet}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{syncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua Data Sekarang'}</span>
              </button>

              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <span>{savingSettings ? 'Menyimpan...' : 'Simpan Konfigurasi Webhook'}</span>
              </button>
            </div>
          </form>

          {/* Instructions and Apps Script Template */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800">
                Panduan Menyiapkan Google Apps Script di Google Spreadsheet:
              </h3>
              <button
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Tersalin!' : 'Salin Kode Script'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>Buka file <strong>Google Spreadsheet</strong> Anda (atau buat baru di Google Drive).</li>
              <li>Klik menu <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Hapus kode bawaan, lalu tempel (paste) kode di bawah ini.</li>
              <li>Klik tombol <strong>Deploy &gt; New Deployment</strong>.</li>
              <li>Pilih tipe <strong>Web app</strong>, atur <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>.</li>
              <li>Salin URL Web App yang dihasilkan dan tempelkan ke kolom input di atas.</li>
            </ol>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-56">
              <code>{GOOGLE_APPS_SCRIPT_TEMPLATE}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL CONSULTANTS ROSTER */}
      {activeTab === 'consultants' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Dewan Konsultan Resmi Dinas Perpustakaan dan Kearsipan Provinsi Kepri
            </h2>
            <p className="text-xs text-slate-500">
              Sesuai SK & flyer resmi Inovasi LAKONAN. Setiap konsultan dapat melengkapi profil kepakaran dan jadwal di menu Profil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {OFFICIAL_CONSULTANTS.map((cons) => (
              <div
                key={cons.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 space-y-2 transition-all hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-700 text-white font-bold flex items-center justify-center shrink-0">
                    {cons.name.charAt(3) || 'D'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{cons.title}</h3>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block">
                      Konsultan Terverifikasi
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bidang Kepakaran:</span>
                    <span className="font-medium text-slate-800">{cons.expertise}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Jadwal:</span>
                    <span className="text-sky-800 font-bold">{cons.schedule}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH PENGGUNA / ADMIN BARU */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>{isSuperAdmin ? 'Tambah Admin atau Pengguna Baru' : 'Tambah Pengguna Baru'}</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tingkat Peran (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="user">Pengguna / Konsulti (Tk. 1)</option>
                  <option value="consultant">Konsultan Akademik (Tk. 2)</option>
                  {isSuperAdmin && <option value="admin">Administrator (Tk. 3)</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin (Tk. 4)</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Nama lengkap..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Akun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="0812..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Kartu Pustaka Kepri
                  </label>
                  <input
                    type="text"
                    value={newUserForm.libraryCardNumber}
                    onChange={(e) => setNewUserForm({ ...newUserForm, libraryCardNumber: e.target.value })}
                    placeholder="KP-KEPRI-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Institusi / Kampus
                  </label>
                  <input
                    type="text"
                    value={newUserForm.institution}
                    onChange={(e) => setNewUserForm({ ...newUserForm, institution: e.target.value })}
                    placeholder="UMRAH, Poltek Batam..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenjang Studi
                  </label>
                  <select
                    value={newUserForm.educationLevel}
                    onChange={(e) => setNewUserForm({ ...newUserForm, educationLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Mahasiswa Sarjana (S1)">Mahasiswa S1</option>
                    <option value="Mahasiswa Magister (S2)">Mahasiswa S2</option>
                    <option value="Masyarakat Umum">Masyarakat Umum</option>
                    <option value="Dosen / Peneliti">Dosen / Peneliti</option>
                    <option value="Siswa SMA / MA / SMK">Siswa SMA / SMK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Program Studi / Bidang Penelitian
                </label>
                <input
                  type="text"
                  value={newUserForm.studyProgram}
                  onChange={(e) => setNewUserForm({ ...newUserForm, studyProgram: e.target.value })}
                  placeholder="Ilmu Kelautan, Manajemen..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={addingUser}
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {addingUser ? 'Menyimpan...' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PENGGUNA (ADMIN & SUPER ADMIN) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Data Pengguna: {editingUser.name}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Peran Pengguna
                </label>
                <select
                  disabled={!isSuperAdmin && (editingUser.role === 'admin' || editingUser.role === 'super_admin')}
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                >
                  <option value="user">Pengguna / Konsulti (Tk. 1)</option>
                  <option value="consultant">Konsultan Akademik (Tk. 2)</option>
                  {isSuperAdmin && <option value="admin">Administrator (Tk. 3)</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin (Tk. 4)</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. Kartu Pustaka Provinsi Kepri
                </label>
                <input
                  type="text"
                  value={editingUser.libraryCardNumber || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, libraryCardNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Institusi / Kampus
                  </label>
                  <input
                    type="text"
                    value={editingUser.institution || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, institution: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenjang Studi
                  </label>
                  <select
                    value={editingUser.educationLevel || 'Mahasiswa Sarjana (S1)'}
                    onChange={(e) => setEditingUser({ ...editingUser, educationLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Mahasiswa Sarjana (S1)">Mahasiswa S1</option>
                    <option value="Mahasiswa Magister (S2)">Mahasiswa S2</option>
                    <option value="Masyarakat Umum">Masyarakat Umum</option>
                    <option value="Dosen / Peneliti">Dosen / Peneliti</option>
                    <option value="Siswa SMA / MA / SMK">Siswa SMA / SMK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Program Studi / Bidang Riset
                </label>
                <input
                  type="text"
                  value={editingUser.studyProgram || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, studyProgram: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: HAPUS PENGGUNA / ADMIN (SUPER ADMIN BISA HAPUS ADMIN & PENGGUNA; ADMIN BISA HAPUS PENGGUNA) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Akun Pengguna / Administrator?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Anda akan menghapus pengguna <strong>{userToDelete.name}</strong> ({userToDelete.email}) dengan peran{' '}
                <span className="font-bold uppercase text-slate-900">{userToDelete.role}</span>. Seluruh data profil pengguna akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={deletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                disabled={deletingUser}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 shadow-xs"
              >
                {deletingUser ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
