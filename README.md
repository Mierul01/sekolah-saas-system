# One-Stop System (SaaS)

A single web app replacing the school's scattered Google Forms / Looker Studio / Drive-folder
"link-in-bio" setup with one login-based system. Built with **React + Vite** on the frontend and
**Firebase** (Auth + Firestore) as the backend, so it deploys as plain static files to any cPanel
hosting plan (e.g. Shinjiru) — no Node.js server required on the host.

## Routing structure

- `/` — public marketing landing page (no login needed)
- `/login` — sign-in
- `/app` — the logged-in system (dashboard + all modules), protected by auth

## Local test mode (no Firebase needed)

With no `.env` file present, the app automatically runs in **local test mode**: sign-in is a
simple name + role picker (no Google account needed), and all data is stored in your browser's
`localStorage` instead of Firestore. This lets you click through every module end-to-end —
submit e-RPH, log an MMI check-in, generate an assembly code and check in — with zero setup.

- Sign in as different names to simulate different teachers (each name gets its own local
  account); pick "Pentadbir" as the role to see the admin dashboards.
- Data persists across page reloads (it's in `localStorage`) but is **per-browser** — it won't
  sync between devices, and clearing browser data wipes it.
- A "Mod Ujian Tempatan" badge shows in the header whenever this mode is active.
- Once you fill in `.env` with real Firebase config (see below), the app switches to real
  Google Sign-In and Firestore automatically — nothing in the code needs to change.

## What's included (MVP)

- **Google Sign-In**, restricted to your school's email domain
- **e-RPH** — daily lesson-plan submission (teacher form) + admin dashboard (who has/hasn't
  submitted today, 7-day trend chart)
- **MMI classroom check-in** — teachers log each teaching session (subject, form/class, time,
  student attendance) + admin dashboard (sessions by subject, average attendance)
- **SiKAP assembly check-in** — admin generates a daily code, teachers check in with their
  position and attendance status, admin sees a live list + breakdown
- **Co-curriculum reporting** — weekly report per club/society, uniformed body, sports team, or
  sports house, with an admin dashboard broken down by category
- **Unit Kurikulum** — subject/department reference hub; admins can attach a Google Drive folder
  link to each subject inline, everyone else sees "Buka Folder" once it's set
- **Maklumat Pelajar** — admin-only student records (add / edit / delete / search / filter by
  form & class)

## Not yet built (from the original link-in-bio)

Two remain from the school's MyLink page, both bigger builds than the rest: the **Tahfiz/Quran-
memorization tracking portal (TMUATB)** — individual hafazan records, halaqah groupings, khatam
certification, monthly performance — and **Jadual Waktu (timetable)**, which was just a Drive
folder of files originally and would need a real timetable data model + viewer. The data model
(Firestore + role-based rules) is set up so these can be added as new collections + pages without
restructuring anything already built.

## 1. Create your Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Once created, go to **Build → Authentication → Sign-in method** → enable **Google**.
3. Go to **Build → Firestore Database** → **Create database** → start in **production mode**.
4. Go to **Project settings → General → Your apps** → click the **Web** icon (`</>`) to register
   a web app → copy the `firebaseConfig` values shown.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in the Firebase values you just copied, plus:

- `VITE_ALLOWED_EMAIL_DOMAIN` — only Google accounts ending in `@yourdomain` can sign in
  (e.g. `smkatb.edu.my`). Leave blank to allow any Google account (not recommended).
- `VITE_SCHOOL_NAME` — shown on the login screen and sidebar.

## 3. Set the Firestore security rules

Open **Firestore Database → Rules** in the Firebase Console, paste in the contents of
[`firestore.rules`](firestore.rules) from this project, and click **Publish**. (No Firebase CLI
needed.)

## 4. Run it locally

```bash
npm install
npm run dev
```

## 5. Make yourself an admin

Everyone who signs in for the first time is created with role `guru` (teacher) — this is
enforced by the security rules so nobody can grant themselves admin from the app itself.

To promote someone to admin: sign in with that account once, then in the Firebase Console go to
**Firestore Database → Data → `users` collection**, find their document (matches their email),
and change the `role` field from `guru` to `admin`.

## 6. Deploy to cPanel (Shinjiru or similar)

```bash
npm run build
```

This produces a `dist/` folder of static files (including the `.htaccess` needed for the app's
routing to work on Apache). Upload the **contents** of `dist/` (not the folder itself) into
`public_html` (or a subfolder if you want it at `yourschool.com/system`) via cPanel's File
Manager or FTP. That's it — no Node.js, no database server, and no build step needed on the
host itself, since Firebase handles auth/data/storage remotely.

## Notes

- **Composite indexes**: a couple of queries (e.g. "my e-RPH history", filtered by teacher +
  sorted by date) need a Firestore composite index. The first time you use a feature that needs
  one, Firestore will throw an error in the browser console containing a direct link — click it,
  click **Create Index** on the Firebase Console page it opens, wait ~1 minute, then retry. This
  only has to be done once per query shape, not per user.
- **Bundle size**: the production build is ~1.1MB (mostly the Firebase SDK) — fine for an internal
  staff tool on any connection, not worth optimizing for this MVP.

## Tech stack

- React 19 + Vite
- React Router v7
- Firebase (Auth + Firestore)
- Recharts (dashboard charts)

## Project structure

```
src/
  lib/          firebase.js (SDK init), constants.js (subjects/classes/time slots)
  context/      AuthContext.jsx (sign-in, role, session)
  components/   Layout.jsx (sidebar/topbar shell), ProtectedRoute.jsx
  pages/
    Login.jsx, Home.jsx
    erph/       SubmitERPH.jsx, ERPHDashboard.jsx
    mmi/        SubmitMMI.jsx, MMIDashboard.jsx
    assembly/   CheckIn.jsx, AssemblyAdmin.jsx
firestore.rules
```
