import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Feed = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [umkmList,     setUmkmList]     = useState([]);
    const [isLoading,    setIsLoading]    = useState(true);
    const [sortBy,       setSortBy]       = useState('terbaru_ditambahkan');

    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        const fetchUMKM = async () => {
            try {
                const response = await apiClient.get('/umkm');
                const enrichedData = response.data.map(umkm => {
                    const reviews = umkm.reviews || [];
                    const avgRating = reviews.length > 0
                        ? reviews.reduce((sum, rev) => sum + (rev.rating || 0), 0) / reviews.length
                        : 0;
                    const latestReviewId = reviews.length > 0
                        ? Math.max(...reviews.map(r => r.id || 0))
                        : 0;
                    return { ...umkm, calculatedAvgRating: avgRating, latestReviewId };
                });
                setUmkmList(enrichedData);
            } catch (err) {
                console.error('Gagal mengambil data UMKM', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUMKM();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setShowDropdown(false);
        navigate('/login');
    };

    /* Sortir */
    const sortedList = [...umkmList].sort((a, b) => {
        if (sortBy === 'bintang_tertinggi') return b.calculatedAvgRating - a.calculatedAvgRating;
        if (sortBy === 'review_terbaru')    return b.latestReviewId - a.latestReviewId;
        return b.id - a.id; // terbaru_ditambahkan (default)
    });

    /* Statistik ringkas */
    const totalUlasan = umkmList.reduce((s, u) => s + (u.reviews?.length || 0), 0);
    const rataRating  = umkmList.length > 0
        ? (umkmList.reduce((s, u) => s + (u.calculatedAvgRating || 0), 0) / umkmList.length).toFixed(1)
        : '0.0';

    /* 3 UMKM terbaru untuk badge "Baru" */
    const idTerbaru = [...umkmList].sort((a, b) => b.id - a.id).slice(0, 3).map(u => u.id);

    const SORT_OPTIONS = [
        { value: 'terbaru_ditambahkan', icon: '🕐', label: 'Terbaru' },
        { value: 'bintang_tertinggi',   icon: '⭐', label: 'Bintang tertinggi' },
        { value: 'review_terbaru',      icon: '💬', label: 'Review terbaru' },
    ];

    return (
        <div style={s.page}>

            {/* ── NAVBAR ── */}
            <nav style={s.navbar}>
                <div style={s.logo} onClick={() => navigate('/')}>
                    Plus<span style={{ color: '#E24B4A' }}>Review</span>
                </div>
                <div style={s.navLinks}>
                    <NavBtn onClick={() => navigate('/')}>Beranda</NavBtn>
                    <NavBtn active onClick={() => navigate('/feed')}>Feed</NavBtn>
                    {isLoggedIn && (
                        <NavBtn onClick={() => navigate('/tambah')}>Tambah UMKM</NavBtn>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    {isLoggedIn ? (
                        <>
                            {/* 🌟 GANTI DENGAN KODE BARU INI: */}
<div 
    style={s.avatar} 
    onClick={() => setShowDropdown(v => !v)}
>
    {(localStorage.getItem('userName') || 'M').charAt(0).toUpperCase()}
</div>
                            {showDropdown && (
                                <div style={s.dropdown}>
                                    <DropItem onClick={() => navigate('/profil')}>Profil Saya</DropItem>
                                    <DropItem onClick={() => navigate('/favorit')}>Favorit</DropItem>
                                    <DropItem danger onClick={handleLogout}>Logout</DropItem>
                                </div>
                            )}
                        </>
                    ) : (
                        <button style={s.loginBtn} onClick={() => navigate('/login')}>Login</button>
                    )}
                </div>
            </nav>

            {/* ── BANNER HEADER ── */}
            <div style={s.banner}>
                <div style={s.bannerInner}>
                    <div>
                        <h1 style={s.pageTitle}>Eksplorasi UMKM</h1>
                        <p style={s.pageSub}>
                            Temukan dan urutkan semua warung makan yang terdaftar di platform.
                        </p>
                    </div>

                    {/* Statistik ringkas */}
                    {!isLoading && (
                        <div style={s.statsRow}>
                            <StatBox num={umkmList.length} label="Warung terdaftar" />
                            <div style={s.statDivider} />
                            <StatBox num={totalUlasan}    label="Total ulasan" />
                            <div style={s.statDivider} />
                            <StatBox num={rataRating}     label="Rata-rata rating" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── KONTROL SORT ── */}
            <div style={s.controls}>
                <p style={s.countText}>
                    Menampilkan{' '}
                    <span style={{ fontWeight: 600, color: '#111' }}>
                        {sortedList.length} warung
                    </span>
                </p>
                <div style={s.sortGroup}>
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            style={{
                                ...s.sortPill,
                                ...(sortBy === opt.value ? s.sortPillActive : {}),
                            }}
                            onClick={() => setSortBy(opt.value)}
                        >
                            <span>{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KONTEN ── */}
            <main style={s.main}>
                {isLoading ? (
                    <div style={s.loading}>
                        <p>Memuat daftar warung...</p>
                        <div style={s.loadingDots}>
                            <span style={{ ...s.dot, animationDelay: '0s' }} />
                            <span style={{ ...s.dot, animationDelay: '0.15s' }} />
                            <span style={{ ...s.dot, animationDelay: '0.3s' }} />
                        </div>
                    </div>
                ) : sortedList.length > 0 ? (
                    <div style={s.grid}>
                        {sortedList.map(item => (
                            <UMKMCard
                                key={item.id}
                                item={item}
                                navigate={navigate}
                                isBaru={idTerbaru.includes(item.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={s.empty}>
                        <p style={{ fontSize: 48, marginBottom: 16 }}>🍽️</p>
                        <p style={s.emptyTitle}>Belum ada warung yang terdaftar</p>
                        <p style={s.emptySub}>Jadilah yang pertama menambahkan UMKM!</p>
                        <button style={s.emptyBtn} onClick={() => navigate('/tambah')}>
                            Tambahkan sekarang
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
    <button
        onClick={onClick}
        style={{
            background: 'none', border: 'none', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', padding: '8px 14px', borderRadius: '20px',
            color: active ? '#111' : '#888',
            backgroundColor: active ? '#f4f4f4' : 'transparent',
            transition: 'all 0.15s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f4f4f4'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
        {children}
    </button>
);

const DropItem = ({ children, onClick, danger }) => (
    <div
        style={{
            padding: '11px 16px', fontSize: '13px', cursor: 'pointer',
            color: danger ? '#E24B4A' : '#333', borderBottom: '0.5px solid #f0f0f0',
        }}
        onClick={onClick}
        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
        {children}
    </div>
);

const StatBox = ({ num, label }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>{num}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
);

/* ─────────────────────────────────────────────
   CARD UMKM
───────────────────────────────────────────── */
const UMKMCard = ({ item, navigate, isBaru }) => {
    const [hovered, setHovered] = useState(false);
    const imagePath = item.image ? `${BASE_URL}/uploads/${item.image}` : null;
    const reviews   = item.reviews || [];
    const total     = reviews.length;
    const avgRating = item.calculatedAvgRating
        ? item.calculatedAvgRating.toFixed(1)
        : (total > 0
            ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
            : '0.0');
    const kategori  = item.kategori || item.jenis || 'Umum';

    const emojiMap = {
        'Minuman':       '🧋',
        'Mie':           '🍜',
        'Snack':         '🍿',
        'Cepat Saji':    '🍔',
        'Makanan Berat': '🍛',
    };

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
                    <div style={s.cardImgPlaceholder}>
                        {emojiMap[kategori] || '🍽️'}
                    </div>
                )}
                <div style={s.ratingBadge}>⭐ {avgRating}</div>
                {isBaru && <div style={s.newBadge}>Baru</div>}
            </div>
            <div style={s.cardBody}>
                <p style={s.cardTitle}>{item.nama_umkm}</p>
                <p style={s.cardMeta}>
                    {kategori}&nbsp;·&nbsp;
                    <span style={{ color: '#aaa' }}>{total} ulasan</span>
                </p>
                <p style={s.cardPrice}>{item.harga_range || 'Harga belum tersedia'}</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = {
    page: {
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        color: '#111',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    },

    /* Navbar */
    navbar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 68,
        borderBottom: '0.5px solid #eee', backgroundColor: '#fff',
        position: 'sticky', top: 0, zIndex: 100,
    },
    logo: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer' },
    navLinks: { display: 'flex', gap: 4 },
    avatar: {
        width: 38, height: 38, borderRadius: '50%',
        background: '#f0f0f0', border: '0.5px solid #ddd',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14, cursor: 'pointer',
    },
    dropdown: {
        position: 'absolute', top: 46, right: 0,
        backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        borderRadius: 14, width: 168, zIndex: 200,
        border: '0.5px solid #eee', overflow: 'hidden',
    },
    loginBtn: {
        backgroundColor: '#E24B4A', color: '#fff', padding: '9px 22px',
        borderRadius: 22, border: 'none', fontWeight: 600,
        cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
    },

    /* Banner */
    banner: {
        backgroundColor: '#fff',
        borderBottom: '0.5px solid #eee',
        padding: '32px 0',
    },
    bannerInner: {
        maxWidth: 1100, margin: '0 auto', padding: '0 32px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 20,
    },
    pageTitle: { fontSize: 26, fontWeight: 700, marginBottom: 6 },
    pageSub:   { fontSize: 14, color: '#666', lineHeight: 1.5 },
    statsRow: {
        display: 'flex', alignItems: 'center', gap: 24,
        backgroundColor: '#f8f9fa', padding: '16px 24px',
        borderRadius: 14, border: '0.5px solid #eee',
    },
    statDivider: { width: 0.5, height: 32, backgroundColor: '#eee' },

    /* Controls */
    controls: {
        maxWidth: 1100, margin: '0 auto', padding: '24px 32px 0',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    },
    countText: { fontSize: 14, color: '#888' },
    sortGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    sortPill: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
        border: '0.5px solid #e0e0e0',
        backgroundColor: '#fff', color: '#666', transition: 'all 0.15s',
    },
    sortPillActive: {
        backgroundColor: '#111', color: '#fff', borderColor: '#111',
    },

    /* Main */
    main: { maxWidth: 1100, margin: '0 auto', padding: '24px 32px 80px' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 20,
    },
avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#0f3460', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
    /* Loading */
    loading: { textAlign: 'center', padding: '80px 20px', color: '#888', fontSize: 14 },
    loadingDots: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 },
    dot: {
        width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E24B4A',
        display: 'inline-block', opacity: 0.4,
        animation: 'fdBounce 1s infinite ease-in-out',
    },

    /* Empty */
    empty: { textAlign: 'center', padding: '80px 20px' },
    emptyTitle: { fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 8 },
    emptySub:   { fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 20 },
    emptyBtn: {
        backgroundColor: '#E24B4A', color: '#fff', border: 'none',
        padding: '10px 24px', borderRadius: 22, fontSize: 13,
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    },

    /* Card */
    card: {
        borderRadius: 14, overflow: 'hidden',
        border: '0.5px solid #eee', background: '#fff',
        cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    },
    cardHover: { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.09)' },
    cardImgWrap: { position: 'relative', width: '100%', height: 168, overflow: 'hidden' },
    cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    cardImgPlaceholder: {
        width: '100%', height: '100%', background: '#f5f5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
    },
    ratingBadge: {
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(0,0,0,0.55)', color: '#fff',
        fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 10,
    },
    newBadge: {
        position: 'absolute', top: 10, left: 10,
        background: '#E24B4A', color: '#fff',
        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
    },
    cardBody: { padding: '14px 16px 16px' },
    cardTitle: {
        fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4,
        lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    cardMeta:  { fontSize: 12, color: '#555', marginBottom: 8 },
    cardPrice: { fontSize: 13, fontWeight: 500, color: '#111', margin: 0 },
};

export default Feed;