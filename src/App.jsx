import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { NotificationProvider } from './context/NotificationContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Home from './pages/Home'
import SubmitERPH from './pages/erph/SubmitERPH'
import ERPHDashboard from './pages/erph/ERPHDashboard'
import SubmitMMI from './pages/mmi/SubmitMMI'
import MMIDashboard from './pages/mmi/MMIDashboard'
import CheckIn from './pages/assembly/CheckIn'
import AssemblyAdmin from './pages/assembly/AssemblyAdmin'
import SubmitCocoUnitReport from './pages/coco/SubmitCocoUnitReport'
import CocoAttendance from './pages/coco/CocoAttendance'
import CocoDashboard from './pages/coco/CocoDashboard'
import { BADAN_BERUNIFORM_UNITS, KELAB_PERSATUAN_UNITS, SUKAN_PERMAINAN_UNITS, RUMAH_SUKAN_UNITS } from './lib/constants'
import Profile from './pages/Profile'
import Help from './pages/Help'
import Curriculum from './pages/curriculum/Curriculum'
import StudentList from './pages/students/StudentList'
import Timetable from './pages/timetable/Timetable'
import TimetableGuru from './pages/timetable/TimetableGuru'
import Notifications from './pages/Notifications'
import PDPA from './pages/PDPA'
import Terms from './pages/Terms'
import Support from './pages/Support'

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pdpa" element={<PDPA />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="erph" element={<SubmitERPH />} />
            <Route path="mmi" element={<SubmitMMI />} />
            <Route path="perhimpunan" element={<CheckIn />} />
            <Route path="kokurikulum/kehadiran" element={<CocoAttendance />} />
            <Route path="kokurikulum/badan-beruniform" element={<SubmitCocoUnitReport category="BADAN BERUNIFORM" categoryLabel="Badan Beruniform" units={BADAN_BERUNIFORM_UNITS} />} />
            <Route path="kokurikulum/kelab-persatuan" element={<SubmitCocoUnitReport category="KELAB & PERSATUAN" categoryLabel="Kelab & Persatuan" units={KELAB_PERSATUAN_UNITS} />} />
            <Route path="kokurikulum/sukan-permainan" element={<SubmitCocoUnitReport category="SUKAN & PERMAINAN" categoryLabel="Sukan & Permainan" units={SUKAN_PERMAINAN_UNITS} />} />
            <Route path="kokurikulum/rumah-sukan" element={<SubmitCocoUnitReport category="RUMAH SUKAN" categoryLabel="Rumah Sukan" units={RUMAH_SUKAN_UNITS} allowOtherUnit={false} />} />
            <Route path="kurikulum" element={<Curriculum />} />
            <Route path="jadual" element={<Timetable />} />
            <Route path="jadual/guru" element={<TimetableGuru />} />
            <Route path="profil" element={<Profile />} />
            <Route path="bantuan" element={<Help />} />
            <Route path="notifikasi" element={<Notifications />} />

            <Route
              path="pelajar"
              element={
                <ProtectedRoute adminOnly>
                  <StudentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="erph/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <ERPHDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="mmi/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <MMIDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="perhimpunan/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AssemblyAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="kokurikulum/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <CocoDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </NotificationProvider>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
