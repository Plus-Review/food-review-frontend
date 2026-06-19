import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UMKMDetail = lazy(() => import('./pages/UMKMDetail'));
const AddUMKM = lazy(() => import('./pages/AddUMKM'));
const Profile = lazy(() => import('./pages/Profile'));
const CategoryFeed = lazy(() => import('./pages/CategoryFeed'));
const PopularFeed = lazy(() => import('./pages/PopularFeed'));
const SavedUMKM = lazy(() => import('./pages/SavedUMKM'));
const MyUMKM = lazy(() => import('./pages/MyUMKM'));
const Activity = lazy(() => import('./pages/Activity'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const AppFallback = () => (
  <div className="app-route-loading" role="status" aria-live="polite">
    <span />
    <strong>Memuat Plus Review</strong>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<AppFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/umkm/:id" element={<UMKMDetail />} />
          <Route path="/tambah" element={<AddUMKM />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/kategori/:categoryKey" element={<CategoryFeed />} />
          <Route path="/populer" element={<PopularFeed />} />
          <Route path="/tersimpan" element={<SavedUMKM />} />
          <Route path="/umkm-saya" element={<MyUMKM />} />
          <Route path="/aktivitas" element={<Activity />} />
          <Route path="/notifikasi" element={<Notifications />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h1>404 - Halaman Tidak Ditemukan</h1><a href="/">Kembali ke Beranda</a></div>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
