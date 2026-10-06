import { ResearchStage } from '../types/index.ts';

export const RESEARCH_STAGES: ResearchStage[] = [
  {
    id: '01',
    code: '01',
    title: 'Eksplorasi Ide Penelitian',
    description: 'Menggali inspirasi dari fenomena nyata, rasa ingin tahu ilmiah, dan pemetaan minat riset awal.',
    focusAreas: ['Kepekaan Fenomena', 'Observasi Empiris', 'Pemetaan Minat', 'Kelayakan Riset (Feasibility)'],
    sampleQuestions: [
      'Bagaimana cara menemukan ide riset orisinal dari permasalahan di sekitar kita?',
      'Saya tertarik pada topik kecerdasan buatan dalam pendidikan, bagaimana mengerucutkannya menjadi ide riset?',
    ],
  },
  {
    id: '02',
    code: '02',
    title: 'Menentukan Topik',
    description: 'Membatasi ruang lingkup kajian agar fokus, bernilai ilmiah tinggi, dan relevan dengan bidang studi.',
    focusAreas: ['Batasan Ruang Lingkup', 'Signifikansi Akademik', 'Urgensi Praktis', 'Kesesuaian Kompetensi'],
    sampleQuestions: [
      'Apakah topik yang saya pilih ini terlalu luas untuk durasi skripsi 6 bulan?',
      'Bagaimana menguji apakah suatu topik memiliki nilai urgensi akademis?',
    ],
  },
  {
    id: '03',
    code: '03',
    title: 'Merumuskan Judul',
    description: 'Menyusun redaksi judul yang komunikatif, presisi, mencerminkan variabel/fokus, dan kaidah baku.',
    focusAreas: ['Variabel Penelitian', 'Konteks & Subjek', 'Kaidah Redaksional', 'Daya Tarik Akademis'],
    sampleQuestions: [
      'Mohon tinjau draf judul penelitian saya ini agar lebih terukur dan tidak ambigu.',
      'Bagaimana merumuskan judul penelitian kualitatif studi kasus yang elegan?',
    ],
  },
  {
    id: '04',
    code: '04',
    title: 'Identifikasi Masalah',
    description: 'Membedah kesenjangan antara kondisi normatif (das Sollen) dengan realitas empiris (das Sein).',
    focusAreas: ['Gejala vs Akar Masalah', 'Kesenjangan Harapan & Realita', 'Justifikasi Empiris', 'Batasan Masalah'],
    sampleQuestions: [
      'Bagaimana memisahkan antara gejala di permukaan dengan akar masalah sesungguhnya?',
      'Bagaimana merumuskan identifikasi masalah dalam bentuk butir-butir yang kuat?',
    ],
  },
  {
    id: '05',
    code: '05',
    title: 'Menulis Latar Belakang',
    description: 'Menyusun narasi piramida terbalik yang didukung data riil untuk meyakinkan urgensi penelitian.',
    focusAreas: ['Piramida Terbalik', 'Data Dukung Riil', 'Kronologi Isu', 'Keterkaitan Logis'],
    sampleQuestions: [
      'Bagaimana alur paragraf pembuka latar belakang yang memikat penguji?',
      'Bagaimana menghubungkan data statistik nasional dengan fenomena lokal yang saya teliti?',
    ],
  },
  {
    id: '06',
    code: '06',
    title: 'Rumusan Masalah dan Pertanyaan Penelitian',
    description: 'Menyusun pertanyaan penelitian operasional yang terarah dan dapat dijawab secara metodologis.',
    focusAreas: ['Pertanyaan Operasional', 'Keselarasan Variabel', 'Uji Keterjawaban', 'Batasan Ruang Lingkup'],
    sampleQuestions: [
      'Apakah pertanyaan penelitian ini sudah operasional dan bisa diuji secara statistik?',
      'Bagaimana membuat grand tour question dan sub-questions untuk penelitian kualitatif?',
    ],
  },
  {
    id: '07',
    code: '07',
    title: 'Tujuan dan Manfaat Penelitian',
    description: 'Menegaskan sasaran terukur riset serta kontribusi teoritis dan praktis bagi pemangku kepentingan.',
    focusAreas: ['Konsistensi Tujuan-Masalah', 'Manfaat Teoretis', 'Manfaat Praktis/Kebijakan', 'Dampak Riset'],
    sampleQuestions: [
      'Bagaimana merumuskan manfaat teoretis dan praktis yang berbobot, bukan klise?',
      'Bagaimana memastikan tujuan riset saya sejalan 100% dengan rumusan masalah?',
    ],
  },
  {
    id: '08',
    code: '08',
    title: 'Kajian Literatur',
    description: 'Melakukan sintesis kritis terhadap teori utama dan riset terdahulu, bukan sekadar kutipan tempel.',
    focusAreas: ['Sintesis Teori', 'Grand/Middle/Applied Theory', 'Evaluasi Kritis Literatur', 'Matriks Kajian Pustaka'],
    sampleQuestions: [
      'Bagaimana cara mensintesis pandangan 3 ahli yang berbeda terhadap satu konsep?',
      'Bagaimana menyusun matriks kajian literatur terdahulu agar mudah dipahami penguji?',
    ],
  },
  {
    id: '09',
    code: '09',
    title: 'Research Gap dan Kebaruan',
    description: 'Menemukan celah pengetahuan mutakhir (state of the art) dan menegaskan unsur kebaruan (novelty).',
    focusAreas: ['State of the Art', 'Theoretical Gap', 'Methodological Gap', 'Contextual Gap', 'Empirical Inconsistency', 'Novelty'],
    sampleQuestions: [
      'Bagaimana cara menunjukkan methodological gap yang meyakinkan pada proposal riset?',
      'Bagaimana memformulasikan novelty (kebaruan) tanpa mengklaim secara berlebihan?',
    ],
  },
  {
    id: '10',
    code: '10',
    title: 'Kerangka Teori atau Kerangka Konseptual',
    description: 'Membangun bagan alur hubungan antar konsep dan hipotesis/proposisi berlandaskan telaah pustaka.',
    focusAreas: ['Bagan Kerangka Pikir', 'Arah Pengaruh/Hubungan', 'Landasan Hipotesis', 'Keterkaitan Antarvariabel'],
    sampleQuestions: [
      'Bagaimana menggambarkan alur kerangka konseptual yang menghubungkan variabel bebas, perantara, dan terikat?',
      'Bagaimana menyusun hipotesis terarah (directional hypothesis) yang kokoh?',
    ],
  },
  {
    id: '11',
    code: '11',
    title: 'Desain dan Metode Penelitian',
    description: 'Menentukan pendekatan, paradigma, tahapan operasional, serta strategi validasi yang tepat sasaran.',
    focusAreas: ['Paradigma Penelitian', 'Kuantitatif / Kualitatif / Mix Method / R&D', 'Desain Eksperimen / Korelasional', 'Validitas Internal & Eksternal'],
    sampleQuestions: [
      'Kapan sebaiknya memilih metode Mixed Methods sequential explanatory dibanding concurrent triangulation?',
      'Bagaimana langkah-langkah metodologi Research and Development (R&D) model ADDIE?',
    ],
  },
  {
    id: '12',
    code: '12',
    title: 'Populasi, Sampel, atau Informan',
    description: 'Menetapkan unit analisis, teknik penarikan sampel, kriteria inklusi/eksklusi, dan saturasi data.',
    focusAreas: ['Teknik Sampling', 'Formula Ukuran Sampel', 'Kriteria Inklusi/Eksklusi', 'Kriteria Informan & Saturasi'],
    sampleQuestions: [
      'Berapa ukuran sampel yang tepat jika populasi tidak diketahui secara pasti?',
      'Bagaimana menentukan kriteria informan purposive sampling dalam penelitian studi kasus?',
    ],
  },
  {
    id: '13',
    code: '13',
    title: 'Instrumen Penelitian',
    description: 'Menyusun alat ukur, dimensi, kisi-kisi indikator, serta uji validitas dan reliabilitas instrumen.',
    focusAreas: ['Construct & Dimensi', 'Indikator & Item', 'Skala Pengukuran', 'Content Validity', 'Construct Validity', 'Reliabilitas'],
    sampleQuestions: [
      'Bagaimana menyusun kisi-kisi instrumen angket berdasarkan dimensi dan indikator teori?',
      'Bagaimana cara membuktikan validitas isi (content validity) menggunakan formula Aiken V atau CVR?',
    ],
  },
  {
    id: '14',
    code: '14',
    title: 'Pengumpulan dan Analisis Data',
    description: 'Menjalankan prosedur penggalian data, uji asumsi klasik, teknik statistik atau analisis tematik kualitatif.',
    focusAreas: ['Protokol Pengumpulan Data', 'Uji Asumsi / Prasyarat', 'Analisis Inferensial / SEM', 'Analisis Tematik & Triangulasi'],
    sampleQuestions: [
      'Data saya tidak berdistribusi normal, teknik analisis apa yang bisa menjadi alternatif?',
      'Bagaimana langkah-langkah analisis tematik Braun & Clarke pada transkrip wawancara?',
    ],
  },
  {
    id: '15',
    code: '15',
    title: 'Hasil, Pembahasan, dan Kesimpulan',
    description: 'Menyajikan data secara jujur, mendiskusikan kaitan hasil dengan teori, serta menarik simpulan tegas.',
    focusAreas: ['Penyajian Objektif', 'Komparasi dengan Teori & Studi Lalu', 'Implikasi Riset', 'Keterbatasan & Rekomendasi'],
    sampleQuestions: [
      'Bagaimana membedakan pembahasan (discussion) dari sekadar mengulang pembacaan angka hasil (results)?',
      'Bagaimana merumuskan kesimpulan yang benar-benar menjawab rumusan masalah?',
    ],
  },
  {
    id: '16',
    code: '16',
    title: 'Artikel, Abstrak, Referensi, dan Publikasi',
    description: 'Menyiapkan naskah publikasi ilmiah format IMRAD, penulisan abstrak padat, sitasi baku, dan etika riset.',
    focusAreas: ['Struktur IMRAD', 'Abstrak Padat & Informatif', 'Gaya Selingkung (APA, IEEE, Harvard)', 'Etika Sitasi Bebas Plagiasi', 'Target Jurnal'],
    sampleQuestions: [
      'Bagaimana formula penulisan abstrak jurnal internasional bereputasi dalam batas 200 kata?',
      'Bagaimana kiat menulis Cover Letter yang meyakinkan untuk Editor Jurnal?',
    ],
  },
];

export const EDUCATION_LEVELS = [
  'Siswa SMA / MA / SMK',
  'Mahasiswa Diploma (D3 / D4)',
  'Mahasiswa Sarjana (S1)',
  'Mahasiswa Magister (S2)',
  'Mahasiswa Doktoral (S3)',
  'Dosen / Pengajar',
  'Peneliti Independen / Lembaga',
];
