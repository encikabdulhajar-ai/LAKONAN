import { UserProfile, HumanConsultation } from '../types/index.ts';

export const GOOGLE_SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface GoogleSheetExportResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  usersExported: number;
  consultationsExported: number;
  createdNewSpreadsheet: boolean;
}

export interface ExportToGoogleSheetParams {
  users: UserProfile[];
  consultations: HumanConsultation[];
  accessToken: string;
  title?: string;
  existingSpreadsheetId?: string;
  usersSheetName?: string;
  consultationsSheetName?: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  properties: {
    title: string;
    locale?: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index: number;
    };
  }>;
}

/**
 * Standard column headers for User Data
 */
export const USER_SHEET_HEADERS = [
  'No',
  'UID Pengguna',
  'Nama Lengkap',
  'Email Akun',
  'No. WhatsApp / HP',
  'No. Kartu Pustaka Provinsi Kepri',
  'Institusi / Kampus',
  'Jenjang Pendidikan',
  'Program Studi / Bidang Riset',
  'Tingkat Peran (Role)',
  'Status Kelengkapan Profil',
  'NIP Konsultan',
  'Bidang Kepakaran Konsultan',
  'Jadwal Bimbingan Konsultan',
  'Tanggal Pendaftaran',
  'Terakhir Diperbarui',
];

/**
 * Standard column headers for Consultation Logs
 */
export const CONSULTATION_SHEET_HEADERS = [
  'No',
  'ID Konsultasi',
  'Nama Konsulti / Peneliti',
  'Email Konsulti',
  'No. WhatsApp',
  'No. Kartu Pustaka Kepri',
  'Topik / Judul Konsultasi',
  'Kode Tahap',
  'Nama Tahap Penelitian',
  'Mode Bimbingan',
  'Pilihan Konsultan Diinginkan',
  'Konsultan Pembimbing Resmi (PIC)',
  'Admin Pengkoordinir',
  'Status Konsultasi',
  'Uraian Pertanyaan & Masalah Riset',
  'Tanggapan Ilmiah Konsultan',
  'Waktu Pengajuan',
  'Waktu Terakhir Diperbarui',
];

/**
 * Formats user profile objects into tabular rows
 */
export function formatUsersForSheet(users: UserProfile[]): (string | number)[][] {
  const rows: (string | number)[][] = [USER_SHEET_HEADERS];

  users.forEach((u, index) => {
    rows.push([
      index + 1,
      u.uid,
      u.name || '-',
      u.email || '-',
      u.phone || '-',
      u.libraryCardNumber || '-',
      u.institution || '-',
      u.educationLevel || '-',
      u.studyProgram || '-',
      u.role ? u.role.toUpperCase() : 'USER',
      u.isProfileComplete ? 'LENGKAP' : 'BELUM LENGKAP',
      u.consultantNip || '-',
      u.consultantExpertise || '-',
      u.consultantSchedule || '-',
      u.createdAt ? formatDateIndonesian(u.createdAt) : '-',
      u.updatedAt ? formatDateIndonesian(u.updatedAt) : '-',
    ]);
  });

  return rows;
}

/**
 * Formats consultation records into tabular rows
 */
export function formatConsultationsForSheet(consultations: HumanConsultation[]): (string | number)[][] {
  const rows: (string | number)[][] = [CONSULTATION_SHEET_HEADERS];

  consultations.forEach((c, index) => {
    const preferredNames =
      c.preferredConsultantNames && c.preferredConsultantNames.length > 0
        ? c.preferredConsultantNames.join('; ')
        : '-';

    const statusLabel =
      c.status === 'waiting'
        ? 'Menunggu Koordinasi Admin'
        : c.status === 'assigned'
        ? 'Konsultan Ditugaskan'
        : c.status === 'answered'
        ? 'Sudah Dijawab'
        : 'Selesai';

    rows.push([
      index + 1,
      c.id,
      c.userName || '-',
      c.userEmail || '-',
      c.userPhone || '-',
      c.userLibraryCard || '-',
      c.subject || '-',
      c.stageId || '-',
      c.stageName || '-',
      c.consultationMode ? c.consultationMode.toUpperCase() : 'OFFLINE',
      preferredNames,
      c.consultantName || 'Belum Ditetapkan',
      c.assignedByAdminName || '-',
      statusLabel,
      c.message || '-',
      c.response || '-',
      c.createdAt ? formatDateIndonesian(c.createdAt) : '-',
      c.updatedAt ? formatDateIndonesian(c.updatedAt) : '-',
    ]);
  });

  return rows;
}

/**
 * Helper to format date in standard Indonesian readable format
 */
function formatDateIndonesian(dateInput: any): string {
  if (!dateInput) return '-';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Creates a brand new Google Spreadsheet with custom sheet titles
 */
export async function createGoogleSpreadsheet(
  title: string,
  sheetTitles: string[],
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const response = await fetch(GOOGLE_SHEETS_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        locale: 'id_ID',
        autoRecalc: 'ON_CHANGE',
      },
      sheets: sheetTitles.map((sheetTitle, index) => ({
        properties: {
          title: sheetTitle,
          index,
          gridProperties: {
            frozenRowCount: 1, // Freeze header row for readability
          },
        },
      })),
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message || `Gagal membuat Google Spreadsheet (HTTP ${response.status}).`
    );
  }

  return response.json();
}

/**
 * Fetches existing Google Spreadsheet metadata
 */
export async function getSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message || `Gagal membaca informasi spreadsheet (HTTP ${response.status}).`
    );
  }

  return response.json();
}

/**
 * Adds a new sheet tab to an existing spreadsheet if it doesn't already exist
 */
export async function ensureSheetExists(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<number> {
  const metadata = await getSpreadsheetMetadata(spreadsheetId, accessToken);
  const found = metadata.sheets.find((s) => s.properties.title === sheetTitle);

  if (found) {
    return found.properties.sheetId;
  }

  // Add sheet tab via batchUpdate
  const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetTitle,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message || `Gagal menambahkan lembar kerja '${sheetTitle}' (HTTP ${response.status}).`
    );
  }

  const result = await response.json();
  return result.replies?.[0]?.addSheet?.properties?.sheetId || 0;
}

/**
 * Overwrites or populates a cell range with 2D array of values
 */
export async function updateSheetRangeValues(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][],
  accessToken: string
): Promise<any> {
  const encodedRange = encodeURIComponent(range);
  const url = `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message || `Gagal mengisi data ke Google Sheets (HTTP ${response.status}).`
    );
  }

  return response.json();
}

/**
 * Clears and updates a sheet tab with fresh data
 */
export async function replaceSheetData(
  spreadsheetId: string,
  sheetTitle: string,
  values: (string | number)[][],
  accessToken: string
): Promise<any> {
  // 1. Clear existing sheet values
  const clearRange = encodeURIComponent(`'${sheetTitle}'!A1:Z10000`);
  await fetch(`${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${clearRange}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }).catch(() => {
    // Ignore if sheet is new or empty
  });

  // 2. Put values starting at A1
  return updateSheetRangeValues(spreadsheetId, `'${sheetTitle}'!A1`, values, accessToken);
}

/**
 * Applies professional styling to Google Sheet tabs:
 * - Navy/Sky Blue headers with white bold text (matching LAKONAN theme)
 * - Auto-fit column widths
 * - Frozen header row
 */
export async function applyLayananLakonanStyling(
  spreadsheetId: string,
  sheets: Array<{ sheetId: number; title: string; columnCount: number }>,
  accessToken: string
): Promise<void> {
  const requests: any[] = [];

  sheets.forEach((sheet) => {
    // 1. Header cell styling (Row 0)
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: sheet.columnCount,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: {
              red: 0.05,
              green: 0.15,
              blue: 0.35, // Deep Navy Blue (#0D2659)
            },
            textFormat: {
              foregroundColor: {
                red: 1.0,
                green: 1.0,
                blue: 1.0,
              },
              bold: true,
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    });

    // 2. Freeze header row
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheet.sheetId,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // 3. Auto-resize column widths for readability
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheet.sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: sheet.columnCount,
        },
      },
    });
  });

  if (requests.length === 0) return;

  const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    // Styling errors are non-critical, log warning
    console.warn('Non-fatal warning applying Google Sheet formatting:', await response.text());
  }
}

/**
 * Main comprehensive export service function:
 * Exports both User Data and Consultation Logs into a Google Spreadsheet
 */
export async function exportToGoogleSheet(
  params: ExportToGoogleSheetParams
): Promise<GoogleSheetExportResult> {
  const {
    users,
    consultations,
    accessToken,
    existingSpreadsheetId,
    title,
    usersSheetName = 'Data Konsulti & Pengguna',
    consultationsSheetName = 'Log Konsultasi Penelitian',
  } = params;

  if (!accessToken) {
    throw new Error('Akses token Google Sheets tidak tersedia. Silakan hubungkan akun Google terlebih dahulu.');
  }

  const defaultTitle =
    title ||
    `LAKONAN AI - Data & Log Konsultasi (${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })})`;

  let targetSpreadsheetId = existingSpreadsheetId?.trim();
  let createdNew = false;
  let spreadsheetTitle = defaultTitle;
  let userSheetId = 0;
  let consultSheetId = 1;

  if (!targetSpreadsheetId) {
    // 1. Create a brand new Google Spreadsheet
    const newSheet = await createGoogleSpreadsheet(
      defaultTitle,
      [usersSheetName, consultationsSheetName],
      accessToken
    );
    targetSpreadsheetId = newSheet.spreadsheetId;
    createdNew = true;
    spreadsheetTitle = newSheet.properties.title;
    userSheetId = newSheet.sheets[0]?.properties.sheetId || 0;
    consultSheetId = newSheet.sheets[1]?.properties.sheetId || 1;
  } else {
    // 2. Validate and ensure tabs exist in the existing spreadsheet
    const meta = await getSpreadsheetMetadata(targetSpreadsheetId, accessToken);
    spreadsheetTitle = meta.properties.title;
    userSheetId = await ensureSheetExists(targetSpreadsheetId, usersSheetName, accessToken);
    consultSheetId = await ensureSheetExists(targetSpreadsheetId, consultationsSheetName, accessToken);
  }

  // 3. Format rows
  const userRows = formatUsersForSheet(users);
  const consultationRows = formatConsultationsForSheet(consultations);

  // 4. Populate users tab
  await replaceSheetData(targetSpreadsheetId, usersSheetName, userRows, accessToken);

  // 5. Populate consultations tab
  await replaceSheetData(targetSpreadsheetId, consultationsSheetName, consultationRows, accessToken);

  // 6. Apply professional styling to both tabs
  await applyLayananLakonanStyling(
    targetSpreadsheetId,
    [
      { sheetId: userSheetId, title: usersSheetName, columnCount: USER_SHEET_HEADERS.length },
      { sheetId: consultSheetId, title: consultationsSheetName, columnCount: CONSULTATION_SHEET_HEADERS.length },
    ],
    accessToken
  ).catch((err) => console.warn('Gagal memformat tampilan sheet:', err));

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`;

  return {
    success: true,
    spreadsheetId: targetSpreadsheetId,
    spreadsheetUrl,
    title: spreadsheetTitle,
    usersExported: users.length,
    consultationsExported: consultations.length,
    createdNewSpreadsheet: createdNew,
  };
}

/**
 * Convenience helper to export only user accounts to Google Sheets
 */
export async function exportUsersToNewGoogleSheet(
  users: UserProfile[],
  accessToken: string,
  title?: string
): Promise<GoogleSheetExportResult> {
  const sheetTitle = title || `LAKONAN AI - Data Pengguna (${new Date().toISOString().slice(0, 10)})`;
  return exportToGoogleSheet({
    users,
    consultations: [],
    accessToken,
    title: sheetTitle,
  });
}

/**
 * Convenience helper to export only consultation logs to Google Sheets
 */
export async function exportConsultationsToNewGoogleSheet(
  consultations: HumanConsultation[],
  accessToken: string,
  title?: string
): Promise<GoogleSheetExportResult> {
  const sheetTitle = title || `LAKONAN AI - Log Konsultasi (${new Date().toISOString().slice(0, 10)})`;
  return exportToGoogleSheet({
    users: [],
    consultations,
    accessToken,
    title: sheetTitle,
  });
}
