import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

const Favorit = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [userFavorites, setUserFavorites] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);

    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        // Jika belum login, langsung tendang ke halaman login
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchFavorites = async () => {
            try {
                // Tembak API MySQL yang sudah kita buat sebelumnya
                const res = await apiClient.get('/favorit/me');
                
                // Rapikan datanya agar formatnya cocok dengan UMKMCard
                const warungFavoritku = res.data.map(fav => {
                    // Tergantung nama alias relasi di backend-mu (umkmDetail / Umkm)
                    const detailWarung = fav.umkmDetail || fav.Umkm || fav; 
                    return {
                        ...detailWarung, // Ambil semua properti warung
                        id: detailWarung.id,
                        nama_umkm: detailWarung.nama_umkm,
                        image: detailWarung.image,
                        kategori: detailWarung.kategori || detailWarung.jenis_makanan || detailWarung.jenis || 'Umum',
                        harga_range: detailWarung.harga_range || 'Harga belum tersedia'
                    };
                });

                setUserFavorites(warungFavoritku);
            } catch (err) {
                console.error("Gagal menarik data favorit", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [isLoggedIn, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setShowDropdown(false);
        navigate('/login');
    };

    return (
        <div style={s.page}>
            {/* ── NAVBAR ── */}
            <nav style={s.navbar}>
                <div style={s.logo} onClick={() => navigate('/')}>
                    Plus<span style={{ color: '#E24B4A' }}>Review</span>
                </div>
                <div style={s.navLinks}>
                    <NavBtn onClick={() => navigate('/')}>Beranda</NavBtn>
                    <NavBtn onClick={() => navigate('/feed')}>Feed</NavBtn>
                    <NavBtn onClick={() => navigate('/tambah')}>Tambah UMKM</NavBtn>
                </div>
                <div style={s.navRight}>
                    <div style={{ position: 'relative' }}>
                        <div style={s.avatar} onClick={() => setShowDropdown(v => !v)}>
                            {(localStorage.getItem('userName') || 'A').charAt(0).toUpperCase()}
                        </div>
                        {showDropdown && (
                            <div style={s.dropdown}>
                                <DropItem onClick={() => navigate('/profil')}>Profil Saya</DropItem>
                                <DropItem active onClick={() => setShowDropdown(false)}>Favorit</DropItem>
                                <DropItem danger onClick={handleLogout}>Logout</DropItem>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HEADER FAVORIT ── */}
            <div style={s.headerContainer}>
                <div style={s.innerHeader}>
                    <div>
                        <h1 style={s.pageTitle}>Koleksi Favorit ❤️</h1>
                        <p style={s.pageSub}>Semua warung makan andalan yang sudah kamu simpan ada di sini.</p>
                    </div>
                </div>
            </div>

            {/* ── KONTEN GRID CARD UMKM ── */}
            <main style={s.mainContent}>
                {isLoading ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Memuat koleksimu...</p>
                ) : userFavorites.length > 0 ? (
                    <div style={s.grid}>
                        {userFavorites.map(item => (
                            <UMKMCard key={item.id} item={item} navigate={navigate} />
                        ))}
                    </div>
                ) : (
                    <div style={s.emptyState}>
                        <div style={{ fontSize: '60px', marginBottom: '15px' }}>📌</div>
                        <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Belum ada warung favorit</h2>
                        <p style={{ color: '#666', marginBottom: '25px' }}>
                            Kamu belum menyimpan warung apa pun. Eksplor beranda dan temukan warung favorit barumu!
                        </p>
                        <button style={s.actionBtnPrimary} onClick={() => navigate('/')}>
                            Eksplor Warung Sekarang
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

/* ─────────────────────────────────────────────
   KOMPONEN KECIL
───────────────────────────────────────────── */
const NavBtn = ({ children, onClick, active }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '8px 14px', borderRadius: '20px', color: active ? '#111' : '#888', backgroundColor: active ? '#f4f4f4' : 'transparent', transition: 'all 0.15s', fontFamily: 'inherit' }}>
        {children}
    </button>
);

const DropItem = ({ children, onClick, danger, active }) => (
    <div onClick={onClick} style={{ padding: '11px 16px', fontSize: '13px', cursor: 'pointer', color: danger ? '#E24B4A' : (active ? '#0f3460' : '#333'), fontWeight: active ? 'bold' : 'normal', borderBottom: '0.5px solid #f0f0f0', backgroundColor: active ? '#f9f9f9' : 'transparent' }}>
        {children}
    </div>
);

/* ─────────────────────────────────────────────
   CARD UMKM
───────────────────────────────────────────── */
const UMKMCard = ({ item, navigate }) => {
    const [hovered, setHovered] = useState(false);
    const imagePath = item.image ? `${BASE_URL}/uploads/${item.image}` : null;
    
    // Fallback jika tidak ada data reviews dari relasi
    const avgRating = item.rating ? item.rating : "Baru";

    return (
        <div
            style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
            onClick={() => navigate(`/umkm/${item.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={s.cardImgWrap}>
                {imagePath ? (
                    <img src={imagePath} alt={item.nama_umkm} style={s.cardImg} />
                ) : (
                    <div style={s.cardImgPlaceholder}>🍽️</div>
                )}
                {/* Badge khusus untuk halaman favorit */}
                <div style={s.cardFavoritBadge}>❤️ Tersimpan</div>
            </div>

            <div style={s.cardBody}>
                <h3 style={s.cardTitle}>{item.nama_umkm}</h3>
                <p style={s.cardMeta}>{item.kategori}</p>
                <p style={s.cardPrice}>{item.harga_range}</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = {
    page: { backgroundColor: '#f8f9fa', minHeight: '100vh', color: '#111', fontFamily: "'Segoe UI', sans-serif" },
    navbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '68px', borderBottom: '0.5px solid #eee', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 },
    logo: { fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer' },
    navLinks: { display: 'flex', gap: '4px' },
    navRight: { position: 'relative' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#0f3460', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
    dropdown: { position: 'absolute', top: '46px', right: 0, backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: '14px', width: '168px', zIndex: 200, border: '0.5px solid #eee', overflow: 'hidden' },
    
    headerContainer: { backgroundColor: '#fff', borderBottom: '1px solid #eaeaea', padding: '40px 0' },
    innerHeader: { maxWidth: '1100px', margin: '0 auto', padding: '0 32px' },
    pageTitle: { fontSize: '28px', fontWeight: 700, margin: '0 0 8px' },
    pageSub: { fontSize: '15px', color: '#666', margin: 0 },

    mainContent: { maxWidth: '1100px', margin: '0 auto', padding: '40px 32px 80px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' },
    
    emptyState: { textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #ccc', maxWidth: '500px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
    actionBtnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#E24B4A', color: '#fff', border: 'none', borderRadius: 22, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

    card: { borderRadius: '14px', overflow: 'hidden', border: '0.5px solid #eee', background: '#fff', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease' },
    cardHover: { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.09)' },
    cardImgWrap: { position: 'relative', width: '100%', height: '180px', overflow: 'hidden' },
    cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    cardImgPlaceholder: { width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' },
    cardFavoritBadge: { position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', color: '#E24B4A', fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    cardBody: { padding: '16px' },
    cardTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 6px', color: '#111', lineHeight: 1.3 },
    cardMeta: { fontSize: '13px', color: '#666', margin: '0 0 8px' },
    cardPrice: { fontSize: '14px', fontWeight: 600, color: '#111', margin: 0 },
};

export default Favorit;