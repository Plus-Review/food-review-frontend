import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

const Profil = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('ulasan'); 
    
    const [userInfo, setUserInfo] = useState({ nama: 'Memuat...', email: 'Memuat...', bergabung: '2026' });
    const [userReviews, setUserReviews] = useState([]);
    
    // 🌟 State Favorit MySQL
    const [userFavorites, setUserFavorites] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);

    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchProfilDanData = async () => {
            try {
                // 1. Data User dari Local Storage (dari saat login)
                setUserInfo({
                    nama: localStorage.getItem('userName') || 'Mahasiswa (Kamu)',
                    email: localStorage.getItem('userEmail') || 'user@mahasiswa.com',
                    bergabung: 'Baru saja'
                });

                // Decode token untuk mendapatkan ID guna mencocokkan ulasan
                const base64Url = token.split('.')[1];
                const decodedToken = JSON.parse(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
                const currentUserId = decodedToken.userId || decodedToken.id;

                // 2. Tarik Daftar Ulasan
                const umkmRes = await apiClient.get('/umkm');
                const semuaUmkm = umkmRes.data;
                let ulasanku = [];

                semuaUmkm.forEach(umkm => {
                    if (umkm.reviews && umkm.reviews.length > 0) {
                        const myReviewsInThisUmkm = umkm.reviews.filter(rev => rev.userId === currentUserId || rev.user_id === currentUserId);
                        myReviewsInThisUmkm.forEach(rev => {
                            ulasanku.push({
                                ...rev,
                                umkm_id: umkm.id,
                                nama_umkm: umkm.nama_umkm,
                                umkm_image: umkm.image
                            });
                        });
                    }
                });
                ulasanku.sort((a, b) => b.id - a.id);
                setUserReviews(ulasanku);

                // 3. 🌟 MENGAMBIL DATA FAVORIT DARI DATABASE MySQL
                try {
                    const favRes = await apiClient.get('/favorit/me');
                    
                    // Kita map datanya agar bentuknya sama dengan UMKMCard
                    const warungFavoritku = favRes.data.map(fav => {
                        // Sesuaikan "fav.umkmDetail" dengan alias 'as' yang kita buat di models/index.js
                        const detailWarung = fav.umkmDetail || fav.Umkm || fav; 
                        return {
                            id: detailWarung.id,
                            nama_umkm: detailWarung.nama_umkm,
                            image: detailWarung.image,
                            kategori: detailWarung.kategori || detailWarung.jenis_makanan || detailWarung.jenis
                        };
                    });

                    setUserFavorites(warungFavoritku);
                } catch (err) {
                    console.log("Gagal menarik data favorit dari database", err);
                }

                setIsLoading(false);

            } catch (error) {
                console.error("Gagal menarik data", error);
                setIsLoading(false);
            }
        };

        fetchProfilDanData();
    }, [isLoggedIn, navigate, token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setShowDropdown(false);
        navigate('/login');
    };

    return (
        <div style={s.page}>
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
                            {userInfo.nama.charAt(0).toUpperCase()}
                        </div>
                        {showDropdown && (
                            <div style={s.dropdown}>
                                <DropItem active onClick={() => setShowDropdown(false)}>Profil Saya</DropItem>
                                <DropItem danger onClick={handleLogout}>Logout</DropItem>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <header style={s.profileHeader}>
                <div style={s.container}>
                    <div style={s.profileInfoWrapper}>
                        <div style={s.bigAvatar}>
                            {userInfo.nama.charAt(0).toUpperCase()}
                        </div>
                        <div style={s.profileText}>
                            <h1 style={s.profileName}>{userInfo.nama}</h1>
                            <p style={s.profileEmail}>📧 {userInfo.email}</p>
                            <div style={s.profileBadge}>🎓 Ulasan Tersimpan: {userReviews.length}</div>
                        </div>
                    </div>
                </div>
            </header>

            <main style={s.container}>
                <div style={s.tabContainer}>
                    <button style={{ ...s.tabBtn, ...(activeTab === 'ulasan' ? s.tabActive : {}) }} onClick={() => setActiveTab('ulasan')}>
                        💬 Ulasan Saya ({userReviews.length})
                    </button>
                    <button style={{ ...s.tabBtn, ...(activeTab === 'favorit' ? s.tabActive : {}) }} onClick={() => setActiveTab('favorit')}>
                        ❤️ Warung Favorit ({userFavorites.length})
                    </button>
                </div>

                <div style={s.contentArea}>
                    {isLoading ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Mengambil data dari database...</p>
                    ) : activeTab === 'ulasan' ? (
                        userReviews.length > 0 ? (
                            <div style={s.reviewList}>
                                {userReviews.map((rev, index) => (
                                    <div key={index} style={s.reviewCard}>
                                        <div style={s.reviewUmkmInfo} onClick={() => navigate(`/umkm/${rev.umkm_id}`)}>
                                            <img 
                                                src={rev.umkm_image ? `${BASE_URL}/uploads/${rev.umkm_image}` : 'https://via.placeholder.com/50'} 
                                                style={s.reviewUmkmImg} alt="umkm" 
                                            />
                                            <div>
                                                <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{rev.nama_umkm}</h4>
                                                <div style={{ letterSpacing: '2px', fontSize: '12px' }}>
                                                    {"⭐".repeat(rev.rating || 0)}{"☆".repeat(5 - (rev.rating || 0))}
                                                </div>
                                            </div>
                                        </div>
                                        <p style={s.reviewText}>"{rev.komentar || rev.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={s.emptyState}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📝</div>
                                <h3>Belum ada ulasan</h3>
                                <button style={s.actionBtn} onClick={() => navigate('/')}>Mulai Review Warung</button>
                            </div>
                        )
                    ) : (
                        userFavorites.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                                {userFavorites.map(item => (
                                    <div key={item.id} style={{...s.reviewCard, cursor: 'pointer'}} onClick={() => navigate(`/umkm/${item.id}`)}>
                                        <img 
                                            src={item.image ? `${BASE_URL}/uploads/${item.image}` : 'https://via.placeholder.com/300x200'} 
                                            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} 
                                            alt={item.nama_umkm} 
                                        />
                                        <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>{item.nama_umkm}</h3>
                                        <p style={{ margin: 0, color: '#E24B4A', fontSize: '14px', fontWeight: 'bold' }}>
                                            {item.kategori || 'Kuliner'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={s.emptyState}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📌</div>
                                <h3>Belum ada warung favorit</h3>
                                <p>Simpan warung favoritmu di sini agar mudah dicari.</p>
                                <button style={s.actionBtn} onClick={() => navigate('/')}>Cari Warung Favorit</button>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

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

const s = {
    page: { backgroundColor: '#f8f9fa', minHeight: '100vh', color: '#111', fontFamily: "'Segoe UI', sans-serif" },
    navbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '68px', borderBottom: '0.5px solid #eee', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 },
    logo: { fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer' },
    navLinks: { display: 'flex', gap: '4px' },
    navRight: { position: 'relative' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#0f3460', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
    dropdown: { position: 'absolute', top: '46px', right: 0, backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: '14px', width: '168px', zIndex: 200, border: '0.5px solid #eee', overflow: 'hidden' },
    container: { maxWidth: '900px', margin: '0 auto', padding: '0 20px' },
    profileHeader: { backgroundColor: '#fff', borderBottom: '1px solid #eaeaea', padding: '50px 0', marginBottom: '30px', backgroundImage: 'linear-gradient(to right, #ffffff, #f0f4f8)' },
    profileInfoWrapper: { display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' },
    bigAvatar: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#0f3460', color: '#fff', fontSize: '40px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(15, 52, 96, 0.2)' },
    profileText: { flex: 1 },
    profileName: { fontSize: '28px', fontWeight: 700, margin: '0 0 8px', color: '#111' },
    profileEmail: { fontSize: '15px', color: '#666', margin: '0 0 12px' },
    profileBadge: { display: 'inline-block', backgroundColor: 'rgba(226,75,74,0.1)', color: '#E24B4A', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
    tabContainer: { display: 'flex', gap: '10px', borderBottom: '2px solid #eaeaea', marginBottom: '30px' },
    tabBtn: { padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', fontSize: '15px', fontWeight: 600, color: '#888', cursor: 'pointer', transition: '0.2s', fontFamily: 'inherit' },
    tabActive: { color: '#E24B4A', borderBottomColor: '#E24B4A' },
    contentArea: { paddingBottom: '80px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #ccc', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' },
    actionBtn: { marginTop: '20px', backgroundColor: '#0f3460', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    reviewList: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px' },
    reviewCard: { backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
    reviewUmkmInfo: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', cursor: 'pointer', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' },
    reviewUmkmImg: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' },
    reviewText: { fontSize: '15px', color: '#333', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }
};

export default Profil;