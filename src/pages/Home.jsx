import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

const Home = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [umkmList, setUmkmList] = useState([]);

    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        const fetchUMKM = async () => {
            try {
                const response = await apiClient.get('/umkm');
                setUmkmList(response.data);
            } catch (err) {
                console.error("Gagal mengambil data UMKM", err);
            }
        };
        fetchUMKM();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setShowDropdown(false);
        navigate('/login');
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: '#000', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* ── NAVBAR ── */}
            <nav style={styles.navbar}>
                <div style={styles.navLinks}>
                    <button onClick={() => navigate('/')} style={styles.activeNavLink}>BERANDA</button>
                    <button onClick={() => navigate('/feed')} style={styles.navLink}>FEED</button>
                    {isLoggedIn && (
                        <button onClick={() => navigate('/tambah')} style={styles.navLink}>TAMBAHKAN UMKM</button>
                    )}
                </div>

                <div style={styles.profileContainer}>
                    {isLoggedIn ? (
                        <>
                            <div style={styles.profileCircle} onClick={() => setShowDropdown(!showDropdown)}>
                                A
                            </div>
                            {showDropdown && (
                                <div style={styles.dropdownMenu}>
                                    <div style={styles.dropdownItem} onClick={() => navigate('/profil')}>Profil Saya</div>
                                    <div style={styles.dropdownItem} onClick={() => navigate('/favorit')}>Favorit</div>
                                    <div style={{ ...styles.dropdownItem, color: 'red' }} onClick={handleLogout}>Logout</div>
                                </div>
                            )}
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} style={styles.loginBtn}>LOGIN</button>
                    )}
                </div>
            </nav>

            {/* ── HERO ── */}
            <div style={styles.hero}>
                <div style={styles.searchWrapper}>
                    <input
                        type="text"
                        placeholder="TEMUKAN WARUNG"
                        style={styles.searchInput}
                    />

                </div>
                <h1 style={styles.heroTitle}>SELAMAT DATANG</h1>
            </div>

            {/* ── KONTEN ── */}
            <div style={styles.container}>

                {/* TERPOPULER */}
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>TERPOPULER</h2>
                    <div style={styles.arrowBtn}>→</div>
                </div>
                <div style={styles.grid}>
                    {umkmList.length > 0 ? (
                        umkmList.map(item => (
                            <UMKMCard key={item.id} item={item} navigate={navigate} />
                        ))
                    ) : (
                        <p style={{ color: '#999', gridColumn: '1/-1' }}>Belum ada UMKM yang ditambahkan.</p>
                    )}
                </div>

                {/* REVIEW TERBARU */}
                <div style={{ ...styles.sectionHeader, marginTop: '56px' }}>
                    <h2 style={styles.sectionTitle}>REVIEW TERBARU</h2>
                    <div style={styles.arrowBtn}>→</div>
                </div>
                <div style={styles.grid}>
                    {[...umkmList].reverse().map(item => (
                        <UMKMCard key={item.id + '-rev'} item={item} navigate={navigate} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const UMKMCard = ({ item, navigate }) => {
    const imagePath = item.image
        ? `${BASE_URL}/uploads/${item.image}`
        : "https://via.placeholder.com/300x200?text=No+Image";
    const reviews = item.reviews || [];
    const totalReviews = reviews.length;
    const calculatedAvgRating = totalReviews > 0 
        ? (reviews.reduce((sum, rev) => sum + (rev.rating || 0), 0) / totalReviews).toFixed(1)
        : '0.0';

    return (
        <div
            style={styles.card}
            onClick={() => navigate(`/umkm/${item.id}`)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={styles.cardImgWrap}>
                <img src={imagePath} alt={item.nama_umkm} style={styles.cardImg} />
            </div>
            <h3 style={styles.cardTitle}>{item.nama_umkm}</h3>
            <p style={styles.cardPrice}>{item.harga_range || 'Harga belum tersedia'}</p>
            
            {/* Menampilkan hasil perhitungan dinamis */}
            <p style={styles.cardRating}>
                <span style={{ color: '#f5a623', marginRight: '4px' }}>★</span> 
                {calculatedAvgRating} 
                <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px', fontWeight: 'normal' }}>
                    ({totalReviews})
                </span>
            </p>
        </div>
    );
};

const styles = {
    /* ── NAVBAR ── */
    navbar: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 50px',
        height: '64px',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        backgroundColor: '#fff',
        zIndex: 100,
    },
    navLinks: { display: 'flex', gap: '48px' },
    navLink: {
        background: 'none', border: 'none',
        color: '#888', fontSize: '13px', fontWeight: '600',
        cursor: 'pointer', letterSpacing: '0.5px',
        padding: '0', paddingBottom: '4px',
        borderBottom: '2px solid transparent',
    },
    activeNavLink: {
        background: 'none', border: 'none',
        color: '#111', fontSize: '13px', fontWeight: '700',
        cursor: 'pointer', letterSpacing: '0.5px',
        padding: '0', paddingBottom: '4px',
        borderBottom: '2px solid #111',
    },
    profileContainer: { position: 'absolute', right: '50px' },
    profileCircle: {
        backgroundColor: '#d0d0d0', color: '#555',
        width: '36px', height: '36px', borderRadius: '50%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontWeight: '700', fontSize: '14px', cursor: 'pointer',
    },
    dropdownMenu: {
        position: 'absolute', top: '44px', right: 0,
        backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        borderRadius: '12px', width: '160px', zIndex: 200,
        border: '1px solid #f0f0f0', overflow: 'hidden',
    },
    dropdownItem: {
        padding: '12px 16px', fontSize: '13px',
        cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
    },
    loginBtn: {
        backgroundColor: '#000', color: '#fff',
        padding: '8px 22px', borderRadius: '20px',
        border: 'none', fontWeight: '700',
        cursor: 'pointer', fontSize: '12px', letterSpacing: '1px',
    },

    /* ── HERO ── */
    hero: {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000")',
        height: '360px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
    },
    searchWrapper: {
        position: 'relative',
        width: '90%',
        maxWidth: '480px',
    },
    searchInput: {
        width: '100%',
        padding: '16px 52px 16px 28px',
        borderRadius: '40px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        outline: 'none',
        boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
        color: '#333',
    },
    searchIconBtn: {
        position: 'absolute',
        right: '22px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '16px',
        color: '#aaa',
        pointerEvents: 'none',
    },
    heroTitle: {
        color: '#fff',
        fontSize: '48px',
        fontWeight: '900',
        letterSpacing: '3px',
        margin: 0,
        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
    },

    /* ── KONTEN ── */
    container: { maxWidth: '1100px', margin: '0 auto', padding: '48px 20px 60px' },

    sectionHeader: {
        display: 'flex', alignItems: 'center',
        gap: '14px', marginBottom: '28px',
    },
    sectionTitle: {
        fontSize: '22px', fontWeight: '800',
        letterSpacing: '0.5px', margin: 0,
    },
    arrowBtn: {
        backgroundColor: '#f0f0f0',
        borderRadius: '50%',
        width: '36px', height: '36px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer', fontSize: '16px', fontWeight: '700',
        flexShrink: 0,
    },

    /* ── GRID CARD ── */
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '28px',
    },
    card: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    },
    cardImgWrap: {
        width: '100%',
        height: '180px',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '12px',
    },
    cardImg: {
        width: '100%', height: '100%',
        objectFit: 'cover', display: 'block',
    },
    cardTitle: {
        fontSize: '16px', fontWeight: '700',
        margin: '0 0 4px', color: '#111',
    },
    cardPrice: {
        fontSize: '13px', color: '#666',
        margin: '0 0 4px',
    },
    cardRating: {
        fontSize: '13px', fontWeight: '600',
        color: '#111', margin: 0,
    },
};

export default Home;