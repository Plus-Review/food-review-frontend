import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Link, Navigate, Routes, Route } from 'react-router-dom';
import BackToTopButton from './components/BackToTopButton';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UMKMDetail = lazy(() => import('./pages/UMKMDetail'));
const AddUMKM = lazy(() => import('./pages/AddUMKM'));
const Profile = lazy(() => import('./pages/Profile'));
const CategoryFeed = lazy(() => import('./pages/CategoryFeed'));
const PopularFeed = lazy(() => import('./pages/PopularFeed'));
const SavedUMKM = lazy(() => import('./pages/SavedUMKM'));
const MyUMKM = lazy(() => import('./pages/MyUMKM'));
const Activity = lazy(() => import('./pages/Activity'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const AppFallback = () => (
  <div className="app-route-loading" role="status" aria-live="polite">
    <span />
    <strong>Memuat Plus Review</strong>
  </div>
);

const NotFound = () => (
  <main className="app-not-found">
    <span>404</span>
    <h1>Halaman tidak ditemukan</h1>
    <p>Alamat yang kamu buka tidak tersedia atau sudah dipindahkan.</p>
    <Link to="/">Kembali ke Beranda</Link>
  </main>
);

function App() {
  const isCaptureMode = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('capture') === '1';

  return (
    <div className={isCaptureMode ? 'capture-mode' : undefined}>
      <Router>
        <Suspense fallback={<AppFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/umkm/:id" element={<UMKMDetail />} />
            <Route path="/tambah" element={<AddUMKM />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/kategori/:categoryKey" element={<CategoryFeed />} />
            <Route path="/populer" element={<PopularFeed />} />
            <Route path="/tersimpan" element={<SavedUMKM />} />
            <Route path="/umkm-saya" element={<MyUMKM />} />
            <Route path="/aktivitas" element={<Activity />} />
            <Route path="/notifikasi" element={<Notifications />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BackToTopButton />
        </Suspense>
      </Router>
    </div>
  );
}

export default App;
