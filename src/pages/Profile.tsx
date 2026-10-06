import React, { useState } from 'react';
import {
  User as UserIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Building,
  GraduationCap,
  Mail,
  Fingerprint,
  Crown,
  Layers,
  Check,
  CreditCard,
  Phone,
  BookOpen,
  Camera,
  Upload,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { EDUCATION_LEVELS } from '../constants/stages.ts';
import { ROLE_DETAILS, UserRole } from '../types/index.ts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';

export const Profile: React.FC = () => {
  const { currentUser, userProfile, updateProfile, isConsultant, isSuperAdmin } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [educationLevel, setEducationLevel] = useState(
    userProfile?.educationLevel || 'Mahasiswa Sarjana (S1)'
  );
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [libraryCardNumber, setLibraryCardNumber] = useState(userProfile?.libraryCardNumber || '');
  const [studyProgram, setStudyProgram] = useState(userProfile?.studyProgram || '');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>(
    userProfile?.photoURL || currentUser?.photoURL || ''
  );

  // Consultant specific fields
  const [consultantExpertise, setConsultantExpertise] = useState(
    userProfile?.consultantExpertise || ''
  );
  const [consultantBio, setConsultantBio] = useState(userProfile?.consultantBio || '');
  const [consultantSchedule, setConsultantSchedule] = useState(
    userProfile?.consultantSchedule || 'Senin - Jum\'at (10:00 - 15:00 WIB)'
  );
  const [consultantNip, setConsultantNip] = useState(userProfile?.consultantNip || '');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran foto maksimal 2MB.');
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

    if (!name.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const nowIso = new Date().toISOString();
    const updatePayload: any = {
      name: name.trim(),
      institution: institution.trim(),
      educationLevel,
      phone: phone.trim(),
      libraryCardNumber: libraryCardNumber.trim().toUpperCase(),
      studyProgram: studyProgram.trim(),
      photoURL: photoDataUrl,
      isProfileComplete: Boolean(name.trim() && libraryCardNumber.trim()),
      updatedAt: nowIso,
    };

    if (isConsultant) {
      updatePayload.consultantExpertise = consultantExpertise.trim();
      updatePayload.consultantBio = consultantBio.trim();
      updatePayload.consultantSchedule = consultantSchedule.trim();
      updatePayload.consultantNip = consultantNip.trim();
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updatePayload);
      setSuccessMsg('Profil dan data keanggotaan Anda berhasil diperbarui!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Gagal menyimpan perubahan profil.');
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const currentRole = (userProfile?.role || 'user') as UserRole;
  const roleInfo = ROLE_DETAILS[currentRole] || ROLE_DETAILS.user;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserIcon className="w-5 h-5 text-sky-600" />
            <h1 className="text-xl font-extrabold text-slate-900">
              Profil {isConsultant ? 'Konsultan Akademik' : 'Konsulti / Peneliti'}
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Dinas Perpustakaan dan Kearsipan Provinsi Kepri • Kelola identitas, nomor kartu pustaka, pasfoto, dan rincian bimbingan.
          </p>
        </div>

        {userProfile?.libraryCardNumber && (
          <div className="p-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-2 shrink-0">
            <CreditCard className="w-4 h-4 text-amber-700" />
            <span>Kartu Pustaka: {userProfile.libraryCardNumber}</span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* User Identity Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-100">
          <div className="relative group shrink-0">
            {photoDataUrl ? (
              <img
                src={photoDataUrl}
                alt={userProfile?.name}
                className="w-24 h-28 rounded-2xl object-cover ring-2 ring-sky-500 shadow-md bg-white"
              />
            ) : (
              <div className="w-24 h-28 rounded-2xl bg-sky-800 text-white font-extrabold text-3xl flex items-center justify-center">
                {userProfile?.name?.charAt(0) || 'U'}
              </div>
            )}
            <label className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md transition-transform hover:scale-110">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h2 className="text-lg font-extrabold text-slate-900">{userProfile?.name}</h2>
            <p className="text-xs text-slate-500">{userProfile?.email}</p>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.badgeColor}`}>
                {roleInfo.label.toUpperCase()} (Tingkat {roleInfo.level})
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {userProfile?.educationLevel || 'Peneliti'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Data Identitas & Kontak */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Data Pribadi & Kontak Konsulti
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap dan gelar akademis..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* No WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081266689796"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Nomor Kartu Pustaka Provinsi Kepulauan Riau (WAJIB) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  <span>Nomor Kartu Pustaka Provinsi Kepulauan Riau (WAJIB) <span className="text-rose-600">*</span></span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  Dispusip Kepri
                </span>
              </div>
              <input
                type="text"
                required
                value={libraryCardNumber}
                onChange={(e) => setLibraryCardNumber(e.target.value)}
                placeholder="Contoh: KP-KEPRI-2026-08123"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <p className="text-[11px] text-amber-800">
                Wajib diisi bagi seluruh konsulti dan peneliti bimbingan Inovasi LAKONAN.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Institusi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Institusi / Perguruan Tinggi / Sekolah
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Contoh: UMRAH, Poltek Batam..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Jenjang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Konsulti / Jenjang Studi
                </label>
                <div className="relative">
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                  >
                    <option value="Mahasiswa Sarjana (S1)">Mahasiswa Sarjana (S1)</option>
                    <option value="Mahasiswa Magister (S2)">Mahasiswa Magister (S2)</option>
                    <option value="Masyarakat Umum">Masyarakat Umum</option>
                    <option value="Dosen / Peneliti">Dosen / Peneliti</option>
                    <option value="Siswa SMA / MA / SMK">Siswa SMA / MA / SMK</option>
                  </select>
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Program Studi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Program Studi / Bidang Penelitian
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studyProgram}
                  onChange={(e) => setStudyProgram(e.target.value)}
                  placeholder="Contoh: Ilmu Kelautan, Manajemen Bisnis..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* SECTION 2: KHUSUS KONSULTAN AKADEMIK (PER REQUEST USER) */}
          {isConsultant && (
            <div className="space-y-4 pt-4 border-t border-slate-200 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                  Kelengkapan Profil Konsultan Akademik (Wajib Dilengkapi)
                </h3>
              </div>
              <p className="text-[11px] text-emerald-800">
                Informasi ini ditampilkan kepada konsulti saat memilih konsultan pembimbing dan saat koordinasi bimbingan oleh Admin.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* NIP / NIDN */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    NIP / NIDN / No. Induk Konsultan
                  </label>
                  <input
                    type="text"
                    value={consultantNip}
                    onChange={(e) => setConsultantNip(e.target.value)}
                    placeholder="Contoh: 19780512 200501 1 003"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Jadwal Ketersediaan */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jadwal Ketersediaan Bimbingan
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={consultantSchedule}
                      onChange={(e) => setConsultantSchedule(e.target.value)}
                      placeholder="Contoh: Senin & Rabu (10:00 - 15:00 WIB)"
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Bidang Kepakaran */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Bidang Kepakaran & Fokus Metodologi Riset
                </label>
                <input
                  type="text"
                  value={consultantExpertise}
                  onChange={(e) => setConsultantExpertise(e.target.value)}
                  placeholder="Contoh: Statistik Kuantitatif, Analisis SEM, Riset Kesehatan, Evaluasi Pendidikan..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Bio Singkat */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Bio Singkat & Riwayat Riset Konsultan
                </label>
                <textarea
                  rows={3}
                  value={consultantBio}
                  onChange={(e) => setConsultantBio(e.target.value)}
                  placeholder="Uraikan pengalaman akademis, publikasi kunci, dan fokus bimbingan Anda..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Section 3: Cascading Permissions Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Tingkat Peran & Wewenang Cascading Anda:</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{roleInfo.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {roleInfo.permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{perm}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
