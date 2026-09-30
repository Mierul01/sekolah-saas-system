// Single hardcoded tenant for now — every new account and every existing
// document is assigned this school. Multi-school selection UI is a deferred
// feature; see SCHOOL_NAME in lib/firebase.js for the matching display name.
export const DEFAULT_SCHOOL_ID = 'smka-tok-bachok'

export const SUBJECTS = [
  'RELIEF/GURU GANTI',
  'BAHASA INGGERIS',
  'MATEMATIK',
  'SAINS',
  'SEJARAH',
  'GEOGRAFI',
  'PENDIDIKAN ISLAM',
  'HIFZ AL-QURAN',
  'MAHARAT AL-QURAN',
  'BAHASA MELAYU',
  'BAHASA ARAB',
  'REKA BENTUK & TEKNOLOGI',
  'BAHASA PERANCIS',
  'BAHASA CHINA',
  'PENDIDIKAN SENI VISUAL',
  'PENDIDIKAN JASMANI & KESIHATAN',
  'FIZIK',
  'BIOLOGI',
  'KIMIA',
  'MATEMATIK TAMBAHAN',
  'PENDIDIKAN SYARIAH ISLAMIAH',
  'PRINSIP PERAKAUNAN',
  'GRAFIK KOMUNIKASI TEKNIKAL',
  'PENDIDIKAN AL-QURAN & AS-SUNNAH',
]

// Short codes for the printed timetable grid — a full subject name eats a
// whole cell and forces awkward wrapping, so the grid uses the code (with a
// key printed underneath) the way real school timetables do.
export const SUBJECT_ABBR = {
  'RELIEF/GURU GANTI': 'GG',
  'BAHASA INGGERIS': 'BI',
  MATEMATIK: 'MAT',
  SAINS: 'SN',
  SEJARAH: 'SEJ',
  GEOGRAFI: 'GEO',
  'PENDIDIKAN ISLAM': 'PI',
  'HIFZ AL-QURAN': 'HQ',
  'MAHARAT AL-QURAN': 'MQ',
  'BAHASA MELAYU': 'BM',
  'BAHASA ARAB': 'BA',
  'REKA BENTUK & TEKNOLOGI': 'RBT',
  'BAHASA PERANCIS': 'BP',
  'BAHASA CHINA': 'BC',
  'PENDIDIKAN SENI VISUAL': 'PSV',
  'PENDIDIKAN JASMANI & KESIHATAN': 'PJK',
  FIZIK: 'FIZ',
  BIOLOGI: 'BIO',
  KIMIA: 'KIM',
  'MATEMATIK TAMBAHAN': 'MT',
  'PENDIDIKAN SYARIAH ISLAMIAH': 'PSI',
  'PRINSIP PERAKAUNAN': 'PA',
  'GRAFIK KOMUNIKASI TEKNIKAL': 'GKT',
  'PENDIDIKAN AL-QURAN & AS-SUNNAH': 'QAS',
}
export const abbrSubject = (name) => SUBJECT_ABBR[name] || name

// English names for the legend under the printed timetable when the UI
// language is set to English — the codes themselves stay the same in both
// languages (that's how Malaysian schools actually print them).
export const SUBJECT_NAME_EN = {
  'RELIEF/GURU GANTI': 'Relief/Substitute Teacher',
  'BAHASA INGGERIS': 'English Language',
  MATEMATIK: 'Mathematics',
  SAINS: 'Science',
  SEJARAH: 'History',
  GEOGRAFI: 'Geography',
  'PENDIDIKAN ISLAM': 'Islamic Education',
  'HIFZ AL-QURAN': 'Quran Memorisation',
  'MAHARAT AL-QURAN': 'Quran Recitation Skills',
  'BAHASA MELAYU': 'Malay Language',
  'BAHASA ARAB': 'Arabic Language',
  'REKA BENTUK & TEKNOLOGI': 'Design & Technology',
  'BAHASA PERANCIS': 'French Language',
  'BAHASA CHINA': 'Chinese Language',
  'PENDIDIKAN SENI VISUAL': 'Visual Arts Education',
  'PENDIDIKAN JASMANI & KESIHATAN': 'Physical & Health Education',
  FIZIK: 'Physics',
  BIOLOGI: 'Biology',
  KIMIA: 'Chemistry',
  'MATEMATIK TAMBAHAN': 'Additional Mathematics',
  'PENDIDIKAN SYARIAH ISLAMIAH': 'Islamic Syariah Education',
  'PRINSIP PERAKAUNAN': 'Principles of Accounting',
  'GRAFIK KOMUNIKASI TEKNIKAL': 'Technical Graphics Communication',
  'PENDIDIKAN AL-QURAN & AS-SUNNAH': 'Quran & Sunnah Education',
}
export const subjectLabel = (name, language) => (language === 'en' ? SUBJECT_NAME_EN[name] || name : name)

export const FORMS = ['TINGKATAN 1', 'TINGKATAN 2', 'TINGKATAN 3', 'TINGKATAN 4', 'TINGKATAN 5']

export const CLASSES = [
  'QALUN',
  'WARSH',
  "AL BAZZI",
  'HAFS',
  "SHU'BAH",
  'AR RAZI',
  'AL BIRUNI',
  'AZ ZAHRAWI',
  'IBNU KHALDUN',
  'IBNU SINA',
]

export const TIME_SLOTS = [
  '7.00 - 8.00',
  '8.00 - 8.30',
  '8.30 - 9.00',
  '9.00 - 9.30',
  '9.30 - 10.00',
  '10.00 - 10.30',
  '10.30 - 11.00',
  '11.00 - 11.30',
  '11.30 - 12.00',
  '12.00 - 12.30',
  '12.30 - 1.00',
  '1.00 - 1.30',
  '1.30 - 2.00',
  '2.00 - 2.30',
  '2.30 - 3.00',
  '3.00 - 3.30',
  '3.30 - 4.00',
  '4.00 - 4.30',
]

// The recess period — shown as its own "REHAT" column on the printed
// timetable grid instead of a normal teaching slot.
export const BREAK_SLOTS = ['10.00 - 10.30']
export const isBreakSlot = (slot) => BREAK_SLOTS.includes(slot)

// Kelantan school week runs Ahad (Sun) to Khamis (Thu) — Friday/Saturday is the weekend.
export const SCHOOL_DAYS = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS']

export const COCO_CATEGORIES = [
  'KELAB & PERSATUAN',
  'BADAN BERUNIFORM',
  'SUKAN & PERMAINAN',
  'RUMAH SUKAN',
]

export const COCO_ATTENDANCE_STATUS = [
  { value: 'HADIR', label: '✅ Hadir Mengawal' },
  { value: 'TIDAK_HADIR', label: '❌ Tidak Hadir' },
  { value: 'BERTUGAS_LAIN', label: '🔵 Bertugas Lain' },
]

// The actual uniformed bodies at the school — matches the real "Laporan
// Perjumpaan Kokurikulum Badan Beruniform" form's unit list exactly.
export const BADAN_BERUNIFORM_UNITS = [
  'KADET REMAJA SEKOLAH',
  'KADET BOMBA DAN PENYELAMAT',
  'PERGERAKAN PUTERI ISLAM MALAYSIA',
  'KADET PERTAHANAN AWAM',
  'KADET POLIS',
  'PERSATUAN BULAN SABIT MERAH',
  'BRIGED BAKTI MALAYSIA',
  'PENGAKAP',
]

// Meeting-number dropdown on the same form — sequential 1-20 to cover a
// year's worth of uniformed-body meetings.
export const PERJUMPAAN_NUMBERS = Array.from({ length: 20 }, (_, i) => String(i + 1))

// Sentinel for the unit dropdown's "Others" option — the unit lists we've
// captured from the real forms may not be exhaustive, so teachers whose
// unit isn't listed can pick this and type the name in free text.
export const OTHER_UNIT_VALUE = '__OTHER__'

// Matches the real "Laporan Perjumpaan Kokurikulum Rumah Sukan" form's unit
// list exactly (the school's 4 sports houses).
export const RUMAH_SUKAN_UNITS = [
  'RUMAH TARIQ (BIRU)',
  'RUMAH HAMZAH (HIJAU)',
  'RUMAH AMRU (KUNING)',
  'RUMAH KHALID (MERAH)',
]

// Matches the real "Laporan Perjumpaan Kokurikulum Kelab & Persatuan" form's
// unit list as shown on the form (list may be scrollable/incomplete there).
export const KELAB_PERSATUAN_UNITS = [
  'Persatuan Agama Islam',
  'Persatuan Bahasa Arab',
  'Persatuan Bahasa Cina',
  'Persatuan Bahasa Inggeris',
  'Persatuan Bahasa Melayu',
  'Persatuan Bahasa Perancis',
  'Persatuan Geografi',
  'Persatuan Sejarah',
  'Persatuan Seni Dan Khat',
  'Persatuan Seni Visual',
  'Kelab Science, Technology, Engineering and Mathematics (STEM)',
  'Kelab Setem Dan Filateli (KESEF)',
  'Kelab Malaysiaku',
]

// Matches the real "Laporan Perjumpaan Kokurikulum Sukan & Permainan" form's
// unit list as shown on the form (list may be scrollable/incomplete there).
export const SUKAN_PERMAINAN_UNITS = [
  'BOLA SEPAK / FUTSAL',
  'HOKI',
  'BOLA TAMPAR',
  'BOLA JARING',
  'BADMINTON',
  'SEPAK TAKRAW',
  'PING PONG',
  'OLAHRAGA',
  'CATUR',
  'MEMANAH',
  'BOLA BALING',
  'BERKUDA',
]

// Looks up the right unit dropdown for a chosen co-curriculum category —
// keyed by the same category strings used in COCO_CATEGORIES.
export const COCO_CATEGORY_UNITS = {
  'BADAN BERUNIFORM': BADAN_BERUNIFORM_UNITS,
  'KELAB & PERSATUAN': KELAB_PERSATUAN_UNITS,
  'SUKAN & PERMAINAN': SUKAN_PERMAINAN_UNITS,
  'RUMAH SUKAN': RUMAH_SUKAN_UNITS,
}

export const JAWATAN_LIST = [
  'PENGETUA',
  'PK PENTADBIRAN',
  'PK HAL EHWAL MURID',
  'PK KOKURIKULUM',
  'PK T6',
  'GURU KANAN',
  'GURU',
  'AKP',
  'LAIN-LAIN',
]

export const ASSEMBLY_STATUSES = [
  { value: 'HADIR', label: '✅ HADIR' },
  { value: 'BERTUGAS', label: '🟡 BERTUGAS' },
  { value: 'KURSUS_TUGAS_RASMI', label: '🔵 KURSUS/TUGAS RASMI' },
  { value: 'CUTI_MC', label: '🔴 CUTI/MC' },
]

export function toLocalISODate(date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

export function todayStr() {
  return toLocalISODate(new Date())
}

export function formatDateLabel(isoDate, locale = 'ms-MY') {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
