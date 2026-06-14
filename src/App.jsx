import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UMKMDetail from './pages/UMKMDetail';
import AddUMKM from './pages/AddUMKM';
import Profile from './pages/Profile';
import CategoryFeed from './pages/CategoryFeed';
import PopularFeed from './pages/PopularFeed';
import SavedUMKM from './pages/SavedUMKM';
import MyUMKM from './pages/MyUMKM';
import './App.css';

function App() {
  return (
    <Router>
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
        <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h1>404 - Halaman Tidak Ditemukan</h1><a href="/">Kembali ke Beranda</a></div>} />
      </Routes>
    </Router>
  );
}

export default App;
