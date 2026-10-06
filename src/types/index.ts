export type UserRole = 'user' | 'consultant' | 'admin' | 'super_admin';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  consultant: 2,
  admin: 3,
  super_admin: 4,
};

export interface RoleDetail {
  label: string;
  level: number;
  description: string;
  badgeColor: string;
  permissions: string[];
}

export const ROLE_DETAILS: Record<UserRole, RoleDetail> = {
  user: {
    label: 'Peneliti / Konsulti',
    level: 1,
    description: 'Mahasiswa S1, S2, dan masyarakat umum yang wajib memiliki Kartu Pustaka Provinsi Kepri untuk bimbingan riset.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    permissions: [
      'Konsultasi 16 Tahap dengan LAKONAN AI',
      'Menyimpan dan mengelola riwayat riset pribadi',
      'Mengajukan permintaan konsultasi dengan memilih beberapa konsultan yang diinginkan',
    ],
  },
  consultant: {
    label: 'Konsultan Akademik',
    level: 2,
    description: 'Pakar metodologi penelitian resmi Dinas Perpustakaan dan Kearsipan Provinsi Kepri (mewarisi hak akses Peneliti).',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    permissions: [
      'Mewarisi seluruh hak akses Peneliti',
      'Mengakses Dashboard Permintaan Konsultasi',
      'Mengisi dan melengkapi profil kepakaran konsultan',
      'Memberikan telaah ilmiah & memperbarui status bimbingan',
    ],
  },
  admin: {
    label: 'Administrator',
    level: 3,
    description: 'Koordinator operasional LAKONAN yang dapat mengkoordinir dan menentukan konsultan yang membimbing seorang konsulti (bisa lebih dari 1 admin).',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: [
      'Mewarisi seluruh hak akses Konsultan & Peneliti',
      'Mengkoordinasikan dan menetapkan konsultan pembimbing untuk konsulti',
      'Sinkronisasi otomatis ke Google Spreadsheet / Webhook',
      'Mengubah peran pengguna antara Pengguna dan Konsultan',
    ],
  },
  super_admin: {
    label: 'Super Admin',
    level: 4,
    description: 'Otoritas tertinggi sistem dengan hak akses penuh ke seluruh tata kelola peran, koordinasi bimbingan, dan integrasi data.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: [
      'Mewarisi seluruh hak akses Administrator, Konsultan & Peneliti',
      'Tata kelola penuh seluruh tingkatan peran pengguna',
      'Mengangkat & memberhentikan Administrator',
      'Konfigurasi integrasi Google Sheet & parameter sistem',
    ],
  },
};

export function hasMinimumRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] || 1) >= (ROLE_HIERARCHY[requiredRole] || 1);
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  institution?: string;
  educationLevel?: string;
  phone?: string;
  libraryCardNumber?: string; // Kartu Pustaka Provinsi Kepulauan Riau (Wajib)
  studyProgram?: string;
  isProfileComplete?: boolean;
  // Consultant specific fields
  consultantExpertise?: string;
  consultantBio?: string;
  consultantSchedule?: string;
  consultantNip?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OfficialConsultant {
  id: string;
  name: string;
  title: string;
  expertise: string;
  photoUrl?: string;
  institution: string;
  schedule: string;
}

export const OFFICIAL_CONSULTANTS: OfficialConsultant[] = [
  {
    id: 'c-bisri',
    name: 'Dr. Moh.Bisri, S.KM., M.Kes.',
    title: 'Dr. Moh.Bisri, S.KM., M.Kes.',
    expertise: 'Kesehatan Masyarakat, Epidemiologi, Analisis Data Kuantitatif & Biostatistik',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Senin - Rabu (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-jepri',
    name: 'Jepri, S.Pd. M.Pd. Ph.D',
    title: 'Jepri, S.Pd. M.Pd. Ph.D',
    expertise: 'Evaluasi & Pengukuran Pendidikan, Instrumen Penelitian, Metodologi Riset',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Selasa - Kamis (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-atmadinata',
    name: 'Dr. Drs. Atmadinata, M.Pd.',
    title: 'Dr. Drs. Atmadinata, M.Pd.',
    expertise: 'Manajemen Pendidikan, Kebijakan Publik, Riset Kualitatif & Evaluasi Program',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Senin - Kamis (10:00 - 14:00 WIB)',
  },
  {
    id: 'c-ari',
    name: 'Dr. Ari Basuki, M.Pd., M.Si.',
    title: 'Dr. Ari Basuki, M.Pd., M.Si.',
    expertise: 'Statistika Terapan, Pemodelan Data, Riset Eksperimen & Mixed Methods',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Rabu - Jum\'at (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-sulastri',
    name: 'dr. Sulastri, M.Si.',
    title: 'dr. Sulastri, M.Si.',
    expertise: 'Kesehatan, Sains Medis, Etika Penelitian & Pengolahan Data Klinis',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Senin & Jum\'at (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-encik',
    name: 'Dr. Encik Abdulhajar, M.M.',
    title: 'Dr. Encik Abdulhajar, M.M.',
    expertise: 'Manajemen Strategik, SDM, Kepemimpinan, Riset Bisnis & Organisasi',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Senin - Jum\'at (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-satria',
    name: 'Sabrananda Satria, S.E., M.Pd. Gr.',
    title: 'Sabrananda Satria, S.E., M.Pd. Gr.',
    expertise: 'Pendidikan Ekonomi, Inovasi Pembelajaran, Penelitian Tindakan Kelas (PTK)',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Selasa & Kamis (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-agus',
    name: 'Agus Andreano, S.E., M.AP.',
    title: 'Agus Andreano, S.E., M.AP.',
    expertise: 'Administrasi Publik, Akuntansi Sektor Publik & Tata Kelola Keuangan',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Senin - Rabu (10:00 - 15:00 WIB)',
  },
  {
    id: 'c-rahmat',
    name: 'Rahmat, M.AP',
    title: 'Rahmat, M.AP',
    expertise: 'Kebijakan Publik, Tata Kelola Pemerintahan & Manajemen Pelayanan Publik',
    institution: 'Dinas Perpustakaan dan Kearsipan Provinsi Kepulauan Riau',
    schedule: 'Rabu - Jum\'at (10:00 - 15:00 WIB)',
  },
];

export interface ResearchStage {
  id: string;
  code: string;
  title: string;
  description: string;
  sampleQuestions: string[];
  focusAreas: string[];
}

export interface AiSession {
  id: string;
  userId: string;
  stageId: string;
  stageName: string;
  title: string;
  createdAt: any;
  updatedAt: any;
  messageCount?: number;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
}

export type ConsultationStatus = 'waiting' | 'assigned' | 'answered' | 'closed';
export type ConsultationMode = 'offline' | 'online';

export interface HumanConsultation {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userLibraryCard?: string;
  consultantId?: string | null;
  consultantName?: string | null;
  preferredConsultantIds?: string[];
  preferredConsultantNames?: string[];
  consultationMode?: ConsultationMode;
  assignedByAdminId?: string | null;
  assignedByAdminName?: string | null;
  subject: string;
  stageId: string;
  stageName: string;
  message: string;
  response?: string;
  status: ConsultationStatus;
  createdAt: any;
  updatedAt: any;
}

export interface SystemSetting {
  id?: string;
  googleSheetWebhookUrl?: string;
  googleSpreadsheetId?: string;
  zoomMeetingUrl?: string;
  hotlinePhone?: string;
  updatedAt?: string;
  updatedBy?: string;
}
