import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import apiClient from '../api/apiClient';
import 'leaflet/dist/leaflet.css';

const BASE_URL = "http://localhost:5000";

const UMKMDetail = () => {
    const { id } = useParams(); // Ambil ID dari URL
    const navigate = useNavigate();
    const [umkm, setUmkm] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await apiClient.get(`/umkm/${id}`);
                setUmkm(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Gagal ambil detail:", err);
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Memuat data...</div>;
    if (!umkm) return <div style={{ textAlign: 'center', padding: '50px' }}>UMKM tidak ditemukan.</div>;

    return (
        <div style={ui.page}>
            {/* NAVBAR */}
            <nav style={ui.navbar}>
                <div style={ui.navLinks}>
                    <button onClick={() => navigate('/')} style={ui.navBtn}>BERANDA</button>
                    <button style={ui.activeBtn}>FEED</button>
                    <button onClick={() => navigate('/tambah')} style={ui.navBtn}>TAMBAHKAN UMKM</button>
                </div>
            </nav>

            <div style={ui.container}>
                <h1 style={ui.mainTitle}>{umkm.nama_umkm}</h1>

                {/* GALERI FOTO (Sesuai feed lanjutan.jpg) */}
                <div style={ui.galleryGrid}>
                    <div style={{ ...ui.photoLarge, backgroundImage: `url(${BASE_URL}/uploads/${umkm.image})` }}></div>
                    <div style={ui.photoThumbGrid}>
                        {/* Contoh Thumbnail (Bisa dikembangkan nanti) */}
                        <div style={{ ...ui.photoSmall, backgroundImage: `url(${BASE_URL}/uploads/${umkm.image})`, opacity: 0.6 }}></div>
                        <div style={{ ...ui.photoSmall, backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+ 0</div>
                    </div>
                </div>

                <div style={ui.mainContent}>
                    {/* SISI KIRI: INFORMASI */}
                    <div style={{ flex: 1 }}>
                        <h3 style={ui.sectionLabel}>INFORMASI UMKM</h3>
                        <div style={ui.infoCard}>
                            <p><strong>HARGA :</strong> {umkm.harga_range}</p>
                            <p><strong>RATING :</strong> ★ {umkm.avg_rating || '0.0'}</p>
                            <p><strong>JENIS :</strong> {umkm.jenis_makanan}</p>
                            <p style={{marginTop: '10px'}}><strong>DESKRIPSI:</strong><br/>{umkm.deskripsi}</p>
                            <span style={ui.bookmarkIcon}>🔖</span>
                        </div>

                        <h3 style={{ ...ui.sectionLabel, marginTop: '30px' }}>REVIEW PELANGGAN →</h3>
                        <div style={ui.reviewBox}>
                            <p style={{ color: '#999', fontSize: '14px' }}>Belum ada review untuk tempat ini.</p>
                        </div>
                    </div>

                    {/* SISI KANAN: LOKASI */}
                    <div style={{ width: '400px' }}>
                        <h3 style={ui.sectionLabel}>LOKASI UMKM</h3>
                        <div style={ui.mapBox}>
                            {/* Menampilkan Lokasi Berdasarkan Koordinat di Database */}
                            <MapContainer center={[umkm.latitude, umkm.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[umkm.latitude, umkm.longitude]} />
                            </MapContainer>
                        </div>
                        <p style={ui.addressText}>{umkm.alamat_teks}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ui = {
    page: { backgroundColor: '#fff', minHeight: '100vh', color: '#000' },
    navbar: { display: 'flex', justifyContent: 'center', padding: '20px', borderBottom: '1px solid #eee' },
    navLinks: { display: 'flex', gap: '40px' },
    navBtn: { background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', color: '#666' },
    activeBtn: { background: 'none', border: 'none', fontWeight: '700', borderBottom: '2px solid #000', cursor: 'pointer' },
    container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px' },
    mainTitle: { fontSize: '36px', fontWeight: '900', marginBottom: '20px' },
    galleryGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '40px' },
    photoLarge: { height: '400px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '15px' },
    photoThumbGrid: { display: 'grid', gridTemplateRows: '1fr 1fr', gap: '15px' },
    photoSmall: { height: '192px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '15px' },
    mainContent: { display: 'flex', gap: '50px' },
    sectionLabel: { fontSize: '20px', fontWeight: '800', marginBottom: '15px' },
    infoCard: { padding: '25px', border: '1px solid #eee', borderRadius: '15px', position: 'relative', lineHeight: '2' },
    bookmarkIcon: { position: 'absolute', right: '25px', top: '25px', fontSize: '24px' },
    reviewBox: { padding: '20px', border: '1px solid #eee', borderRadius: '15px', textAlign: 'center' },
    mapBox: { height: '300px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #eee' },
    addressText: { marginTop: '15px', fontSize: '14px', color: '#555', lineHeight: '1.5' }
};

export default UMKMDetail;