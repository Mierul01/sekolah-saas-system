// One-click sample data generator for Local Test Mode, so every module and
// dashboard has something real to look at instead of empty states. Every
// generated list aims for at least 10 records so tables never look sparse.

import { collection, doc, addDoc, setDoc, getDocs, deleteDoc, query, where, db } from './db'
import { SUBJECTS, FORMS, CLASSES, TIME_SLOTS, COCO_CATEGORIES, JAWATAN_LIST, SCHOOL_DAYS, toLocalISODate } from './constants'

const RECORDS_PER_TEACHER = 10
const personalizeInFlight = new Set()

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

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Real teachers specialise — almost every period a given teacher shows up in
// is the same subject. Deriving it from their own id/name (not the slot's
// seed) keeps one teacher tied to one subject everywhere they're scheduled,
// for any teacher (demo or real) without needing a separate assignment table.
function primarySubjectFor(teacher) {
  return pick(SUBJECTS, hashString(teacher.id || teacher.name || ''))
}

// Occasionally covering a colleague's class (RELIEF/GURU GANTI) is realistic;
// teaching five unrelated subjects across the week is not.
function subjectForSlot(teacher, seed) {
  return seed % 6 === 0 ? 'RELIEF/GURU GANTI' : primarySubjectFor(teacher)
}

function slugFromEmail(email) {
  return 'local-' + email.split('@')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const DEMO_TEACHERS = [
  { name: 'Cikgu Faizal Rahman', email: 'faizal.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Nurul Huda', email: 'nurul.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Hafiz Zulkifli', email: 'hafiz.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Aina Syazwani', email: 'aina.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Farid Iskandar', email: 'farid.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Balqis Natasha', email: 'balqis.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Syafiq Adam', email: 'syafiq.demo@smkatokbachok.edu.my' },
  { name: 'Cikgu Wan Aisyah', email: 'aisyah.demo@smkatokbachok.edu.my' },
]

const DEMO_STUDENTS = [
  { namaPenuh: 'Ahmad Danish bin Rosli', noKP: '120304-03-1234', tingkatan: 'TINGKATAN 1', kelas: 'QALUN', jantina: 'Lelaki', namaPenjaga: 'Rosli bin Ismail', noTelefonPenjaga: '019-2345671' },
  { namaPenuh: 'Nur Alisya binti Zulkarnain', noKP: '120512-03-5678', tingkatan: 'TINGKATAN 1', kelas: 'WARSH', jantina: 'Perempuan', namaPenjaga: 'Zulkarnain bin Hassan', noTelefonPenjaga: '013-8765432' },
  { namaPenuh: 'Muhammad Haziq bin Anuar', noKP: '110115-03-2211', tingkatan: 'TINGKATAN 2', kelas: 'HAFS', jantina: 'Lelaki', namaPenjaga: 'Anuar bin Yaacob', noTelefonPenjaga: '017-6543219' },
  { namaPenuh: 'Siti Nur Aqilah binti Rahim', noKP: '110228-03-3344', tingkatan: 'TINGKATAN 2', kelas: "SHU'BAH", jantina: 'Perempuan', namaPenjaga: 'Abdul Rahim bin Salleh', noTelefonPenjaga: '012-3456788' },
  { namaPenuh: 'Amirul Iman bin Zainal', noKP: '100407-03-4455', tingkatan: 'TINGKATAN 3', kelas: 'AR RAZI', jantina: 'Lelaki', namaPenjaga: 'Zainal bin Kamaruddin', noTelefonPenjaga: '019-7778889' },
  { namaPenuh: 'Farah Izzati binti Shukor', noKP: '100619-03-5566', tingkatan: 'TINGKATAN 3', kelas: 'AL BIRUNI', jantina: 'Perempuan', namaPenjaga: 'Shukor bin Latif', noTelefonPenjaga: '013-2223334' },
  { namaPenuh: 'Danial Haqimi bin Roslan', noKP: '090722-03-6677', tingkatan: 'TINGKATAN 4', kelas: 'AZ ZAHRAWI', jantina: 'Lelaki', namaPenjaga: 'Roslan bin Idris', noTelefonPenjaga: '017-9990001' },
  { namaPenuh: 'Nur Batrisyia binti Kamal', noKP: '090830-03-7788', tingkatan: 'TINGKATAN 4', kelas: 'IBNU KHALDUN', jantina: 'Perempuan', namaPenjaga: 'Kamal bin Othman', noTelefonPenjaga: '012-4445556' },
  { namaPenuh: 'Adam Haikal bin Suhaimi', noKP: '080911-03-8899', tingkatan: 'TINGKATAN 5', kelas: 'IBNU SINA', jantina: 'Lelaki', namaPenjaga: 'Suhaimi bin Jaafar', noTelefonPenjaga: '019-1112223' },
  { namaPenuh: 'Qistina Aleesya binti Farid', noKP: '081203-03-9900', tingkatan: 'TINGKATAN 5', kelas: "AL BAZZI", jantina: 'Perempuan', namaPenjaga: 'Farid bin Mahmud', noTelefonPenjaga: '013-5556667' },
]

const CURRICULUM_SEED = [
  { department: 'Bahasa', subject: 'Bahasa Melayu', url: 'https://drive.google.com/drive/folders/bahasa-melayu-demo' },
  { department: 'Bahasa', subject: 'Bahasa Inggeris', url: 'https://drive.google.com/drive/folders/bahasa-inggeris-demo' },
  { department: 'Bahasa', subject: 'Bahasa Arab', url: 'https://drive.google.com/drive/folders/bahasa-arab-demo' },
  { department: 'STEM', subject: 'Matematik', url: 'https://drive.google.com/drive/folders/matematik-demo' },
  { department: 'STEM', subject: 'Sains Teras', url: 'https://drive.google.com/drive/folders/sains-teras-demo' },
  { department: 'STEM', subject: 'Fizik', url: 'https://drive.google.com/drive/folders/fizik-demo' },
  { department: 'Agama & Tahfiz', subject: 'Pendidikan Islam', url: 'https://drive.google.com/drive/folders/pendidikan-islam-demo' },
  { department: 'Agama & Tahfiz', subject: 'Hifz Al-Quran', url: 'https://drive.google.com/drive/folders/hifz-al-quran-demo' },
  { department: 'Kemanusiaan & Teknikal', subject: 'Sejarah', url: 'https://drive.google.com/drive/folders/sejarah-demo' },
  { department: 'Kemanusiaan & Teknikal', subject: 'Geografi', url: 'https://drive.google.com/drive/folders/geografi-demo' },
]

const ERPH_TOPICS = [
  'Bab 1: Pengenalan', 'Unit 2: Latihan Pengukuhan', 'Bab 3: Persamaan Linear', 'Unit 4: Tatabahasa',
  'Bab 5: Struktur Sel', 'Bab 6: Sejarah Kemerdekaan', 'Latihan Amali Makmal', 'Bab 7: Penilaian',
  'Unit 8: Pembentangan', 'Bab 9: Ulangkaji Akhir', 'Peperiksaan Percubaan: Ulangkaji',
]

const COCO_UNITS = ['Kelab Robotik', 'Kadet Polis', 'Bola Jaring', 'Rumah Sukan Jelawat', 'Persatuan Bahasa', 'Pengakap', 'Kelab Pengawas', 'Bulan Sabit Merah']
const COCO_ACTIVITIES = [
  'Latihan kemahiran asas & sesi tunjuk cara', 'Perjumpaan mingguan & ujian kecergasan', 'Sesi motivasi & aktiviti berpasukan',
  'Taklimat tugasan mingguan', 'Sesi bimbingan pertandingan', 'Mesyuarat persediaan acara tahunan',
]

function slug(dept, subject) {
  return `${dept}-${subject}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

// Generates e-RPH/MMI/Co-curriculum records for one user, spread across the
// recent past. `skipToday` keeps today free (used for the "not submitted
// today" demo state and to avoid skewing today's ratios). `count`/`startIndex`
// let a top-up call continue the sequence instead of restarting it.
async function addRecordsForUser(user, { skipToday = false, todayOffset = null, count = RECORDS_PER_TEACHER, startIndex = 0 } = {}) {
  for (let n = 0; n < count; n++) {
    const i = startIndex + n
    let dayOffset = i
    if (skipToday && dayOffset === 0) dayOffset = RECORDS_PER_TEACHER
    if (!skipToday && todayOffset !== null && dayOffset === 0) dayOffset = todayOffset
    const tarikh = daysAgo(dayOffset)
    const hour = 8 + (i % 4)

    await addDoc(collection(db, 'erph'), {
      teacherUid: user.id,
      teacherName: user.name,
      tarikh,
      matapelajaran: pick(SUBJECTS, i),
      tingkatan: pick(FORMS, i + 1),
      kelas: pick(CLASSES, i + 2),
      tajuk: pick(ERPH_TOPICS, i),
      catatan: '',
      createdAt: isoAt(tarikh, hour),
    })
    await addDoc(collection(db, 'mmi'), {
      teacherUid: user.id,
      teacherName: user.name,
      tarikh,
      matapelajaran: pick(SUBJECTS, i + 3),
      tingkatan: pick(FORMS, i),
      kelas: pick(CLASSES, i + 1),
      masa: pick(TIME_SLOTS, i),
      kehadiranPelajar: 22 + (i % 10),
      catatan: '',
      createdAt: isoAt(tarikh, hour),
    })
    await addDoc(collection(db, 'coco_reports'), {
      teacherUid: user.id,
      teacherName: user.name,
      tarikh: daysAgo(dayOffset + 1),
      kategori: pick(COCO_CATEGORIES, i),
      namaUnit: pick(COCO_UNITS, i),
      statusKehadiran: 'HADIR',
      kehadiranPelajar: 18 + (i % 12),
      aktiviti: pick(COCO_ACTIVITIES, i),
      catatan: '',
      createdAt: isoAt(daysAgo(dayOffset + 1), 15),
    })
  }
}

const TIMETABLE_SLOTS_PER_TEACHER = 3
const timetableInFlight = new Set()
const fullTimetableInFlight = new Set()

// A dense but real school day — skips 10.00-10.30 (REHAT) and the two
// overlapping long-block slots that aren't actual teaching periods.
const DEMO_FULL_PERIODS = [
  '7.00 - 8.00', '8.00 - 8.30', '8.30 - 9.00', '9.00 - 9.30', '9.30 - 10.00',
  '10.30 - 11.00', '11.00 - 11.30', '11.30 - 12.00', '12.00 - 12.30', '12.30 - 1.00',
]
// One fully-scheduled class per form — enough classes that most active
// teachers end up appearing across several of them, so a teacher's own
// timetable (derived from these same slots) reads as a genuinely complete
// week rather than a handful of scattered periods.
const DEMO_FULL_CLASSES = FORMS.map((tingkatan) => ({ tingkatan, kelas: CLASSES[0] }))
const FULL_TIMETABLE_FLAG = 'ldb_full_timetable_v3'

// Real subjects run in blocks of one to three consecutive periods (a double
// period for practicals, a triple block for core subjects) rather than a
// fresh subject every single 30-minute slot — this weights how long a block
// runs before the day switches to the next subject.
const BLOCK_LENGTH_WEIGHTS = [1, 1, 2, 2, 3]

async function addTimetableSlotsForTeacher(teacher, seedOffset = 0, count = TIMETABLE_SLOTS_PER_TEACHER) {
  for (let i = 0; i < count; i++) {
    const seed = seedOffset + i
    await addDoc(collection(db, 'timetable'), {
      teacherUid: teacher.id,
      teacherName: teacher.name,
      hari: pick(SCHOOL_DAYS, seed),
      masa: pick(TIME_SLOTS, seed + 3),
      matapelajaran: subjectForSlot(teacher, seed),
      tingkatan: pick(FORMS, seed + 1),
      kelas: pick(CLASSES, seed + 2),
      createdAt: new Date().toISOString(),
    })
  }
}

// Tops up whichever single user is currently logged in with their own record
// history, regardless of whether they registered before or after the base
// demo data — so "My Recent Records" always has at least RECORDS_PER_TEACHER
// rows for anyone, including accounts seeded before this threshold was raised.
export async function ensurePersonalRecords(user) {
  if (!user?.id || personalizeInFlight.has(user.id)) return
  personalizeInFlight.add(user.id)
  try {
    const snap = await getDocs(query(collection(db, 'erph'), where('teacherUid', '==', user.id)))
    const existing = snap.docs.length
    if (existing < RECORDS_PER_TEACHER) {
      await addRecordsForUser(user, { count: RECORDS_PER_TEACHER - existing, startIndex: existing })
    }
  } finally {
    personalizeInFlight.delete(user.id)
  }
}

// Makes sure the timetable isn't empty (base data may predate this feature)
// and that whoever is logged in has some slots of their own to see and export.
export async function ensureTimetableData(user) {
  if (!user?.id || timetableInFlight.has(user.id)) return
  timetableInFlight.add(user.id)
  try {
    const allSnap = await getDocs(collection(db, 'timetable'))
    if (allSnap.empty) {
      const usersSnap = await getDocs(collection(db, 'users'))
      const staff = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === 'guru' || u.role === 'admin')
      for (let i = 0; i < staff.length; i++) {
        await addTimetableSlotsForTeacher(staff[i], i * 3)
      }
    }
    const mineSnap = await getDocs(query(collection(db, 'timetable'), where('teacherUid', '==', user.id)))
    if (mineSnap.empty) {
      await addTimetableSlotsForTeacher(user, 30)
    }
  } finally {
    timetableInFlight.delete(user.id)
  }
}

function isDemoFullClass(r) {
  return DEMO_FULL_CLASSES.some((c) => c.tingkatan === r.tingkatan && c.kelas === r.kelas)
}

// Fills every day+period cell for one fully-scheduled class per form so
// there's a genuinely complete, dense grid to export — matching the density
// of a real printed timetable instead of a handful of scattered slots. A
// teacher never gets double-booked into two classes at the same day+period,
// and each teacher keeps to their own subject (see subjectForSlot) so a
// teacher's own timetable — built from these same slots — reads as a real,
// coherent week. Only touches cells that are still empty, so it's safe to
// call on every mount.
// One full test class (local test mode only) so the student list has enough
// rows to test paging, search and filters: Maklumat Pelajar, filter
// TINGKATAN 1 + HAFS, then Tapis. Names are made-up combinations.
export const TEST_CLASS = { tingkatan: 'TINGKATAN 1', kelas: 'HAFS', size: 50 }
const TEST_CLASS_FLAG = 'ldb_test_class_v1'
const TEST_FIRST_BOYS = ['Muhammad Aqil', 'Ahmad Irfan', 'Adam Rayyan', 'Muhammad Harith', 'Aiman Hakimi', 'Danish Iskandar', 'Haris Zafran', 'Luqman Hakim', 'Muhammad Ilham', 'Syahmi Afiq', 'Firdaus Amsyar', 'Izzat Daniel', 'Naufal Rizqi']
const TEST_FIRST_GIRLS = ['Nur Aisyah', 'Siti Humaira', 'Nur Damia', 'Alya Maisarah', 'Nurul Iman', 'Sofea Qaisara', 'Hana Insyirah', 'Nur Batrisya', 'Aina Safiyya', 'Irdina Zahra', 'Puteri Balqis', 'Nur Qistina']
const TEST_FATHERS = ['Ismail', 'Hamzah', 'Rashid', 'Zakaria', 'Kamarul', 'Azlan', 'Mohd Nor', 'Sulaiman', 'Hisham', 'Fauzi', 'Rahman', 'Yusof', 'Shahrul', 'Hairul', 'Nizam', 'Ridzuan', 'Zulkifli']

let testClassInFlight = false

export async function ensureTestClass() {
  if (testClassInFlight || localStorage.getItem(TEST_CLASS_FLAG) === '1') return
  testClassInFlight = true
  try {
    localStorage.setItem(TEST_CLASS_FLAG, '1')
    const snap = await getDocs(query(
      collection(db, 'students'),
      where('tingkatan', '==', TEST_CLASS.tingkatan),
      where('kelas', '==', TEST_CLASS.kelas)
    ))
    for (let i = snap.docs.length; i < TEST_CLASS.size; i++) {
      const boy = i % 2 === 0
      const first = boy ? TEST_FIRST_BOYS[(i / 2) % TEST_FIRST_BOYS.length | 0] : TEST_FIRST_GIRLS[((i - 1) / 2) % TEST_FIRST_GIRLS.length | 0]
      const father = TEST_FATHERS[(i * 7) % TEST_FATHERS.length]
      const month = String((i % 12) + 1).padStart(2, '0')
      const day = String((i % 27) + 1).padStart(2, '0')
      await addDoc(collection(db, 'students'), {
        namaPenuh: `${first} ${boy ? 'bin' : 'binti'} ${father}`,
        noKP: `13${month}${day}-01-${String(5000 + i * 37).slice(-4)}`,
        tingkatan: TEST_CLASS.tingkatan,
        kelas: TEST_CLASS.kelas,
        jantina: boy ? 'Lelaki' : 'Perempuan',
        namaPenjaga: `${father} bin ${TEST_FATHERS[(i * 3 + 5) % TEST_FATHERS.length]}`,
        noTelefonPenjaga: `01${(i % 9) + 1}-${String(2000000 + i * 4111).slice(-7)}`,
        createdAt: new Date().toISOString(),
      })
    }
  } finally {
    testClassInFlight = false
  }
}

export async function ensureFullClassTimetable() {
  if (fullTimetableInFlight.has('full')) return
  fullTimetableInFlight.add('full')
  try {
    const snap = await getDocs(collection(db, 'timetable'))
    const allEntries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // v1/v2 of this seeder filled only one class, sometimes with one subject
    // per single period. Regenerate every demo-covered class's auto-filled
    // slots once under the new (multi-class, subject-consistent) rules, then
    // behave as a normal top-up.
    const migrated = localStorage.getItem(FULL_TIMETABLE_FLAG) === '1'
    if (!migrated) {
      localStorage.setItem(FULL_TIMETABLE_FLAG, '1')
      for (const r of allEntries) {
        if (isDemoFullClass(r) && DEMO_FULL_PERIODS.includes(r.masa)) {
          await deleteDoc(doc(db, 'timetable', r.id))
        }
      }
    }
    const remaining = migrated ? allEntries : allEntries.filter((r) => !(isDemoFullClass(r) && DEMO_FULL_PERIODS.includes(r.masa)))

    const usersSnap = await getDocs(collection(db, 'users'))
    const staff = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === 'guru' || u.role === 'admin')
    if (staff.length === 0) return

    const teacherBusy = new Set(remaining.map((r) => `${r.teacherUid}|${r.hari}|${r.masa}`))

    let seed = 0
    for (const { tingkatan, kelas } of DEMO_FULL_CLASSES) {
      const filledCells = new Set(
        remaining.filter((r) => r.tingkatan === tingkatan && r.kelas === kelas).map((r) => `${r.hari}|${r.masa}`)
      )
      for (const day of SCHOOL_DAYS) {
        let i = 0
        while (i < DEMO_FULL_PERIODS.length) {
          const blockLen = Math.min(pick(BLOCK_LENGTH_WEIGHTS, seed), DEMO_FULL_PERIODS.length - i)
          const periodsInBlock = DEMO_FULL_PERIODS.slice(i, i + blockLen)
          const blockTaken = periodsInBlock.some((p) => filledCells.has(`${day}|${p}`))
          if (!blockTaken) {
            // Prefer a teacher who's free for this whole block elsewhere —
            // falls back to a clash only if every teacher is already busy.
            let teacher = staff[seed % staff.length]
            for (let attempt = 0; attempt < staff.length; attempt++) {
              const candidate = staff[(seed + attempt) % staff.length]
              if (periodsInBlock.every((p) => !teacherBusy.has(`${candidate.id}|${day}|${p}`))) {
                teacher = candidate
                break
              }
            }
            const subject = subjectForSlot(teacher, seed)
            for (const period of periodsInBlock) {
              await addDoc(collection(db, 'timetable'), {
                teacherUid: teacher.id,
                teacherName: teacher.name,
                hari: day,
                masa: period,
                matapelajaran: subject,
                tingkatan,
                kelas,
                createdAt: new Date().toISOString(),
              })
              teacherBusy.add(`${teacher.id}|${day}|${period}`)
              filledCells.add(`${day}|${period}`)
            }
          }
          i += blockLen
          seed++
        }
      }
    }
  } finally {
    fullTimetableInFlight.delete('full')
  }
}

export async function seedSampleData() {
  const usersSnap = await getDocs(collection(db, 'users'))
  const existingUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  const teacherRefs = []
  for (const t of DEMO_TEACHERS) {
    const existing = existingUsers.find((u) => u.email === t.email)
    if (existing) {
      teacherRefs.push(existing)
      continue
    }
    const uid = slugFromEmail(t.email)
    const profile = {
      name: t.name,
      email: t.email,
      phone: '',
      password: 'Demo123',
      photoURL: '',
      role: 'guru',
      pdpaConsent: true,
      pdpaConsentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', uid), profile)
    teacherRefs.push({ id: uid, ...profile })
  }

  const myGuru = existingUsers.find((u) => u.role === 'guru' && !DEMO_TEACHERS.some((t) => t.email === u.email))
  const allTeachers = myGuru ? [...teacherRefs, myGuru] : teacherRefs
  const adminUser = existingUsers.find((u) => u.role === 'admin')

  // Every teacher gets a full, independent set of records — the last one
  // skips today's date so the admin dashboard has a realistic "not submitted
  // today" example.
  for (let i = 0; i < allTeachers.length; i++) {
    await addRecordsForUser(allTeachers[i], {
      skipToday: i === allTeachers.length - 1,
      todayOffset: i, // stagger which past day maps to "today" per teacher for variety
    })
  }

  // Assembly: today's session active, everyone but one teacher checked in
  const today = daysAgo(0)
  await setDoc(doc(db, 'assembly_sessions', today), {
    code: '4821',
    active: true,
    createdBy: adminUser?.id || teacherRefs[0]?.id || 'local-demo-admin',
    createdAt: isoAt(today, 7),
  })
  for (let i = 0; i < allTeachers.length - 1; i++) {
    const teacher = allTeachers[i]
    addDoc(collection(db, 'assembly_checkins'), {
      sessionId: today,
      teacherUid: teacher.id,
      teacherName: teacher.name,
      jawatan: pick(JAWATAN_LIST, i),
      status: i === 1 ? 'BERTUGAS' : 'HADIR',
      checkedAt: isoAt(today, 7),
    })
  }

  // Give the admin account its own record history too (dated before today so
  // it doesn't skew today's compliance ratio), so "My Recent Records" isn't
  // empty when an admin views the submit pages.
  if (adminUser) {
    await addRecordsForUser(adminUser, { skipToday: true })
  }

  // Students
  for (const s of DEMO_STUDENTS) {
    addDoc(collection(db, 'students'), { ...s, createdAt: new Date().toISOString() })
  }

  // Timetable — a handful of slots per teacher, spread across the school
  // week (Ahad–Khamis) and school hours, so the class timetable isn't empty.
  for (let tIdx = 0; tIdx < allTeachers.length; tIdx++) {
    await addTimetableSlotsForTeacher(allTeachers[tIdx], tIdx * 3)
  }

  // Curriculum links
  for (const c of CURRICULUM_SEED) {
    await setDoc(doc(db, 'curriculum_links', slug(c.department, c.subject)), {
      department: c.department,
      subject: c.subject,
      url: c.url,
      updatedAt: new Date().toISOString(),
    })
  }

  // A couple of notifications so the bell isn't empty either
  if (adminUser) {
    await addDoc(collection(db, 'notifications'), {
      toRole: 'admin',
      toUid: null,
      kind: 'erph_submitted',
      teacherName: allTeachers[0]?.name || 'Cikgu Faizal Rahman',
      link: '/app/erph/dashboard',
      readBy: [],
      createdAt: isoAt(today, 8),
    })
  }
  await addDoc(collection(db, 'notifications'), {
    toRole: 'guru',
    toUid: null,
    kind: 'assembly_code',
    teacherName: '',
    link: '/app/perhimpunan',
    readBy: [],
    createdAt: isoAt(today, 7),
  })

  return { teacherCount: allTeachers.length, studentCount: DEMO_STUDENTS.length }
}
