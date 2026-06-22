import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1200&auto=format&fit=crop';

/* ─────────────────────────────────────────────
   DATA STATIS KATEGORI
───────────────────────────────────────────── */
const KATEGORI = [
    { label: 'Semua',         emoji: '🍽️' },
    { label: 'Makanan Berat', emoji: '🍛' },
    { label: 'Cepat Saji',    emoji: '🍔' },
    { label: 'Minuman',       emoji: '🧋' },
    { label: 'Snack',         emoji: '🍿' },
    { label: 'Mie',           emoji: '🍜' },
];

/* ─────────────────────────────────────────────
   IKON SVG MURNI
───────────────────────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const ChevronLeft = (props) => <SvgIcon {...props}><path d="m15 18-6-6 6-6"/></SvgIcon>;
const SearchIcon = (props) => <SvgIcon {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></SvgIcon>;
const XIcon = (props) => <SvgIcon {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></SvgIcon>;
const Star = (props) => <SvgIcon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgIcon>;
const MessageCircle = (props) => <SvgIcon {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></SvgIcon>;
const Cookie = (props) => <SvgIcon {...props}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 12.5v.01"/><path d="M12 16v.01"/><path d="M11 7v.01"/><path d="M7 12v.01"/></SvgIcon>;
const CupSoda = (props) => <SvgIcon {...props}><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></SvgIcon>;
const Utensils = (props) => <SvgIcon {...props}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></SvgIcon>;

/* ─────────────────────────────────────────────
   FUNGSI HELPER
───────────────────────────────────────────── */
const resolveImageUrl = (image) => {
    if (!image) return '';
    if (String(image).startsWith('http')) return image;
    return `${BASE_URL}/uploads/${image}`;
};

const getFoodCategoryType = (value) => {
    const category = String(value || '').toLowerCase();
    if (category.includes('drink') || category.includes('minum') || category.includes('kopi') || category.includes('teh')) return 'drink';
    if (category.includes('snack') || category.includes('dessert') || category.includes('kue')) return 'dessert';
    return 'meal';
};

const renderFoodCategoryIcon = (type) => {
    if (type === 'drink') return <CupSoda aria-hidden="true" />;
    if (type === 'dessert') return <Cookie aria-hidden="true" />;
    return <Utensils aria-hidden="true" />;
};

const getAverageRating = (item) => {
    const reviews = item.reviews || [];
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
};

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams  = new URLSearchParams(location.search);
    const keywordUrl   = queryParams.get('keyword') || '';

    const [umkmList, setUmkmList] = useState([]);
    const [searchTerm, setSearchTerm] = useState(keywordUrl);
    const [kategoriAktif, setKategoriAktif] = useState('Semua');
    const [sortBy, setSortBy] = useState('rating');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUMKM = async () => {
            try {
                const res = await apiClient.get('/umkm');
                setUmkmList(res.data);
            } catch (err) {
                console.error('Gagal mengambil data', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUMKM();
    }, []);

    /* Sync search term saat keyword URL berubah */
    useEffect(() => {
        setSearchTerm(keywordUrl);
    }, [keywordUrl]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (searchTerm.trim()) {
                navigate(`/search?keyword=${encodeURIComponent(searchTerm.trim())}`);
            } else {
                navigate(`/search?keyword=`);
            }
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        navigate('/search?keyword=');
    };

    /* ── FILTER & SORTIR ── */
    const dataDisaring = useMemo(() => {
        return umkmList
            .filter((item) => {
                const nama  = (item.nama_umkm || '').toLowerCase();
                const jenis = (item.kategori  || item.jenis_makanan || item.jenis || '').toLowerCase();
                const cocokNama     = nama.includes(keywordUrl.toLowerCase());
                const cocokKategori = kategoriAktif === 'Semua' || jenis.includes(kategoriAktif.toLowerCase());
                return cocokNama && cocokKategori;
            })
            .sort((a, b) => {
                if (sortBy === 'rating') return getAverageRating(b) - getAverageRating(a);
                if (sortBy === 'ulasan') return (b.reviews?.length || 0) - (a.reviews?.length || 0);
                return 0;
            });
    }, [umkmList, keywordUrl, kategoriAktif, sortBy]);

    return (
        <div className="search-page-wrapper">
            <style dangerouslySetInnerHTML={{ __html: searchCSS }} />

            {/* ── NAVBAR PENCARIAN ── */}
            <nav className="nav-bar glass-effect search-nav">
                <button className="btn-nav-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={18} /> <span className="hide-mobile">Kembali</span>
                </button>

                <div className="search-bar-center">
                    <SearchIcon size={18} className="search-icon" />
                    <input
                        type="text"
                        value={searchTerm}
                        placeholder="Cari warung, makanan, kategori..."
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {searchTerm && (
                        <button className="btn-clear" onClick={clearSearch}>
                            <XIcon size={14} />
                        </button>
                    )}
                </div>

                <div className="brand-logo hide-mobile" onClick={() => navigate('/')}>
                    Plus<span>Review</span>
                </div>
            </nav>

            {/* ── KONTEN UTAMA ── */}
            <main className="search-container">
                
                {/* Header Hasil */}
                <header className="search-header">
                    <h2>
                        {keywordUrl 
                            ? <>Hasil untuk "<span>{keywordUrl}</span>"</> 
                            : 'Semua UMKM'
                        }
                    </h2>
                    <p>Menampilkan <strong>{dataDisaring.length}</strong> warung ditemukan</p>
                </header>

                {/* Kontrol Kategori & Sortir */}
                <div className="search-controls">
                    <div className="category-row-inline">
                        {KATEGORI.map(k => (
                            <button 
                                key={k.label} 
                                className={`cat-chip ${kategoriAktif === k.label ? 'is-active' : ''}`}
                                onClick={() => setKategoriAktif(k.label)}
                            >
                                <span className="cat-emoji">{k.emoji}</span>
                                <span className="cat-label">{k.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="sort-wrapper">
                        <span className="sort-label">Urutkan:</span>
                        <div className="sort-group">
                            <button 
                                className={`sort-pill ${sortBy === 'rating' ? 'active' : ''}`}
                                onClick={() => setSortBy('rating')}
                            >
                                <Star size={16} /> Rating tertinggi
                            </button>
                            <button 
                                className={`sort-pill ${sortBy === 'ulasan' ? 'active' : ''}`}
                                onClick={() => setSortBy('ulasan')}
                            >
                                <MessageCircle size={16} /> Ulasan terbanyak
                            </button>
                        </div>
                    </div>
                </div>

                {/* Daftar Hasil */}
                {isLoading ? (
                    <div className="search-loading">
                        <p>Mencari warung...</p>
                        <div className="loading-dots">
                            <span style={{ animationDelay: '0s' }} />
                            <span style={{ animationDelay: '0.15s' }} />
                            <span style={{ animationDelay: '0.3s' }} />
                        </div>
                    </div>
                ) : dataDisaring.length > 0 ? (
                    <div className="grid-layout">
                        {dataDisaring.map(item => (
                            <UMKMCard key={item.id} item={item} navigate={navigate} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <SearchIcon size={48} className="empty-icon" />
                        <h3>Tidak ada hasil untuk "{keywordUrl}"</h3>
                        <p>Coba gunakan kata kunci lain, atau ubah filter kategorinya.<br/>Mungkin warung ini belum terdaftar di PlusReview?</p>
                        <button className="btn-primary" onClick={() => navigate('/tambah')}>
                            Tambahkan UMKM Baru
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
};

/* ─────────────────────────────────────────────
   KOMPONEN CARD UMKM
───────────────────────────────────────────── */
const UMKMCard = ({ item, navigate }) => {
    const primaryImage = resolveImageUrl(item.image) || FALLBACK_IMAGE;
    const reviews = item.reviews || [];
    const totalReviews = reviews.length;
    const avgRating = getAverageRating(item).toFixed(1);
    const kategori = item.kategori || item.jenis_makanan || item.jenis || 'Umum';
    const categoryType = getFoodCategoryType(kategori);

    return (
        <div className="ui-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="card-image">
                <img src={primaryImage} alt={item.nama_umkm} />
                <span className="card-tag">
                    {renderFoodCategoryIcon(categoryType)} {kategori}
                </span>
            </div>
            <div className="card-content">
                <h3 className="card-title">{item.nama_umkm}</h3>
                <p className="card-desc">{item.deskripsi || item.alamat_teks || 'Deskripsi belum tersedia.'}</p>
                <div className="card-stats">
                    <span className="stat-rating">⭐ {avgRating}</span>
                    <span className="stat-review">{totalReviews} ulasan</span>
                </div>
                <div className="card-foot">
                    <span className="price">{item.harga_range || 'Harga belum diatur'}</span>
                    <strong className="link">Lihat detail</strong>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   CSS INJECTION (Konsisten dengan Aplikasi)
───────────────────────────────────────────── */
const searchCSS = `
    .search-page-wrapper { font-family: Inter, "Segoe UI", system-ui, sans-serif; background: #fbfaf6; min-height: 100vh; color: #181714; padding-bottom: 80px; }
    
    /* Navbar Pencarian Khusus */
    .nav-bar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(20px, 5vw, 60px); min-height: 72px; border-bottom: 1px solid rgba(24, 23, 20, 0.06); background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 250, 246, 0.9)); box-shadow: 0 14px 34px rgba(35, 34, 29, 0.06); backdrop-filter: blur(18px); gap: 24px; }
    .btn-nav-back { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(24, 23, 20, 0.12); border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 700; color: #1f3f2f; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); flex-shrink: 0; }
    .btn-nav-back:hover { background: #fbfaf6; border-color: rgba(31, 63, 47, 0.24); }
    .brand-logo { font-size: 20px; font-weight: 900; color: #181714; cursor: pointer; flex-shrink: 0; }
    .brand-logo span { color: #efb84f; }
    
    .search-bar-center { flex: 1; max-width: 600px; display: flex; align-items: center; background: rgba(24, 23, 20, 0.04); border: 1px solid rgba(24, 23, 20, 0.08); border-radius: 999px; padding: 0 16px; transition: 0.2s; }
    .search-bar-center:focus-within { background: #fff; border-color: #1f3f2f; box-shadow: 0 0 0 4px rgba(31, 63, 47, 0.08); }
    .search-icon { color: #888; flex-shrink: 0; }
    .search-bar-center input { flex: 1; border: none; background: transparent; padding: 12px 12px; font-size: 14px; color: #181714; outline: none; font-family: inherit; font-weight: 500; }
    .btn-clear { background: rgba(24, 23, 20, 0.08); border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
    .btn-clear:hover { background: #1f3f2f; color: #fff; }

    /* Layout Pencarian */
    .search-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    
    .search-header { margin-bottom: 32px; border-bottom: 2px solid #efb84f; padding-bottom: 16px; }
    .search-header h2 { font-size: 28px; font-weight: 900; color: #181714; margin: 0 0 8px; letter-spacing: -0.5px; }
    .search-header h2 span { color: #E24B4A; }
    .search-header p { margin: 0; color: #756f64; font-size: 15px; }
    .search-header p strong { color: #181714; font-weight: 800; }

    /* Kontrol Filter & Sortir */
    .search-controls { display: flex; flex-direction: column; gap: 24px; margin-bottom: 32px; }
    
    .category-row-inline { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; padding-bottom: 8px; }
    .category-row-inline::-webkit-scrollbar { display: none; }
    .cat-chip { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid rgba(24, 23, 20, 0.08); padding: 8px 16px; border-radius: 999px; cursor: pointer; flex-shrink: 0; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
    .cat-emoji { font-size: 16px; }
    .cat-label { font-size: 13px; font-weight: 700; color: #756f64; }
    .cat-chip:hover { border-color: rgba(31, 63, 47, 0.24); background: #fbfaf6; transform: translateY(-2px); }
    .cat-chip.is-active { border-color: #1f3f2f; background: linear-gradient(135deg, #1f3f2f, #2f6047); box-shadow: 0 8px 20px rgba(31, 63, 47, 0.15); transform: translateY(-2px); }
    .cat-chip.is-active .cat-label { color: #fff; }

    .sort-wrapper { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .sort-label { font-size: 13px; font-weight: 800; color: #8a5a00; }
    .sort-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .sort-pill { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(24, 23, 20, 0.12); padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #5f574d; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
    .sort-pill svg { width: 14px; height: 14px; }
    .sort-pill:hover { background: #fbfaf6; border-color: rgba(31, 63, 47, 0.24); }
    .sort-pill.active { background: #1f3f2f; color: #fff; border-color: #1f3f2f; box-shadow: 0 8px 20px rgba(31, 63, 47, 0.15); }

    /* Grid Layout & Cards */
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; }
    .ui-card { background: linear-gradient(180deg, #fff 0%, #fff 68%, #fbf7ef 100%); border: 1px solid rgba(24, 23, 20, 0.08); border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 14px 34px rgba(35, 34, 29, 0.05); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
    .ui-card:hover { transform: translateY(-6px); box-shadow: 0 24px 50px rgba(35, 34, 29, 0.11); border-color: rgba(31, 63, 47, 0.24); }
    .card-image { width: 100%; aspect-ratio: 4/3; background: #e9e0d0; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .ui-card:hover .card-image img { transform: scale(1.05); }
    .card-tag { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.92); color: #1f3f2f; font-size: 11.5px; font-weight: 800; padding: 6px 10px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 4px; }
    .card-tag svg { width: 12px; height: 12px; }
    .card-content { padding: 18px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .card-title { font-size: 17px; font-weight: 850; color: #181714; margin: 0; line-height: 1.25; }
    .card-desc { font-size: 13px; color: #756f64; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; }
    .card-stats { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 750; color: #827b70; align-items: center; }
    .stat-rating { background: #fff4d8; color: #8a5a00; padding: 6px 10px; border-radius: 999px; }
    .card-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(24,23,20,0.08); padding-top: 14px; margin-top: auto; }
    .price { font-size: 13px; font-weight: 800; color: #5f574d; }
    .link { font-size: 13px; font-weight: 900; color: #1f3f2f; transition: color 0.2s; }
    .ui-card:hover .link { color: #8a5a00; }

    /* Loading & Empty State */
    .search-loading { text-align: center; padding: 100px 20px; color: #756f64; font-weight: 700; font-size: 15px; }
    .loading-dots { display: flex; gap: 6px; justify-content: center; margin-top: 12px; }
    .loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: #1f3f2f; animation: pulse 1s infinite ease-in-out; }
    @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }
    
    .empty-state { text-align: center; padding: 80px 20px; background: rgba(31, 63, 47, 0.03); border: 1px dashed rgba(31, 63, 47, 0.15); border-radius: 16px; margin-top: 24px; }
    .empty-icon { color: #8a5a00; opacity: 0.8; margin-bottom: 16px; }
    .empty-state h3 { font-size: 22px; font-weight: 900; color: #181714; margin: 0 0 12px; }
    .empty-state p { color: #756f64; font-size: 14.5px; margin: 0 0 24px; line-height: 1.6; }
    .btn-primary { background: #1f3f2f; color: #fff; border: none; padding: 12px 28px; border-radius: 999px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 12px 24px rgba(31, 63, 47, 0.15); }
    .btn-primary:hover { background: #183326; transform: translateY(-2px); }

    /* Responsive */
    @media (max-width: 768px) {
        .search-nav { gap: 12px; padding: 0 16px; }
        .hide-mobile { display: none !important; }
        .btn-nav-back { padding: 8px; border-radius: 50%; }
        .btn-nav-back svg { margin: 0; }
        .search-header h2 { font-size: 24px; }
    }
    @media (max-width: 640px) {
        .search-container { padding: 24px 16px; }
        .search-controls { gap: 16px; }
        .category-row-inline { padding-bottom: 12px; }
        .grid-layout { grid-template-columns: 1fr; gap: 20px; }
    }
`;

export default Search;