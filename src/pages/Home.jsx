import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

/* ─────────────────────────────────────────────
   DATA STATIS
───────────────────────────────────────────── */
const KATEGORI = [
    { label: 'Semua',         emoji: '🍽️', keyword: '' },
    { label: 'Makanan Berat', emoji: '🍛', keyword: 'Makanan Berat' },
    { label: 'Cepat Saji',   emoji: '🍔', keyword: 'Cepat Saji' },
    { label: 'Minuman',       emoji: '🧋', keyword: 'Minuman' },
    { label: 'Snack',         emoji: '🍿', keyword: 'Snack' },
    { label: 'Mie',           emoji: '🍜', keyword: 'Mie' },
];

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Home = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown]     = useState(false);
    const [umkmList, setUmkmList]             = useState([]);
    const [searchTerm, setSearchTerm]         = useState('');
    const [activeKategori, setActiveKategori] = useState('Semua');
    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        const fetchUMKM = async () => {
            try {
                const res = await apiClient.get('/umkm');
                setUmkmList(res.data);
            } catch (err) {
                console.error('Gagal mengambil data UMKM', err);
            }
        };
        fetchUMKM();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setShowDropdown(false);
        navigate('/login');
    };

    const handleKategoriClick = (item) => {
        setActiveKategori(item.label);
        navigate(`/search?keyword=${item.keyword}`);
    };

    const handleSearch = () => {
        if (searchTerm.trim()) navigate(`/search?keyword=${searchTerm}`);
    };

    return (
        <div style={s.page}>

            {/* ── NAVBAR ── */}
            <nav style={s.navbar}>
                {/* Logo */}
                <div style={s.logo} onClick={() => navigate('/')}>
                    Plus<span style={{ color: '#E24B4A' }}>Review</span>
                </div>

                {/* Navigasi tengah */}
                <div style={s.navLinks}>
                    <NavBtn active onClick={() => navigate('/')}>Beranda</NavBtn>
                    <NavBtn onClick={() => navigate('/feed')}>Feed</NavBtn>
                    {isLoggedIn && (
                        <NavBtn onClick={() => navigate('/tambah')}>Tambah UMKM</NavBtn>
                    )}
                </div>

                {/* Auth kanan */}
                <div style={s.navRight}>
                    {isLoggedIn ? (
                        <div style={{ position: 'relative' }}>
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
                        </div>
                    ) : (
                        <button style={s.loginBtn} onClick={() => navigate('/login')}>
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={s.hero}>
                <div style={s.heroPill}>
                    📍&nbsp; Parepare, Sulawesi Selatan
                </div>
                <h1 style={s.heroTitle}>
                    Temukan warung favoritmu<br />
                    di <span style={{ color: '#F09595' }}>sekitar kampus</span>
                </h1>
                <p style={s.heroSub}>
                    Review jujur, rating transparan, dari sesama mahasiswa.
                </p>

                {/* Search Bar */}
                <div style={s.searchBar}>
                    <span style={s.searchIcon}></span>
                    <input
                        type="text"
                        placeholder="Cari warung, makanan, atau kategori..."
                        style={s.searchInput}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button style={s.searchBtn} onClick={handleSearch}>
                        Cari
                    </button>
                </div>
            </section>

            {/* ── KATEGORI ── */}
            <div style={s.kategoriRow}>
                {KATEGORI.map(k => (
                    <button
                        key={k.label}
                        style={{
                            ...s.katChip,
                            ...(activeKategori === k.label ? s.katChipActive : {}),
                        }}
                        onClick={() => handleKategoriClick(k)}
                    >
                        <span style={s.katEmoji}>{k.emoji}</span>
                        <span style={s.katLabel}>{k.label}</span>
                    </button>
                ))}
            </div>

            {/* ── KONTEN ── */}
            <main style={s.main}>

                {/* Section: Terpopuler */}
                <SectionHeader title="Terpopuler" onSeeAll={() => navigate('/search?keyword=')} />
                <div style={s.grid}>
                    {umkmList.length > 0
                        ? umkmList.map(item => (
                            <UMKMCard key={item.id} item={item} navigate={navigate} />
                        ))
                        : <p style={s.empty}>Belum ada UMKM yang ditambahkan.</p>
                    }
                </div>

                {/* Banner CTA */}
                <div style={s.banner}>
                    <div>
                        <p style={s.bannerTitle}>Punya warung favorit?</p>
                        <p style={s.bannerSub}>
                            Daftarkan UMKM-mu dan bantu mahasiswa lain menemukan tempat makan terbaik.
                        </p>
                    </div>
                    <button
                        style={s.bannerBtn}
                        onClick={() => navigate(isLoggedIn ? '/tambah' : '/login')}
                    >
                        Tambahkan sekarang →
                    </button>
                </div>

                {/* Section: Review Terbaru */}
                <SectionHeader title="Review Terbaru" onSeeAll={() => navigate('/feed')} />
                <div style={s.grid}>
                    {[...umkmList].reverse().slice(0, 4).map(item => (
                        <UMKMCard key={item.id + '-rev'} item={item} navigate={navigate} />
                    ))}
                </div>

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
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '8px 14px',
            borderRadius: '20px',
            color: active ? '#111' : '#888',
            backgroundColor: active ? '#f4f4f4' : 'transparent',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
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
            padding: '11px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            color: danger ? '#E24B4A' : '#333',
            borderBottom: '0.5px solid #f0f0f0',
            transition: 'background 0.1s',
        }}
        onClick={onClick}
        onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
        {children}
    </div>
);

const SectionHeader = ({ title, onSeeAll }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{title}</h2>
        <button
            style={{ background: 'none', border: 'none', color: '#E24B4A', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            onClick={onSeeAll}
        >
            Lihat semua →
        </button>
    </div>
);

/* ─────────────────────────────────────────────
   CARD UMKM
───────────────────────────────────────────── */
const UMKMCard = ({ item, navigate }) => {
    const [hovered, setHovered] = useState(false);
    const imagePath = item.image
        ? `${BASE_URL}/uploads/${item.image}`
        : null;
    const reviews    = item.reviews || [];
    const total      = reviews.length;
    const avgRating  = total > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
        : '0.0';

    return (
        <div
            style={{ ...s.card, ...(hovered ? s.cardHover : {}) }}
            onClick={() => navigate(`/umkm/${item.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Gambar */}
            <div style={s.cardImgWrap}>
                {imagePath ? (
                    <img src={imagePath} alt={item.nama_umkm} style={s.cardImg} />
                ) : (
                    <div style={s.cardImgPlaceholder}>
                        {item.kategori === 'Minuman' ? '🧋'
                            : item.kategori === 'Mie' ? '🍜'
                            : item.kategori === 'Snack' ? '🍿'
                            : item.kategori === 'Cepat Saji' ? '🍔'
                            : '🍛'}
                    </div>
                )}
                {/* Badge rating di atas gambar */}
                <div style={s.cardRatingBadge}>
                    ⭐ {avgRating}
                </div>
            </div>

            {/* Body */}
            <div style={s.cardBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={s.cardTitle}>{item.nama_umkm}</p>
                </div>
                <p style={s.cardMeta}>
                    {item.kategori || item.jenis || 'Umum'}
                    &nbsp;·&nbsp;
                    <span style={{ color: '#888' }}>{total} ulasan</span>
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
    /* Page */
    page: {
        backgroundColor: '#fff',
        minHeight: '100vh',
        color: '#111',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    },

    /* Navbar */
    navbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '68px',
        borderBottom: '0.5px solid #eee',
        position: 'sticky',
        top: 0,
        backgroundColor: '#fff',
        zIndex: 100,
    },
    logo: {
        fontSize: '20px',
        fontWeight: 700,
        letterSpacing: '-0.5px',
        cursor: 'pointer',
    },
    navLinks: {
        display: 'flex',
        gap: '4px',
    },
    navRight: {
        position: 'relative',
    },
    avatar: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: '#f0f0f0',
        border: '0.5px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '14px',
        cursor: 'pointer',
    },
    dropdown: {
        position: 'absolute',
        top: '46px',
        right: 0,
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        borderRadius: '14px',
        width: '168px',
        zIndex: 200,
        border: '0.5px solid #eee',
        overflow: 'hidden',
    },
    loginBtn: {
        backgroundColor: '#E24B4A',
        color: '#fff',
        padding: '9px 22px',
        borderRadius: '22px',
        border: 'none',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '13px',
        letterSpacing: '0.2px',
        fontFamily: 'inherit',
    },

    /* Hero */
    hero: {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')`,
        padding: '72px 32px 88px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
    },
    heroPill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(226,75,74,0.15)',
        border: '0.5px solid rgba(226,75,74,0.35)',
        color: '#F09595',
        fontSize: '12px',
        fontWeight: 500,
        padding: '6px 14px',
        borderRadius: '20px',
    },
    heroTitle: {
        fontSize: '40px',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.2,
        letterSpacing: '-0.5px',
        margin: 0,
    },
    heroSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '15px',
        margin: 0,
        lineHeight: 1.6,
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderRadius: '40px',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        marginTop: '8px',
    },
    searchIcon: {
        fontSize: '16px',
        marginLeft: '20px',
        flexShrink: 0,
    },
    searchInput: {
        flex: 1,
        padding: '16px 16px',
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        background: 'transparent',
        color: '#333',
        fontFamily: 'inherit',
    },
    searchBtn: {
        background: '#E24B4A',
        color: '#fff',
        border: 'none',
        margin: '6px',
        padding: '10px 22px',
        borderRadius: '30px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
    },

    /* Kategori */
    kategoriRow: {
        justifyContent: 'center',
        display: 'flex',
        gap: '10px',
        padding: '28px 32px 0',
        overflowX: 'auto',
        scrollbarWidth: 'none',
    },
    katChip: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        flexShrink: 0,
        fontFamily: 'inherit',
    },
    katChipActive: {},
    katEmoji: {
        width: '64px',
        height: '64px',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '26px',
        border: '0.5px solid #e0e0e0',
        background: '#fafafa',
        transition: 'border-color 0.15s',
    },
    katLabel: {
        fontSize: '12px',
        color: '#555',
        fontWeight: 500,
    },

    /* Main */
    main: {
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 32px 80px',
    },

    /* Grid */
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '48px',
    },
    empty: {
        color: '#999',
        gridColumn: '1/-1',
        fontSize: '14px',
    },
avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#0f3460', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
    /* Card */
    card: {
        borderRadius: '14px',
        overflow: 'hidden',
        border: '0.5px solid #eee',
        background: '#fff',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    },
    cardHover: {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
    },
    cardImgWrap: {
        position: 'relative',
        width: '100%',
        height: '168px',
        overflow: 'hidden',
    },
    cardImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
    cardImgPlaceholder: {
        width: '100%',
        height: '100%',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
    },
    cardRatingBadge: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: '10px',
        backdropFilter: 'blur(4px)',
    },
    cardBody: {
        padding: '14px 16px 16px',
    },
    cardTitle: {
        fontSize: '14px',
        fontWeight: 600,
        margin: '0 0 4px',
        color: '#111',
        lineHeight: 1.3,
    },
    cardMeta: {
        fontSize: '12px',
        color: '#555',
        margin: '0 0 6px',
    },
    cardPrice: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#111',
        margin: 0,
    },

    /* Banner */
    banner: {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')`,
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '48px',
        flexWrap: 'wrap',
    },
    bannerTitle: {
        fontSize: '17px',
        fontWeight: 600,
        color: '#fff',
        margin: '0 0 6px',
    },
    bannerSub: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.6)',
        margin: 0,
        lineHeight: 1.5,
        maxWidth: '400px',
    },
    bannerBtn: {
        background: '#E24B4A',
        color: '#fff',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '22px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
};

export default Home;