import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

const KATEGORI = [
    { label: 'Semua',         emoji: '🍽️' },
    { label: 'Makanan Berat', emoji: '🍛' },
    { label: 'Cepat Saji',   emoji: '🍔' },
    { label: 'Minuman',       emoji: '🧋' },
    { label: 'Snack',         emoji: '🍿' },
    { label: 'Mie',           emoji: '🍜' },
];

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams  = new URLSearchParams(location.search);
    const keywordUrl   = queryParams.get('keyword') || '';

    const [umkmList,      setUmkmList]      = useState([]);
    const [searchTerm,    setSearchTerm]    = useState(keywordUrl);
    const [kategoriAktif, setKategoriAktif] = useState('Semua');
    const [sortBy,        setSortBy]        = useState('rating');

    useEffect(() => {
        const fetchUMKM = async () => {
            try {
                const res = await apiClient.get('/umkm');
                setUmkmList(res.data);
            } catch (err) {
                console.error('Gagal mengambil data', err);
            }
        };
        fetchUMKM();
    }, []);

    /* Sync search term saat keyword URL berubah */
    useEffect(() => {
        setSearchTerm(keywordUrl);
    }, [keywordUrl]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            navigate(`/search?keyword=${searchTerm}`);
        }
    };

    /* Filter */
    const dataDisaring = umkmList
        .filter((item) => {
            const nama   = (item.nama_umkm || '').toLowerCase();
            const jenis  = (item.kategori  || item.jenis || '').toLowerCase();
            const cocokNama     = nama.includes(keywordUrl.toLowerCase());
            const cocokKategori = kategoriAktif === 'Semua' || jenis === kategoriAktif.toLowerCase();
            return cocokNama && cocokKategori;
        })
        .sort((a, b) => {
            const avgRating = (item) => {
                const reviews = item.reviews || [];
                if (!reviews.length) return 0;
                return reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
            };
            if (sortBy === 'rating')  return avgRating(b) - avgRating(a);
            if (sortBy === 'ulasan')  return (b.reviews?.length || 0) - (a.reviews?.length || 0);
            return 0;
        });

    return (
        <div style={s.page}>

            {/* ── NAVBAR PENCARIAN ── */}
            <nav style={s.navbar}>
                <button style={s.backBtn} onClick={() => navigate('/')}>
                    ← Kembali
                </button>

                {/* Search bar */}
                <div style={s.searchBar}>
                    <span style={s.searchIcon}>🔍</span>
                    <input
                        type="text"
                        style={s.searchInput}
                        value={searchTerm}
                        placeholder="Cari warung, makanan, kategori..."
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {searchTerm && (
                        <button
                            style={s.clearBtn}
                            onClick={() => {
                                setSearchTerm('');
                                navigate('/search?keyword=');
                            }}
                            aria-label="Hapus pencarian"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div style={s.logo} onClick={() => navigate('/')}>
                    Plus<span style={{ color: '#E24B4A' }}>Review</span>
                </div>
            </nav>

            {/* ── BODY ── */}
            <div style={s.body}>

                {/* Header hasil */}
                <div style={s.resultHeader}>
                    <p style={s.resultTitle}>
                        {keywordUrl
                            ? <>Hasil untuk "<span style={{ color: '#E24B4A' }}>{keywordUrl}</span>"</>
                            : 'Semua UMKM'
                        }
                    </p>
                    <p style={s.resultCount}>
                        Menampilkan {dataDisaring.length} warung
                    </p>
                </div>

                {/* Filter + Sort row */}
                <div style={s.filterRow}>
                    <span style={s.filterLabel}>Filter:</span>
                    {KATEGORI.map(k => (
                        <button
                            key={k.label}
                            style={{
                                ...s.catBtn,
                                ...(kategoriAktif === k.label ? s.catBtnActive : {}),
                            }}
                            onClick={() => setKategoriAktif(k.label)}
                        >
                            <span style={{ fontSize: 13 }}>{k.emoji}</span>
                            {k.label}
                        </button>
                    ))}

                    {/* Sort */}
                    <div style={s.sortWrap}>
                        <span style={s.sortLabel}>Urutkan:</span>
                        <div style={{ position: 'relative' }}>
                            <select
                                style={s.sortSelect}
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="rating">Rating tertinggi</option>
                                <option value="ulasan">Ulasan terbanyak</option>
                            </select>
                            <span style={s.sortArrow}>▾</span>
                        </div>
                    </div>
                </div>

                {/* Grid hasil */}
                <div style={s.grid}>
                    {dataDisaring.length > 0 ? (
                        dataDisaring.map(item => (
                            <UMKMCard key={item.id} item={item} navigate={navigate} />
                        ))
                    ) : (
                        <EmptyState keyword={keywordUrl} navigate={navigate} />
                    )}
                </div>

            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   CARD UMKM
───────────────────────────────────────────── */
const UMKMCard = ({ item, navigate }) => {
    const [hovered, setHovered] = useState(false);
    const imagePath = item.image
        ? `${BASE_URL}/uploads/${item.image}`
        : null;
    const reviews   = item.reviews || [];
    const total     = reviews.length;
    const avgRating = total > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
        : '0.0';
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
                <div style={s.catBadge}>{kategori}</div>
            </div>
            <div style={s.cardBody}>
                <p style={s.cardTitle}>{item.nama_umkm}</p>
                <p style={s.cardMeta}>{total} ulasan</p>
                <p style={s.cardPrice}>{item.harga_range || 'Harga belum tersedia'}</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
const EmptyState = ({ keyword, navigate }) => (
    <div style={s.empty}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p style={s.emptyTitle}>Tidak ada hasil untuk "{keyword}"</p>
        <p style={s.emptySub}>
            Coba kata kunci lain, atau ubah filter kategori.<br />
            Mungkin warung ini belum terdaftar di PlusReview?
        </p>
        <button style={s.emptyBtn} onClick={() => navigate('/tambah')}>
            Tambahkan UMKM baru
        </button>
    </div>
);

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = {
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
        gap: 16,
        padding: '0 32px',
        height: 68,
        borderBottom: '0.5px solid #eee',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    backBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#f4f4f4',
        border: '0.5px solid #e0e0e0',
        borderRadius: 20,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        color: '#333',
        fontFamily: 'inherit',
        flexShrink: 0,
        transition: 'background 0.15s',
    },
    searchBar: {
        flex: 1,
        maxWidth: 480,
        display: 'flex',
        alignItems: 'center',
        border: '0.5px solid #ddd',
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#f8f8f8',
        transition: 'border-color 0.15s',
    },
    searchIcon: {
        fontSize: 15,
        marginLeft: 16,
        flexShrink: 0,
        color: '#aaa',
    },
    searchInput: {
        flex: 1,
        padding: '11px 12px',
        border: 'none',
        outline: 'none',
        fontSize: 14,
        background: 'transparent',
        color: '#111',
        fontFamily: 'inherit',
    },
    clearBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0 14px',
        color: '#aaa',
        fontSize: 14,
        fontFamily: 'inherit',
    },
    logo: {
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        marginLeft: 'auto',
        cursor: 'pointer',
        flexShrink: 0,
    },

    /* Body */
    body: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: '36px 32px 80px',
    },
    resultHeader: {
        marginBottom: 24,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 600,
        color: '#111',
        marginBottom: 4,
    },
    resultCount: {
        fontSize: 13,
        color: '#888',
    },

    /* Filter row */
    filterRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
        flexWrap: 'wrap',
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: 600,
        color: '#888',
        flexShrink: 0,
    },
    catBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 20,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        border: '0.5px solid #e0e0e0',
        backgroundColor: '#fff',
        color: '#666',
        transition: 'all 0.15s',
    },
    catBtnActive: {
        backgroundColor: '#111',
        color: '#fff',
        borderColor: '#111',
    },

    /* Sort */
    sortWrap: {
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    sortLabel: {
        fontSize: 13,
        color: '#888',
        flexShrink: 0,
    },
    sortSelect: {
        padding: '7px 28px 7px 12px',
        border: '0.5px solid #ddd',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        color: '#111',
        backgroundColor: '#fff',
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
    },
    sortArrow: {
        position: 'absolute',
        right: 9,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 11,
        color: '#aaa',
        pointerEvents: 'none',
    },

    /* Grid */
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 20,
    },

    /* Card */
    card: {
        borderRadius: 14,
        overflow: 'hidden',
        border: '0.5px solid #eee',
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    },
    cardHover: {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    },
    cardImgWrap: {
        position: 'relative',
        width: '100%',
        height: 168,
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
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
    },
    ratingBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.55)',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: 10,
    },
    catBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(255,255,255,0.9)',
        color: '#555',
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 10,
    },
    cardBody: {
        padding: '14px 16px 16px',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#111',
        marginBottom: 4,
        lineHeight: 1.3,
    },
    cardMeta: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    cardPrice: {
        fontSize: 13,
        fontWeight: 500,
        color: '#111',
    },

    /* Empty state */
    empty: {
        gridColumn: '1/-1',
        textAlign: 'center',
        padding: '80px 20px',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#111',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#888',
        lineHeight: 1.6,
    },
    emptyBtn: {
        display: 'inline-block',
        marginTop: 20,
        backgroundColor: '#E24B4A',
        color: '#fff',
        border: 'none',
        padding: '10px 24px',
        borderRadius: 22,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
};

export default Search;