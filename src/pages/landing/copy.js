// Landing page text in both languages (the original landing layout).
// Every figure describes the system itself: 7 modules, 2 roles. There are no
// usage numbers, and the 3 steps are the real way staff use it.

const ms = {
  navFeatures: 'Ciri-ciri', navModules: 'Modul', navHow: 'Cara Berfungsi',
  login: 'Log Masuk', menu: 'Menu', closeMenu: 'Tutup menu',
  kicker: 'Sistem Sekolah Bersepadu',
  heroTitle: 'Satu Sistem, Semua Urusan Sekolah',
  heroBody: 'Gantikan Google Form, Looker Studio dan folder Drive yang berselerak dengan satu sistem untuk e-RPH, kehadiran, kokurikulum, kurikulum dan maklumat pelajar, siap dengan papan pemuka masa nyata untuk pentadbir.',
  loginNow: 'Log Masuk Sekarang', viewModules: 'Lihat Semua Modul',
  stats: [
    { value: '7', label: 'Modul bersepadu' },
    { value: '2', label: 'Peranan: Guru & Pentadbir' },
    { value: 'Masa nyata', label: 'Papan pemuka' },
  ],
  shotAlt: 'Papan pemuka pentadbir SchoolManage: jubin hari ini, carta e-RPH 7 hari dan senarai guru yang belum hantar',
  shotCaption: 'Paparan sebenar sistem, dengan data ujian',
  floatNotifTitle: 'Notifikasi baharu',
  floatNotifBody: 'e-RPH baharu telah dihantar',
  floatCodeTitle: 'Kod perhimpunan hari ini',
  floatCodeNote: 'Ditukar setiap hari',

  featuresEyebrow: 'Ciri-ciri', featuresTitle: 'Direka Untuk Cara Sekolah Sebenar Beroperasi',
  featuresDesc: 'Setiap modul dibina berdasarkan borang dan proses yang sedia digunakan oleh sekolah, cuma lebih kemas dan tersusun.',
  f1Title: 'Log Masuk Selamat', f1Desc: 'Google Sign-In terhad kepada domain e-mel rasmi sekolah. Tiada kata laluan baharu untuk diingati.',
  f1Field: 'nama@sekolah.edu.my',
  f2Title: 'Papan Pemuka Masa Nyata', f2Desc: 'Pentadbir nampak status penghantaran, kehadiran dan laporan tanpa menunggu e-mel atau memuat turun spreadsheet.',
  f2Chart: 'e-RPH, 7 hari lepas',
  f3Title: 'Kawalan Peranan', f3Desc: 'Guru dan pentadbir melihat paparan yang berbeza secara automatik. Tiada siapa boleh jadikan diri sendiri pentadbir.',
  f4Title: 'Boleh Berkembang', f4Desc: 'Bermula dengan modul asas dan tambah modul baharu tanpa mengganggu data sedia ada.',
  f4Planned: 'Tahfiz (dirancang)',

  modulesEyebrow: 'Modul', modulesTitle: 'Satu Sistem, Semua Urusan Harian',
  modulesDesc: 'Semua yang diperlukan oleh guru dan pentadbir, dalam satu tempat.',
  roleTeacher: 'Guru', roleAdmin: 'Pentadbir', roleStaff: 'Semua staf',
  modules: [
    { key: 'erph', title: 'e-RPH', desc: 'Penghantaran dan pemantauan Rekod Pengajaran Harian setiap guru.', roles: ['teacher', 'admin'] },
    { key: 'mmi', title: 'Check-in Kelas (MMI)', desc: 'Rekod keberadaan guru dalam bilik darjah bagi setiap sesi.', roles: ['teacher', 'admin'] },
    { key: 'assembly', title: 'Kehadiran Perhimpunan', desc: 'Check-in pantas dengan kod harian semasa perhimpunan rasmi.', roles: ['staff', 'admin'] },
    { key: 'coco', title: 'Kokurikulum', desc: 'Laporan perjumpaan kelab, badan beruniform, sukan dan rumah sukan, serta rekod kehadiran.', roles: ['teacher', 'admin'] },
    { key: 'curriculum', title: 'Unit Kurikulum', desc: 'Pautan e-folder panitia mata pelajaran tersusun mengikut jabatan.', roles: ['teacher', 'admin'] },
    { key: 'students', title: 'Maklumat Pelajar', desc: 'Pangkalan data pelajar yang boleh dicari dan ditapis ikut kelas.', roles: ['admin'] },
    { key: 'timetable', title: 'Jadual Waktu', desc: 'Jadual mengajar setiap guru dengan pengesanan pertindihan slot dan eksport PDF/Excel.', roles: ['teacher', 'admin'] },
  ],

  howEyebrow: 'Cara Berfungsi', howTitle: 'Begini Sistem Digunakan Setiap Hari',
  steps: [
    { title: 'Log masuk dengan e-mel sekolah', desc: 'Guru dan staf log masuk dengan akaun rasmi sekolah. Peranan pentadbir diluluskan oleh pihak sekolah.' },
    { title: 'Rekod urusan harian', desc: 'Hantar e-RPH, check-in kelas dan perhimpunan, dan laporan kokurikulum dari telefon atau komputer.' },
    { title: 'Pentadbir pantau serta-merta', desc: 'Papan pemuka menunjukkan siapa sudah dan belum hantar, dengan eksport Excel atau PDF.' },
  ],
  stepPreview: ['Log Masuk', 'Hantar e-RPH', 'Belum hantar'],

  ctaTitle: 'Sedia Untuk Mula Hari Ini?',
  ctaDesc: 'Log masuk dengan akaun sekolah anda. Belum ada akaun? Hubungi Unit ICT atau pentadbiran sekolah.',
  ctaSupport: 'Hubungi Sokongan',
  footerTagline: 'Sistem pengurusan operasi harian sekolah dalam satu platform.',
  footerProduct: 'Produk', footerLegal: 'Legal',
  privacy: 'Dasar Privasi (PDPA)', terms: 'Terma Perkhidmatan', support: 'Sokongan & Pemadaman Data',
  rights: 'Hak cipta terpelihara.',
}

const en = {
  navFeatures: 'Features', navModules: 'Modules', navHow: 'How It Works',
  login: 'Log In', menu: 'Menu', closeMenu: 'Close menu',
  kicker: 'Integrated School System',
  heroTitle: 'One System, All School Matters',
  heroBody: 'Replace scattered Google Forms, Looker Studio and Drive folders with one system for e-RPH, attendance, co-curriculum, curriculum and student records, complete with a real-time dashboard for admins.',
  loginNow: 'Log In Now', viewModules: 'View All Modules',
  stats: [
    { value: '7', label: 'Integrated modules' },
    { value: '2', label: 'Roles: Teacher & Admin' },
    { value: 'Real-time', label: 'Dashboard' },
  ],
  shotAlt: 'SchoolManage admin dashboard: today tiles, a 7-day e-RPH chart and the list of teachers yet to submit',
  shotCaption: 'The real system, with test data',
  floatNotifTitle: 'New notification',
  floatNotifBody: 'A new e-RPH has been submitted',
  floatCodeTitle: "Today's assembly code",
  floatCodeNote: 'Changes every day',

  featuresEyebrow: 'Features', featuresTitle: 'Built for How Schools Actually Operate',
  featuresDesc: 'Every module is built around the forms and processes schools already use, just tidier and better organised.',
  f1Title: 'Secure Sign-In', f1Desc: "Google Sign-In restricted to the school's official email domain. No new passwords to remember.",
  f1Field: 'name@school.edu.my',
  f2Title: 'Real-Time Dashboard', f2Desc: 'Admins see submission status, attendance and reports without waiting for emails or downloading spreadsheets.',
  f2Chart: 'e-RPH, last 7 days',
  f3Title: 'Role-Based Access', f3Desc: 'Teachers and admins automatically see different views. Nobody can make themselves an admin.',
  f4Title: 'Built to Grow', f4Desc: 'Start with the core modules and add new ones without disrupting existing data.',
  f4Planned: 'Tahfiz (planned)',

  modulesEyebrow: 'Modules', modulesTitle: 'One System, All Daily Matters',
  modulesDesc: 'Everything teachers and admins need, in one place.',
  roleTeacher: 'Teachers', roleAdmin: 'Admins', roleStaff: 'All staff',
  modules: [
    { key: 'erph', title: 'e-RPH', desc: "Submission and monitoring of every teacher's daily lesson record.", roles: ['teacher', 'admin'] },
    { key: 'mmi', title: 'Class Check-in (MMI)', desc: "Record of teachers' classroom presence for every session.", roles: ['teacher', 'admin'] },
    { key: 'assembly', title: 'Assembly Attendance', desc: 'Fast check-in with a daily code during official assemblies.', roles: ['staff', 'admin'] },
    { key: 'coco', title: 'Co-curriculum', desc: 'Meeting reports for clubs, uniformed bodies, sports and sports houses, plus attendance records.', roles: ['teacher', 'admin'] },
    { key: 'curriculum', title: 'Curriculum Unit', desc: 'Subject panel e-folder links organised by department.', roles: ['teacher', 'admin'] },
    { key: 'students', title: 'Student Records', desc: 'A searchable student database, filterable by class.', roles: ['admin'] },
    { key: 'timetable', title: 'Timetable', desc: "Every teacher's teaching schedule with clash detection and PDF/Excel export.", roles: ['teacher', 'admin'] },
  ],

  howEyebrow: 'How It Works', howTitle: 'How the System Is Used Every Day',
  steps: [
    { title: 'Log in with your school email', desc: 'Teachers and staff sign in with their official school account. The admin role is approved by the school.' },
    { title: 'Record daily work', desc: 'Submit e-RPH, class and assembly check-ins, and co-curriculum reports from a phone or computer.' },
    { title: 'Admins monitor straight away', desc: "The dashboard shows who has and hasn't submitted, with Excel or PDF export." },
  ],
  stepPreview: ['Log In', 'Submit e-RPH', 'Not yet'],

  ctaTitle: 'Ready to Start Today?',
  ctaDesc: 'Log in with your school account. No account yet? Contact the ICT Unit or the school office.',
  ctaSupport: 'Contact Support',
  footerTagline: "The school's daily operations system, in one platform.",
  footerProduct: 'Product', footerLegal: 'Legal',
  privacy: 'Privacy Policy (PDPA)', terms: 'Terms of Service', support: 'Support & Data Deletion',
  rights: 'All rights reserved.',
}

export function getLandingCopy(language) {
  return language === 'en' ? en : ms
}
