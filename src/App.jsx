import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UMKMDetail from './pages/UMKMDetail';
import AddUMKM from './pages/AddUMKM';
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
        <Route path="*" element={<div style={{ textAlign: 'center', padding: '50px' }}><h1>404 - Halaman Tidak Ditemukan</h1><a href="/">Kembali ke Beranda</a></div>} />
      </Routes>
    </Router>
  );
}

export default App;