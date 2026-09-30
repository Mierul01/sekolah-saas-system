// One-click sample-data seeder for the REAL Firebase backend — lets a
// developer/admin populate every collection with realistic-looking demo
// records (at least MIN_RECORDS each) to show off the app without waiting
// for real usage to build up. Every document it writes is tagged
// `seed: true` so it's easy to tell seeded data apart from real submissions
// later, and every collection is topped up rather than duplicated on repeat
// runs — re-clicking is safe.
//
// Fake "teachers" here are Firestore-only profile documents (deterministic
// IDs like `seed-teacher-1`) — they are NOT real Firebase Auth accounts and
// can never sign in. They exist purely so erph/mmi/coco/timetable/etc.
// records have a plausible teacherUid/teacherName to show. This requires the
// `canManageSchool()` bypass in firestore.rules (admin or developer may
// create records on behalf of any teacherUid within their own school).

import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where, db } from './db'
import { SUBJECTS, FORMS, CLASSES, TIME_SLOTS, COCO_CATEGORIES, JAWATAN_LIST, ASSEMBLY_STATUSES, SCHOOL_DAYS, toLocalISODate } from './constants'

const MIN_RECORDS = 15

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalISODate(d)
}

function isoAt(dateStr, hour) {
  return `${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`
}

function pick(arr, seed) {
  return arr[((seed % arr.length) + arr.length) % arr.length]
}

const SEED_TEACHERS = [
  { name: 'Cikgu Faizal Rahman', email: 'faizal.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Nurul Huda', email: 'nurul.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Hafiz Zulkifli', email: 'hafiz.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Aina Syazwani', email: 'aina.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Farid Iskandar', email: 'farid.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Balqis Natasha', email: 'balqis.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Syafiq Adam', email: 'syafiq.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Wan Aisyah', email: 'aisyah.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Amirul Hakim', email: 'amirul.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Siti Khadijah', email: 'khadijah.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Zulhilmi Azman', email: 'zulhilmi.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Farah Aleesya', email: 'farah.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Danial Haqimi', email: 'danial.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Nur Batrisyia', email: 'batrisyia.seed@smkatokbachok.edu.my' },
  { name: 'Cikgu Adam Haikal', email: 'adam.seed@smkatokbachok.edu.my' },
]

const SEED_STUDENTS = [
  { namaPenuh: 'Ahmad Danish bin Rosli', noKP: '120304-03-1234', tingkatan: 'TINGKATAN 1', kelas: 'QALUN', jantina: 'Lelaki', namaPenjaga: 'Rosli bin Ismail', noTelefonPenjaga: '019-2345671' },
  { namaPenuh: 'Nur Alisya binti Zulkarnain', noKP: '120512-03-5678', tingkatan: 'TINGKATAN 1', kelas: 'WARSH', jantina: 'Perempuan', namaPenjaga: 'Zulkarnain bin Hassan', noTelefonPenjaga: '013-8765432' },
  { namaPenuh: 'Muhammad Haziq bin Anuar', noKP: '110115-03-2211', tingkatan: 'TINGKATAN 2', kelas: 'HAFS', jantina: 'Lelaki', namaPenjaga: 'Anuar bin Yaacob', noTelefonPenjaga: '017-6543219' },
  { namaPenuh: 'Siti Nur Aqilah binti Rahim', noKP: '110228-03-3344', tingkatan: 'TINGKATAN 2', kelas: "SHU'BAH", jantina: 'Perempuan', namaPenjaga: 'Abdul Rahim bin Salleh', noTelefonPenjaga: '012-3456788' },
  { namaPenuh: 'Amirul Iman bin Zainal', noKP: '100407-03-4455', tingkatan: 'TINGKATAN 3', kelas: 'AR RAZI', jantina: 'Lelaki', namaPenjaga: 'Zainal bin Kamaruddin', noTelefonPenjaga: '019-7778889' },
  { namaPenuh: 'Farah Izzati binti Shukor', noKP: '100619-03-5566', tingkatan: 'TINGKATAN 3', kelas: 'AL BIRUNI', jantina: 'Perempuan', namaPenjaga: 'Shukor bin Latif', noTelefonPenjaga: '013-2223334' },
  { namaPenuh: 'Danial Haqimi bin Roslan', noKP: '090722-03-6677', tingkatan: 'TINGKATAN 4', kelas: 'AZ ZAHRAWI', jantina: 'Lelaki', namaPenjaga: 'Roslan bin Idris', noTelefonPenjaga: '017-9990001' },
  { namaPenuh: 'Nur Batrisyia binti Kamal', noKP: '090830-03-7788', tingkatan: 'TINGKATAN 4', kelas: 'IBNU KHALDUN', jantina: 'Perempuan', namaPenjaga: 'Kamal bin Othman', noTelefonPenjaga: '012-4445556' },
  { namaPenuh: 'Adam Haikal bin Suhaimi', noKP: '080911-03-8899', tingkatan: 'TINGKATAN 5', kelas: 'IBNU SINA', jantina: 'Lelaki', namaPenjaga: 'Suhaimi bin Jaafar', noTelefonPenjaga: '019-1112223' },
  { namaPenuh: 'Qistina Aleesya binti Farid', noKP: '081203-03-9900', tingkatan: 'TINGKATAN 5', kelas: 'AL BAZZI', jantina: 'Perempuan', namaPenjaga: 'Farid bin Mahmud', noTelefonPenjaga: '013-5556667' },
  { namaPenuh: 'Haziq Iskandar bin Zamri', noKP: '120115-03-1122', tingkatan: 'TINGKATAN 1', kelas: 'QALUN', jantina: 'Lelaki', namaPenjaga: 'Zamri bin Him', noTelefonPenjaga: '019-3334445' },
  { namaPenuh: 'Nurul Ain binti Hashim', noKP: '120920-03-2233', tingkatan: 'TINGKATAN 2', kelas: 'HAFS', jantina: 'Perempuan', namaPenjaga: 'Hashim bin Musa', noTelefonPenjaga: '017-4445556' },
  { namaPenuh: 'Irfan Hakimi bin Zulkifli', noKP: '110330-03-3344', tingkatan: 'TINGKATAN 3', kelas: 'AR RAZI', jantina: 'Lelaki', namaPenjaga: 'Zulkifli bin Awang', noTelefonPenjaga: '012-5556667' },
  { namaPenuh: 'Aina Sofea binti Rosdi', noKP: '100511-03-4455', tingkatan: 'TINGKATAN 4', kelas: 'AZ ZAHRAWI', jantina: 'Perempuan', namaPenjaga: 'Rosdi bin Ahmad', noTelefonPenjaga: '013-6667778' },
  { namaPenuh: 'Naufal Danish bin Yusof', noKP: '090218-03-5566', tingkatan: 'TINGKATAN 5', kelas: 'IBNU SINA', jantina: 'Lelaki', namaPenjaga: 'Yusof bin Karim', noTelefonPenjaga: '019-7778889' },
]

const SEED_CURRICULUM = [
  { department: 'Bahasa', subject: 'Bahasa Melayu' },
  { department: 'Bahasa', subject: 'Bahasa Inggeris' },
  { department: 'Bahasa', subject: 'Bahasa Arab' },
  { department: 'Bahasa', subject: 'Bahasa Antarabangsa' },
  { department: 'STEM', subject: 'Sains Teras' },
  { department: 'STEM', subject: 'Matematik' },
  { department: 'STEM', subject: 'Matematik Tambahan' },
  { department: 'STEM', subject: 'Fizik' },
  { department: 'STEM', subject: 'Kimia' },
  { department: 'STEM', subject: 'Biologi' },
  { department: 'STEM', subject: 'DLP' },
  { department: 'Agama & Tahfiz', subject: 'Pendidikan Islam' },
  { department: 'Agama & Tahfiz', subject: 'Syariah (PSI)' },
  { department: 'Agama & Tahfiz', subject: 'Al-Quran (PQS)' },
  { department: 'Agama & Tahfiz', subject: 'Hifz Al-Quran' },
  { department: 'Agama & Tahfiz', subject: 'Maharat Al-Quran' },
  { department: 'Kemanusiaan & Teknikal', subject: 'Sejarah' },
  { department: 'Kemanusiaan & Teknikal', subject: 'Geografi' },
  { department: 'Kemanusiaan & Teknikal', subject: 'PJK' },
  { department: 'Kemanusiaan & Teknikal', subject: 'PSV' },
  { department: 'Kemanusiaan & Teknikal', subject: 'RBT' },
  { department: 'Kemanusiaan & Teknikal', subject: 'GKT' },
  { department: 'Kemanusiaan & Teknikal', subject: 'Prinsip Perakaunan' },
]

const COCO_UNITS = ['Kelab Robotik', 'Kadet Polis', 'Bola Jaring', 'Rumah Sukan Jelawat', 'Persatuan Bahasa', 'Pengakap', 'Kelab Pengawas', 'Bulan Sabit Merah']
const COCO_ACTIVITIES = [
  'Latihan kemahiran asas & sesi tunjuk cara', 'Perjumpaan mingguan & ujian kecergasan', 'Sesi motivasi & aktiviti berpasukan',
  'Taklimat tugasan mingguan', 'Sesi bimbingan pertandingan', 'Mesyuarat persediaan acara tahunan',
]
const ERPH_TOPICS = [
  'Bab 1: Pengenalan', 'Unit 2: Latihan Pengukuhan', 'Bab 3: Persamaan Linear', 'Unit 4: Tatabahasa',
  'Bab 5: Struktur Sel', 'Bab 6: Sejarah Kemerdekaan', 'Latihan Amali Makmal', 'Bab 7: Penilaian',
  'Unit 8: Pembentangan', 'Bab 9: Ulangkaji Akhir', 'Peperiksaan Percubaan: Ulangkaji',
]
const NOTIFICATION_KINDS = [
  { kind: 'erph_submitted', toRole: 'admin', link: '/app/erph/dashboard' },
  { kind: 'mmi_submitted', toRole: 'admin', link: '/app/mmi/dashboard' },
  { kind: 'coco_submitted', toRole: 'admin', link: '/app/kokurikulum/dashboard' },
  { kind: 'assembly_code', toRole: 'guru', link: '/app/perhimpunan' },
  { kind: 'assembly_ended', toRole: 'guru', link: '/app/perhimpunan' },
]

function slug(dept, subject) {
  return `${dept}-${subject}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

async function countForSchool(collectionName, schoolId) {
  const snap = await getDocs(query(collection(db, collectionName), where('schoolId', '==', schoolId)))
  return snap.size
}

async function seedTeachers(schoolId) {
  let created = 0
  const refs = []
  for (let i = 0; i < SEED_TEACHERS.length; i++) {
    const id = `seed-teacher-${i + 1}`
    const t = SEED_TEACHERS[i]
    const snap = await getDoc(doc(db, 'users', id))
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', id), {
        name: t.name,
        email: t.email,
        phone: '',
        photoURL: '',
        role: 'guru',
        schoolId,
        seed: true,
        pdpaConsent: true,
        pdpaConsentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      created++
    }
    refs.push({ id, name: t.name })
  }
  return { collection: 'users', created, refs }
}

async function seedStudents(schoolId) {
  const existing = await countForSchool('students', schoolId)
  let created = 0
  let i = 0
  while (existing + created < MIN_RECORDS && i < SEED_STUDENTS.length * 3) {
    const s = SEED_STUDENTS[i % SEED_STUDENTS.length]
    await addDoc(collection(db, 'students'), { ...s, schoolId, seed: true, createdAt: new Date().toISOString() })
    created++
    i++
  }
  return { collection: 'students', created }
}

async function seedCurriculum(schoolId) {
  let created = 0
  for (const c of SEED_CURRICULUM) {
    const key = slug(c.department, c.subject)
    const snap = await getDoc(doc(db, 'curriculum_links', key))
    if (!snap.exists() || !snap.data()?.url) {
      await setDoc(doc(db, 'curriculum_links', key), {
        department: c.department,
        subject: c.subject,
        url: `https://drive.google.com/drive/folders/${key}-demo`,
        schoolId,
        seed: true,
        updatedAt: new Date().toISOString(),
      })
      created++
    }
  }
  return { collection: 'curriculum_links', created }
}

async function seedRecordCollection(collectionName, schoolId, teachers, buildDoc) {
  const existing = await countForSchool(collectionName, schoolId)
  let created = 0
  let i = 0
  while (existing + created < MIN_RECORDS) {
    const teacher = teachers[i % teachers.length]
    await addDoc(collection(db, collectionName), buildDoc(teacher, i))
    created++
    i++
  }
  return { collection: collectionName, created }
}

// Tops up the CURRENTLY SIGNED-IN account's own records (not the fake seed
// teachers) so "My Recent Records" on the Submit pages has something to show
// too — e.g. for taking screenshots. MIN_OWN_RECORDS matches the 12-row cap
// those pages already display.
const MIN_OWN_RECORDS = 12

async function countOwn(collectionName, schoolId, uid) {
  const snap = await getDocs(query(
    collection(db, collectionName),
    where('schoolId', '==', schoolId),
    where('teacherUid', '==', uid)
  ))
  return snap.size
}

async function seedOwnRecordCollection(collectionName, schoolId, uid, name, buildDoc) {
  const existing = await countOwn(collectionName, schoolId, uid)
  let created = 0
  let i = 0
  while (existing + created < MIN_OWN_RECORDS) {
    await addDoc(collection(db, collectionName), buildDoc({ id: uid, name }, i))
    created++
    i++
  }
  return { collection: `${collectionName} (my records)`, created }
}

async function seedAssemblySessions(schoolId, adminUid) {
  let created = 0
  const dates = []
  for (let i = 0; i < MIN_RECORDS; i++) {
    const dateStr = daysAgo(i)
    dates.push(dateStr)
    const snap = await getDoc(doc(db, 'assembly_sessions', dateStr))
    if (!snap.exists()) {
      await setDoc(doc(db, 'assembly_sessions', dateStr), {
        code: String(1000 + ((i * 137) % 9000)),
        active: i === 0,
        createdBy: adminUid,
        schoolId,
        seed: true,
        createdAt: isoAt(dateStr, 7),
      })
      created++
    }
  }
  return { collection: 'assembly_sessions', created, dates }
}

// Runs one seeding step in isolation — a permission or data error in one
// collection must not abort the rest, and the caller needs to know exactly
// which collection failed and why.
async function safeStep(collectionName, results, fn) {
  try {
    results.push(await fn())
  } catch (err) {
    console.error(`[seed] "${collectionName}" step failed`, err)
    results.push({ collection: collectionName, created: 0, error: err.code || err.message || String(err) })
  }
}

export async function runProductionSeed(schoolId, adminUid, adminName) {
  const results = []
  let teachers = []
  let dates = []

  await safeStep('users', results, async () => {
    const { refs, ...usersResult } = await seedTeachers(schoolId)
    teachers = refs
    return usersResult
  })

  await safeStep('students', results, () => seedStudents(schoolId))
  await safeStep('curriculum_links', results, () => seedCurriculum(schoolId))

  await safeStep('assembly_sessions', results, async () => {
    const { dates: d, ...assemblySessionsResult } = await seedAssemblySessions(schoolId, adminUid)
    dates = d
    return assemblySessionsResult
  })

  if (teachers.length === 0) {
    results.push({ collection: 'erph/mmi/coco/timetable/assembly_checkins', created: 0, error: 'skipped — no teachers available (users step failed above)' })
    return results
  }
  if (dates.length === 0) dates = [daysAgo(0)]

  await safeStep('erph', results, () => seedRecordCollection('erph', schoolId, teachers, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      matapelajaran: pick(SUBJECTS, i),
      tingkatan: pick(FORMS, i + 1),
      kelas: pick(CLASSES, i + 2),
      tajuk: pick(ERPH_TOPICS, i),
      catatan: '',
      createdAt: isoAt(tarikh, 8 + (i % 4)),
    }
  }))

  await safeStep('mmi', results, () => seedRecordCollection('mmi', schoolId, teachers, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      matapelajaran: pick(SUBJECTS, i + 3),
      tingkatan: pick(FORMS, i),
      kelas: pick(CLASSES, i + 1),
      masa: pick(TIME_SLOTS, i),
      kehadiranPelajar: 22 + (i % 10),
      catatan: '',
      createdAt: isoAt(tarikh, 8 + (i % 4)),
    }
  }))

  await safeStep('coco_reports', results, () => seedRecordCollection('coco_reports', schoolId, teachers, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      kategori: pick(COCO_CATEGORIES, i),
      namaUnit: pick(COCO_UNITS, i),
      statusKehadiran: 'HADIR',
      kehadiranPelajar: 18 + (i % 12),
      aktiviti: pick(COCO_ACTIVITIES, i),
      catatan: '',
      createdAt: isoAt(tarikh, 15),
    }
  }))

  await safeStep('coco_attendance', results, () => seedRecordCollection('coco_attendance', schoolId, teachers, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      kategori: pick(COCO_CATEGORIES, i),
      namaUnit: pick(COCO_UNITS, i + 2),
      statusKehadiran: i % 5 === 0 ? 'TIDAK HADIR' : 'HADIR',
      createdAt: isoAt(tarikh, 15),
    }
  }))

  await safeStep('timetable', results, () => seedRecordCollection('timetable', schoolId, teachers, (teacher, i) => ({
    teacherUid: teacher.id,
    teacherName: teacher.name,
    schoolId,
    seed: true,
    hari: pick(SCHOOL_DAYS, i),
    masa: pick(TIME_SLOTS, i + 3),
    matapelajaran: pick(SUBJECTS, i),
    tingkatan: pick(FORMS, i + 1),
    kelas: pick(CLASSES, i + 2),
    createdAt: new Date().toISOString(),
  })))

  await safeStep('assembly_checkins', results, () => seedRecordCollection('assembly_checkins', schoolId, teachers, (teacher, i) => {
    const sessionId = dates[i % dates.length]
    return {
      sessionId,
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      jawatan: pick(JAWATAN_LIST, i),
      status: pick(ASSEMBLY_STATUSES, i)?.value || 'HADIR',
      checkedAt: isoAt(sessionId, 7),
    }
  }))

  await safeStep('notifications', results, () => seedRecordCollection('notifications', schoolId, teachers, (teacher, i) => {
    const n = pick(NOTIFICATION_KINDS, i)
    return {
      toRole: n.toRole,
      toUid: null,
      kind: n.kind,
      teacherName: teacher.name,
      link: n.link,
      schoolId,
      seed: true,
      readBy: [],
      createdAt: isoAt(daysAgo(i % 20), 8),
    }
  }))

  // Also top up the CALLING account's own records — the fake teachers above
  // only populate school-wide dashboards; "My Recent Records" on the Submit
  // pages is filtered to the signed-in user's own teacherUid, so it stays
  // empty otherwise.
  const me = { id: adminUid, name: adminName || 'Me' }

  await safeStep('erph (my records)', results, () => seedOwnRecordCollection('erph', schoolId, adminUid, me.name, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      matapelajaran: pick(SUBJECTS, i),
      tingkatan: pick(FORMS, i + 1),
      kelas: pick(CLASSES, i + 2),
      tajuk: pick(ERPH_TOPICS, i),
      catatan: '',
      createdAt: isoAt(tarikh, 8 + (i % 4)),
    }
  }))

  await safeStep('mmi (my records)', results, () => seedOwnRecordCollection('mmi', schoolId, adminUid, me.name, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      matapelajaran: pick(SUBJECTS, i + 3),
      tingkatan: pick(FORMS, i),
      kelas: pick(CLASSES, i + 1),
      masa: pick(TIME_SLOTS, i),
      kehadiranPelajar: 22 + (i % 10),
      catatan: '',
      createdAt: isoAt(tarikh, 8 + (i % 4)),
    }
  }))

  await safeStep('coco_reports (my records)', results, () => seedOwnRecordCollection('coco_reports', schoolId, adminUid, me.name, (teacher, i) => {
    const tarikh = daysAgo(i % 20)
    return {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      schoolId,
      seed: true,
      tarikh,
      kategori: pick(COCO_CATEGORIES, i),
      namaUnit: pick(COCO_UNITS, i),
      perjumpaan: String(1 + (i % 10)),
      tempat: 'Padang Sekolah',
      tajuk: pick(COCO_ACTIVITIES, i),
      aktiviti: pick(COCO_ACTIVITIES, i),
      rumusan: 'Perjumpaan berjalan lancar dan aktif disertai oleh semua ahli.',
      guruPembimbing: [teacher.name],
      gambar: [],
      statusKehadiran: 'HADIR',
      kehadiranPelajar: 18 + (i % 12),
      catatan: '',
      createdAt: isoAt(tarikh, 15),
    }
  }))

  return results
}
