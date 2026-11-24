// Landing page text in both languages. Everything here describes what the
// system really does for each group at the school; there are no usage figures.
// Staff positions match JAWATAN_LIST (Pengetua, PK, Guru Kanan, Guru, AKP).

const ms = {
  portal: 'Portal sistem pengurusan sekolah',
  navPeople: 'Warga Sekolah', navModules: 'Modul', navDay: 'Hari Persekolahan', navHelp: 'Bantuan',
  login: 'Log Masuk', menu: 'Menu', closeMenu: 'Tutup menu',
  themeLight: 'Tukar ke mod cerah', themeDark: 'Tukar ke mod gelap',

  heroTitle: 'Satu sistem untuk seluruh warga sekolah',
  heroLead: 'Pentadbir, guru dan staf {school} merekod urusan harian di satu tempat: e-RPH, kehadiran kelas, perhimpunan, kokurikulum, jadual waktu dan maklumat pelajar.',
  heroLogin: 'Log Masuk ke Sistem',
  heroSeeModules: 'Lihat modul',
  heroNote: 'Gunakan e-mel rasmi sekolah anda.',
  shotAlt: 'Papan pemuka pentadbir SchoolManage: jubin hari ini, carta e-RPH 7 hari dan senarai guru yang belum hantar',
  shotCaption: 'Papan pemuka pentadbir (tangkapan skrin dengan data ujian)',

  peopleTitle: 'Warga sekolah',
  peopleDesc: 'Setiap kumpulan nampak dan buat perkara yang berbeza dalam sistem.',
  people: [
    {
      key: 'admin', title: 'Pentadbir', who: 'Pengetua, Penolong Kanan dan Guru Kanan',
      items: ['Pantau penghantaran e-RPH dan check-in kelas setiap hari', 'Jana kod perhimpunan dan lihat senarai kehadiran', 'Urus maklumat pelajar ikut tingkatan dan kelas'],
    },
    {
      key: 'teacher', title: 'Guru', who: 'Guru mata pelajaran, guru kelas dan guru penasihat',
      items: ['Hantar e-RPH selepas mengajar', 'Check-in MMI bagi setiap sesi di kelas', 'Hantar laporan kokurikulum bersama gambar'],
    },
    {
      key: 'staff', title: 'Staf sokongan', who: 'Anggota Kumpulan Pelaksana (AKP) dan staf lain',
      items: ['Check-in perhimpunan dengan kod harian', 'Rekod jawatan dan status kehadiran'],
    },
    {
      key: 'student', title: 'Pelajar', who: 'Tingkatan 1 hingga 5',
      items: ['Tidak perlu log masuk', 'Rekod pelajar, kehadiran di kelas dan penglibatan kokurikulum disimpan oleh guru'],
    },
  ],

  modulesTitle: 'Modul dalam sistem',
  modulesDesc: 'Disusun sama seperti menu di dalam sistem.',
  groupDaily: 'Rekod harian', groupSchool: 'Sekolah',
  usedBy: 'Digunakan oleh',
  roleTeacher: 'Guru', roleAdmin: 'Pentadbir', roleStaff: 'Semua staf',
  modules: [
    { key: 'erph', group: 'daily', title: 'e-RPH', desc: 'Rekod Pengajaran Harian, dengan senarai guru yang belum hantar untuk pentadbir.', roles: ['teacher', 'admin'] },
    { key: 'mmi', group: 'daily', title: 'Check-in Kelas (MMI)', desc: 'Subjek, kelas, masa dan bilangan pelajar hadir bagi setiap sesi.', roles: ['teacher', 'admin'] },
    { key: 'assembly', group: 'daily', title: 'Perhimpunan', desc: 'Check-in dengan kod harian, jawatan dan status kehadiran.', roles: ['staff', 'admin'] },
    { key: 'coco', group: 'school', title: 'Kokurikulum', desc: 'Badan beruniform, kelab, sukan dan rumah sukan: kehadiran dan laporan perjumpaan.', roles: ['teacher', 'admin'] },
    { key: 'timetable', group: 'school', title: 'Jadual Waktu', desc: 'Jadual ikut kelas dan ikut guru, dengan amaran pertindihan slot.', roles: ['teacher', 'admin'] },
    { key: 'curriculum', group: 'school', title: 'Unit Kurikulum', desc: 'Folder e-panitia setiap mata pelajaran, tersusun ikut jabatan.', roles: ['teacher', 'admin'] },
    { key: 'students', group: 'school', title: 'Maklumat Pelajar', desc: 'Rekod pelajar yang boleh dicari dan ditapis ikut kelas.', roles: ['admin'] },
  ],

  dayTitle: 'Hari persekolahan',
  dayDesc: 'Bagaimana sistem digunakan dari pagi hingga petang.',
  dayCaption: 'Penggunaan sistem sepanjang hari persekolahan',
  colWhen: 'Masa', colWhat: 'Urusan', colWho: 'Siapa',
  day: [
    { when: 'Pagi', what: 'Perhimpunan: pentadbir jana kod, warga sekolah check-in dengan jawatan dan status.', who: 'Semua staf' },
    { when: 'Waktu kelas', what: 'Check-in MMI bagi setiap sesi mengajar.', who: 'Guru' },
    { when: 'Selepas mengajar', what: 'Hantar e-RPH. Pentadbir terus nampak siapa yang belum.', who: 'Guru, Pentadbir' },
    { when: 'Petang', what: 'Kehadiran dan laporan kokurikulum bersama gambar aktiviti.', who: 'Guru penasihat' },
    { when: 'Bila-bila masa', what: 'Papan pemuka, jadual waktu dan eksport Excel atau PDF untuk mesyuarat.', who: 'Pentadbir' },
  ],

  helpTitle: 'Bantuan',
  helpDesc: 'Soalan yang biasa ditanya oleh warga sekolah.',
  helpMore: 'Sokongan & pemadaman data',
  privacy: 'Notis Privasi (PDPA)', terms: 'Terma Perkhidmatan',

  ctaTitle: 'Log masuk dengan akaun sekolah anda',
  ctaDesc: 'Belum ada akaun atau perlukan peranan pentadbir? Hubungi Unit ICT atau pentadbiran sekolah.',
  footerTagline: 'Sistem pengurusan operasi harian sekolah.',
  rights: 'Hak cipta terpelihara.',
}

const en = {
  portal: 'School management system portal',
  navPeople: 'School Community', navModules: 'Modules', navDay: 'School Day', navHelp: 'Help',
  login: 'Log In', menu: 'Menu', closeMenu: 'Close menu',
  themeLight: 'Switch to light mode', themeDark: 'Switch to dark mode',

  heroTitle: 'One system for the whole school community',
  heroLead: 'Administrators, teachers and staff at {school} record daily work in one place: e-RPH, class attendance, assembly, co-curriculum, timetable and student records.',
  heroLogin: 'Log In to the System',
  heroSeeModules: 'See the modules',
  heroNote: 'Use your official school email.',
  shotAlt: 'SchoolManage admin dashboard: today tiles, a 7-day e-RPH chart and the list of teachers yet to submit',
  shotCaption: 'Admin dashboard (screenshot with test data)',

  peopleTitle: 'The school community',
  peopleDesc: 'Each group sees and does different things in the system.',
  people: [
    {
      key: 'admin', title: 'Administrators', who: 'Principal, Senior Assistants and Senior Teachers',
      items: ['Track e-RPH submissions and class check-ins every day', 'Generate the assembly code and see who checked in', 'Manage student records by form and class'],
    },
    {
      key: 'teacher', title: 'Teachers', who: 'Subject teachers, class teachers and advisors',
      items: ['Submit e-RPH after teaching', 'Check in to MMI for every class session', 'File co-curriculum reports with photos'],
    },
    {
      key: 'staff', title: 'Support staff', who: 'AKP and other staff',
      items: ["Check in to assembly with the day's code", 'Record position and attendance status'],
    },
    {
      key: 'student', title: 'Students', who: 'Form 1 to Form 5',
      items: ['No login needed', 'Student records, class attendance and co-curriculum involvement are kept by teachers'],
    },
  ],

  modulesTitle: 'Modules in the system',
  modulesDesc: 'Grouped the same way as the menu inside the system.',
  groupDaily: 'Daily records', groupSchool: 'School',
  usedBy: 'Used by',
  roleTeacher: 'Teachers', roleAdmin: 'Admins', roleStaff: 'All staff',
  modules: [
    { key: 'erph', group: 'daily', title: 'e-RPH', desc: 'Daily lesson records, with a list of teachers yet to submit for admins.', roles: ['teacher', 'admin'] },
    { key: 'mmi', group: 'daily', title: 'Class Check-in (MMI)', desc: 'Subject, class, time and number of students present for each session.', roles: ['teacher', 'admin'] },
    { key: 'assembly', group: 'daily', title: 'Assembly', desc: 'Check in with the daily code, position and attendance status.', roles: ['staff', 'admin'] },
    { key: 'coco', group: 'school', title: 'Co-curriculum', desc: 'Uniformed bodies, clubs, sports and sports houses: attendance and meeting reports.', roles: ['teacher', 'admin'] },
    { key: 'timetable', group: 'school', title: 'Timetable', desc: 'By class and by teacher, with slot clash warnings.', roles: ['teacher', 'admin'] },
    { key: 'curriculum', group: 'school', title: 'Curriculum Unit', desc: "Each subject panel's e-folder, grouped by department.", roles: ['teacher', 'admin'] },
    { key: 'students', group: 'school', title: 'Student Records', desc: 'Student records you can search and filter by class.', roles: ['admin'] },
  ],

  dayTitle: 'The school day',
  dayDesc: 'How the system is used from morning to afternoon.',
  dayCaption: 'System use across the school day',
  colWhen: 'When', colWhat: 'Task', colWho: 'Who',
  day: [
    { when: 'Morning', what: 'Assembly: admins generate the code, the school community checks in with position and status.', who: 'All staff' },
    { when: 'Class time', what: 'MMI check-in for every teaching session.', who: 'Teachers' },
    { when: 'After teaching', what: "Submit e-RPH. Admins see straight away who hasn't.", who: 'Teachers, Admins' },
    { when: 'Afternoon', what: 'Co-curriculum attendance and reports with activity photos.', who: 'Advisor teachers' },
    { when: 'Any time', what: 'Dashboards, timetables and Excel or PDF exports for meetings.', who: 'Admins' },
  ],

  helpTitle: 'Help',
  helpDesc: 'Questions the school community often asks.',
  helpMore: 'Support & data deletion',
  privacy: 'Privacy Notice (PDPA)', terms: 'Terms of Service',

  ctaTitle: 'Log in with your school account',
  ctaDesc: 'No account yet, or need the admin role? Contact the ICT Unit or the school office.',
  footerTagline: "The school's daily operations system.",
  rights: 'All rights reserved.',
}

export function getLandingCopy(language, school) {
  const dict = language === 'en' ? en : ms
  const fill = (s) => s.replaceAll('{school}', school)
  return { ...dict, heroLead: fill(dict.heroLead) }
}
