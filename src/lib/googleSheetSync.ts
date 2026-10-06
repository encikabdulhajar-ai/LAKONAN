import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';
import { UserProfile, HumanConsultation, SystemSetting } from '../types/index.ts';

const SETTINGS_DOC_ID = 'general_config';

export async function getSystemSettings(): Promise<SystemSetting> {
  try {
    const snap = await getDoc(doc(db, 'systemSettings', SETTINGS_DOC_ID));
    if (snap.exists()) {
      return snap.data() as SystemSetting;
    }
  } catch (err) {
    console.error('Error fetching system settings:', err);
  }
  return {
    googleSheetWebhookUrl: '',
    googleSpreadsheetId: '',
    zoomMeetingUrl: 'https://zoom.us/j/lakonan-dispusip-kepri',
    hotlinePhone: '0812 6668 9796',
  };
}

export async function saveSystemSettings(settings: Partial<SystemSetting>, updatedByName?: string): Promise<void> {
  const ref = doc(db, 'systemSettings', SETTINGS_DOC_ID);
  await setDoc(
    ref,
    {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByName || 'Admin',
    },
    { merge: true }
  );
}

/**
 * Sends data payload to configured Google Sheet Webhook (Google Apps Script Web App)
 */
export async function syncToGoogleSheet(action: 'NEW_USER' | 'NEW_CONSULTATION' | 'UPDATE_CONSULTATION', data: any): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getSystemSettings();
    const webhookUrl = settings.googleSheetWebhookUrl?.trim();

    if (!webhookUrl) {
      return {
        success: false,
        message: 'URL Webhook Google Sheet belum dikonfigurasi di Panel Admin.',
      };
    }

    const payload = {
      action,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send payload to Google Apps Script Web App
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors', // Google Apps Script Web Apps often redirect; no-cors allows dispatch
    });

    return {
      success: true,
      message: 'Data berhasil disinkronkan ke Google Sheet.',
    };
  } catch (err: any) {
    console.error('Google Sheet Sync Error:', err);
    return {
      success: false,
      message: err?.message || 'Gagal menyinkronkan data ke Google Sheet.',
    };
  }
}

/**
 * Generates ready-to-import CSV string for Google Sheets for Users
 */
export function exportUsersToCsv(users: UserProfile[]): string {
  const headers = [
    'UID',
    'Nama Lengkap',
    'Email',
    'No. WhatsApp',
    'No. Kartu Pustaka Kepri',
    'Institusi / Kampus',
    'Jenjang Studi',
    'Program Studi',
    'Peran',
    'Status Profil',
    'Tanggal Terdaftar',
  ];

  const rows = users.map((u) => [
    `"${u.uid}"`,
    `"${(u.name || '').replace(/"/g, '""')}"`,
    `"${u.email || ''}"`,
    `"${u.phone || '-'}"`,
    `"${u.libraryCardNumber || '-'}"`,
    `"${(u.institution || '').replace(/"/g, '""')}"`,
    `"${u.educationLevel || ''}"`,
    `"${(u.studyProgram || '').replace(/"/g, '""')}"`,
    `"${u.role || 'user'}"`,
    `"${u.isProfileComplete ? 'Lengkap' : 'Belum Lengkap'}"`,
    `"${u.createdAt || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates ready-to-import CSV string for Google Sheets for Consultations
 */
export function exportConsultationsToCsv(consultations: HumanConsultation[]): string {
  const headers = [
    'ID Konsultasi',
    'Nama Konsulti',
    'Email Konsulti',
    'No. WhatsApp',
    'No. Kartu Pustaka Kepri',
    'Topik Konsultasi',
    'Tahap Penelitian',
    'Mode Konsultasi',
    'Konsultan Diinginkan',
    'Konsultan Pembimbing (PIC)',
    'Admin Pengkoordinir',
    'Status',
    'Isi Pertanyaan / Kendala',
    'Tanggapan Konsultan',
    'Tanggal Pengajuan',
    'Tanggal Pembaruan',
  ];

  const rows = consultations.map((c) => [
    `"${c.id}"`,
    `"${(c.userName || '').replace(/"/g, '""')}"`,
    `"${c.userEmail || ''}"`,
    `"${c.userPhone || '-'}"`,
    `"${c.userLibraryCard || '-'}"`,
    `"${(c.subject || '').replace(/"/g, '""')}"`,
    `"${(c.stageName || '').replace(/"/g, '""')}"`,
    `"${c.consultationMode || 'offline'}"`,
    `"${(c.preferredConsultantNames || []).join('; ').replace(/"/g, '""')}"`,
    `"${(c.consultantName || 'Belum Ditugaskan').replace(/"/g, '""')}"`,
    `"${(c.assignedByAdminName || '-').replace(/"/g, '""')}"`,
    `"${c.status}"`,
    `"${(c.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(c.response || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${c.createdAt || ''}"`,
    `"${c.updatedAt || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadCsvFile(csvContent: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Google Apps Script snippet code template for user to copy-paste into Google Sheet
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Buka Google Spreadsheet -> Klik Extensions -> Apps Script
// Ganti seluruh isi file Code.gs dengan kode berikut, lalu klik Deploy -> New Deployment -> Web App (Set Who has access: Anyone)
function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === "NEW_USER") {
      var sheet = ss.getSheetByName("Registrasi_Konsulti") || ss.insertSheet("Registrasi_Konsulti");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "UID", "Nama Lengkap", "Email", "No WhatsApp", "No Kartu Pustaka Kepri", "Institusi", "Jenjang", "Program Studi", "Peran"]);
      }
      var u = data.data;
      sheet.appendRow([new Date(), u.uid, u.name, u.email, u.phone, u.libraryCardNumber, u.institution, u.educationLevel, u.studyProgram, u.role]);
    } else if (data.action === "NEW_CONSULTATION" || data.action === "UPDATE_CONSULTATION") {
      var sheet = ss.getSheetByName("Data_Konsultasi") || ss.insertSheet("Data_Konsultasi");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "ID Konsultasi", "Nama Konsulti", "No WhatsApp", "No Kartu Pustaka", "Topik", "Tahap Riset", "Mode", "Pilihan Konsultan", "Konsultan PIC", "Admin Pengkoordinir", "Status", "Pertanyaan", "Tanggapan Konsultan"]);
      }
      var c = data.data;
      sheet.appendRow([new Date(), c.id, c.userName, c.userPhone, c.userLibraryCard, c.subject, c.stageName, c.consultationMode, (c.preferredConsultantNames || []).join(", "), c.consultantName || "-", c.assignedByAdminName || "-", c.status, c.message, c.response || "-"]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
