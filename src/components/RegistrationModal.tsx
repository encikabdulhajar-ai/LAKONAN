import React, { useState } from 'react';
import {
  UserCheck,
  CreditCard,
  Upload,
  Camera,
  Phone,
  Building,
  GraduationCap,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { syncToGoogleSheet } from '../lib/googleSheetSync.ts';
import { EDUCATION_LEVELS } from '../constants/stages.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';
import { LogoKepri } from './LogoKepri.tsx';

interface RegistrationModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onComplete }) => {
  const { currentUser, userProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [libraryCardNumber, setLibraryCardNumber] = useState(userProfile?.libraryCardNumber || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [educationLevel, setEducationLevel] = useState(
    userProfile?.educationLevel || 'Mahasiswa Sarjana (S1)'
  );
  const [studyProgram, setStudyProgram] = useState(userProfile?.studyProgram || '');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>(
    userProfile?.photoURL || currentUser?.photoURL || ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran pasfoto maksimal 2MB. Silakan gunakan foto yang lebih kecil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Strict validation
    if (!name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Nomor WhatsApp aktif wajib diisi untuk koordinasi jadwal bimbingan.');
      return;
    }
    if (!libraryCardNumber.trim()) {
      setErrorMsg('Nomor Kartu Pustaka Provinsi Kepulauan Riau wajib diisi.');
      return;
    }
    if (!photoDataUrl) {
      setErrorMsg('Pasfoto formal wajib diunggah.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const nowIso = new Date().toISOString();
    const updatePayload = {
      name: name.trim(),
      phone: phone.trim(),
      libraryCardNumber: libraryCardNumber.trim().toUpperCase(),
      institution: institution.trim(),
      educationLevel,
      studyProgram: studyProgram.trim(),
      photoURL: photoDataUrl,
      isProfileComplete: true,
      updatedAt: nowIso,
    };

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updatePayload);

      // Push to Google Sheets Webhook in background
      syncToGoogleSheet('NEW_USER', {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userProfile?.role || 'user',
        ...updatePayload,
      }).catch((err) => console.warn('Background Google Sheet sync notice:', err));

      onComplete();
    } catch (err: any) {
      console.error('Error completing registration:', err);
      setErrorMsg(err?.message || 'Gagal menyimpan pendaftaran.');
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-sky-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Banner Header matching Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-6 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-2">
            {/* Provincial Logo Kepri */}
            <LogoKepri size="sm" />
            <div>
              <p className="text-[11px] font-bold text-sky-200 uppercase tracking-wider">
                Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Formulir Pendaftaran Konsulti LAKONAN
              </h2>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Wajib Memiliki Kartu Pustaka Provinsi Kepri & Unggah Pasfoto</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pasfoto Upload Section */}
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt="Pasfoto Formal"
                  className="w-20 h-24 rounded-xl object-cover ring-2 ring-sky-500 shadow-md bg-white"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl bg-slate-200 text-slate-400 flex flex-col items-center justify-center text-xs font-semibold border-2 border-dashed border-slate-300">
                  <Camera className="w-6 h-6 mb-1 text-slate-400" />
                  <span>Pasfoto</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Unggah Pasfoto Formal Konsulti (Wajib)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Gunakan pasfoto resmi berpakaian rapi (format JPG/PNG, ukuran maks. 2MB).
              </p>
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 cursor-pointer shadow-xs transition-colors">
                  <span>Pilih Pasfoto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap sesuai identitas..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Nomor WhatsApp / HP <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400">Untuk koordinasi jadwal</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081266689796"
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Nomor Kartu Pustaka Provinsi Kepulauan Riau (WAJIB) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Nomor Kartu Pustaka Provinsi Kepulauan Riau (WAJIB) <span className="text-rose-600">*</span></span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Dispusip Kepri
              </span>
            </div>

            <input
              type="text"
              required
              value={libraryCardNumber}
              onChange={(e) => setLibraryCardNumber(e.target.value)}
              placeholder="Contoh: KP-KEPRI-2026-08123 atau No. Anggota Anda"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono font-bold text-slate-900"
            />

            <div className="flex items-center justify-between text-[11px] text-amber-800">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                Belum punya kartu anggota?
              </span>
              <a
                href="https://dispusip.kepriprov.go.id"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline hover:text-amber-950 flex items-center gap-1"
              >
                <span>Daftar Kartu di Dispusip Kepri</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Institusi / Kampus */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institusi / Perguruan Tinggi / Sekolah <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: UMRAH, Poltek Batam, UNRIKA..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Jenjang Studi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Konsulti / Jenjang Studi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                >
                  <option value="Mahasiswa Sarjana (S1)">Mahasiswa S1</option>
                  <option value="Mahasiswa Magister (S2)">Mahasiswa S2</option>
                  <option value="Masyarakat Umum">Masyarakat Umum</option>
                  <option value="Dosen / Peneliti">Dosen / Peneliti</option>
                  <option value="Siswa SMA / MA / SMK">Siswa SMA / MA / SMK</option>
                </select>
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Program Studi / Bidang Riset */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Program Studi / Bidang Penelitian
            </label>
            <div className="relative">
              <input
                type="text"
                value={studyProgram}
                onChange={(e) => setStudyProgram(e.target.value)}
                placeholder="Contoh: Ilmu Kelautan, Manajemen Bisnis, Pendidikan Bahasa Inggris..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 hover:from-sky-500 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{submitting ? 'Memproses Pendaftaran...' : 'Simpan & Verifikasi Pendaftaran Konsulti'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
