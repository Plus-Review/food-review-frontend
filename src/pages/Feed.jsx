import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1200&auto=format&fit=crop';

/* ─────────────────────────────────────────────
   IKON SVG MURNI
───────────────────────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const Clock = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
const Cookie = (props) => <SvgIcon {...props}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 12.5v.01"/><path d="M12 16v.01"/><path d="M11 7v.01"/><path d="M7 12v.01"/></SvgIcon>;
const CupSoda = (props) => <SvgIcon {...props}><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></SvgIcon>;
const MessageCircle = (props) => <SvgIcon {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></SvgIcon>;
const Star = (props) => <SvgIcon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgIcon>;
const Utensils = (props) => <SvgIcon {...props}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></SvgIcon>;
const Store = (props) => <SvgIcon {...props}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></SvgIcon>;

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

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Feed = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [showDropdown, setShowDropdown] = useState(false);
    const [umkmList, setUmkmList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // States untuk Sort
    const [sortBy, setSortBy] = useState(location.state?.defaultSort || 'semua');

    const isLoggedIn = !!localStorage.getItem('token');
    const userName = localStorage.getItem('userName') || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    // Tangkap lemparan dari halaman Home (jika ada)
    useEffect(() => {
        if (!location.state?.defaultSort) return undefined;

        const timeoutId = window.setTimeout(() => {
            setSortBy(location.state.defaultSort);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [location.state?.defaultSort]);

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
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/login');
    };

    /* ── SORTIR DATA ── */
    const processedList = useMemo(() => {
        return [...umkmList].sort((a, b) => {
            if (sortBy === 'bintang_tertinggi') return b.calculatedAvgRating - a.calculatedAvgRating;
            if (sortBy === 'review_terbaru') return b.latestReviewId - a.latestReviewId;
            if (sortBy === 'terbaru_ditambahkan') return b.id - a.id;
            
            // Jika sortBy === 'semua', urutkan berdasarkan ID ascending (urutan asli dari API)
            return a.id - b.id; 
        });
    }, [umkmList, sortBy]);

    /* Statistik ringkas */
    const totalUlasan = umkmList.reduce((s, u) => s + (u.reviews?.length || 0), 0);
    const rataRating = umkmList.length > 0
        ? (umkmList.reduce((s, u) => s + (u.calculatedAvgRating || 0), 0) / umkmList.length).toFixed(1)
        : '0.0';

    /* 3 UMKM terbaru untuk badge "Baru" */
    const idTerbaru = useMemo(() => {
        return [...umkmList].sort((a, b) => b.id - a.id).slice(0, 3).map(u => u.id);
    }, [umkmList]);

    // Opsi Sortir
    const SORT_OPTIONS = [
        { value: 'semua',               icon: <Store size={16} />,         label: 'Semua' },
        { value: 'terbaru_ditambahkan', icon: <Clock size={16} />,         label: 'Terbaru' },
        { value: 'bintang_tertinggi',   icon: <Star size={16} />,          label: 'Terpopuler' },
        { value: 'review_terbaru',      icon: <MessageCircle size={16} />, label: 'Review terbaru' },
    ];

    return (
        <div className="feed-page-wrapper">
            <style dangerouslySetInnerHTML={{ __html: feedCSS }} />

            {/* ── NAVBAR ── */}
            <nav className="nav-bar glass-effect">
                <div className="brand-logo" onClick={() => navigate('/')}>
                    Plus<span>Review</span>
                </div>
                <div className="nav-links">
                    <button className="nav-btn" onClick={() => navigate('/')}>Beranda</button>
                    <button className="nav-btn active" onClick={() => navigate('/feed')}>Feed</button>
                    {isLoggedIn && (
                        <button className="nav-btn" onClick={() => navigate('/tambah')}>Tambah UMKM</button>
                    )}
                </div>
                <div className="nav-account">
                    {isLoggedIn ? (
                        <div style={{ position: 'relative' }}>
                            <div className="avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
                                {userInitial}
                            </div>
                            {showDropdown && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={() => navigate('/profil')}>Profil Saya</div>
                                    <div className="dropdown-item" onClick={() => navigate('/favorit')}>Favorit</div>
                                    <div className="dropdown-item danger" onClick={handleLogout}>Logout</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
                    )}
                </div>
            </nav>

            {/* ── MAIN CONTENT ── */}
            <main className="feed-container">
                
                {/* BANNER HEADER */}
                <header className="feed-banner">
                    <div className="feed-banner-content">
                        <h1>Eksplorasi UMKM</h1>
                        <p>Temukan dan urutkan warung makan yang terdaftar di platform PlusReview.</p>
                        
                        {!isLoading && (
                            <div className="feed-stats-row">
                                <div className="stat-box">
                                    <Store />
                                    <div>
                                        <strong>{umkmList.length}</strong>
                                        <span>Warung Terdaftar</span>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <MessageCircle />
                                    <div>
                                        <strong>{totalUlasan}</strong>
                                        <span>Total Ulasan</span>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <Star />
                                    <div>
                                        <strong>{rataRating}</strong>
                                        <span>Rata-rata Rating</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* KONTROL SORTIR */}
                <div className="feed-controls">
                    <p className="count-text">
                        Menampilkan <strong>{processedList.length} warung</strong>
                    </p>
                    <div className="sort-group">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`sort-pill ${sortBy === opt.value ? 'active' : ''}`}
                                onClick={() => setSortBy(opt.value)}
                            >
                                {opt.icon} {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DAFTAR UMKM */}
                {isLoading ? (
                    <div className="feed-loading">
                        <p>Memuat daftar warung...</p>
                        <div className="loading-dots">
                            <span style={{ animationDelay: '0s' }} />
                            <span style={{ animationDelay: '0.15s' }} />
                            <span style={{ animationDelay: '0.3s' }} />
                        </div>
                    </div>
                ) : processedList.length > 0 ? (
                    <div className="grid-layout">
                        {processedList.map(item => (
                            <UMKMCard
                                key={item.id}
                                item={item}
                                navigate={navigate}
                                isBaru={idTerbaru.includes(item.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-box">
                        <Store style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                        <h3>Belum ada warung yang terdaftar</h3>
                        <p>Jadilah yang pertama menambahkan UMKM di platform ini!</p>
                        <button className="btn-primary" onClick={() => navigate('/tambah')}>
                            Tambahkan Sekarang
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
const UMKMCard = ({ item, navigate, isBaru }) => {
    const primaryImage = resolveImageUrl(item.image) || FALLBACK_IMAGE;
    const reviews = item.reviews || [];
    const totalReviews = reviews.length;
    const avgRating = item.calculatedAvgRating ? item.calculatedAvgRating.toFixed(1) : '0.0';
    const kategori = item.kategori || item.jenis_makanan || item.jenis || 'Umum';
    const categoryType = getFoodCategoryType(kategori);

    return (
        <div className="ui-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="card-image">
                <img src={primaryImage} alt={item.nama_umkm} />
                <span className="card-tag">
                    {renderFoodCategoryIcon(categoryType)} {kategori}
                </span>
                {isBaru && <span className="card-tag-new">Baru</span>}
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
   CSS INJECTION
───────────────────────────────────────────── */
const feedCSS = `
    .feed-page-wrapper { font-family: Inter, "Segoe UI", system-ui, sans-serif; background: #fbfaf6; min-height: 100vh; color: #181714; padding-bottom: 80px; }
    
    /* Navbar */
    .nav-bar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(28px, 5vw, 72px); min-height: 72px; border-bottom: 1px solid rgba(24, 23, 20, 0.06); background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 250, 246, 0.9)); box-shadow: 0 14px 34px rgba(35, 34, 29, 0.06); backdrop-filter: blur(18px); }
    .brand-logo { font-size: 20px; font-weight: 900; color: #181714; cursor: pointer; }
    .brand-logo span { color: #efb84f; }
    .nav-links { display: flex; gap: 8px; }
    .nav-btn { min-height: 36px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #6f695e; cursor: pointer; font-size: 13px; font-weight: 700; padding: 8px 16px; transition: all 0.2s; }
    .nav-btn:hover { background: #fff; color: #1f3f2f; border-color: rgba(31, 63, 47, 0.24); }
    .nav-btn.active { border-color: #1f3f2f; background: linear-gradient(135deg, #1f3f2f, #2f6047); color: #fff; box-shadow: 0 14px 30px rgba(31, 63, 47, 0.18); }
    .btn-login { min-height: 42px; border-radius: 999px; background: linear-gradient(135deg, #181714, #2f2a21); color: #fff; border: none; font-weight: 800; cursor: pointer; padding: 10px 20px; box-shadow: 0 14px 30px rgba(24, 23, 20, 0.16); }
    .avatar-btn { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; border: 2px solid #fff; background: radial-gradient(circle at 34% 28%, #ffe0a2 0 18%, #efb84f 19% 100%); color: #181714; font-weight: 800; cursor: pointer; box-shadow: 0 12px 28px rgba(181, 122, 21, 0.18); }
    .dropdown-menu { position: absolute; top: 52px; right: 0; min-width: 172px; border: 1px solid rgba(24, 23, 20, 0.1); border-radius: 8px; background: linear-gradient(180deg, #fff, #fbfaf6); box-shadow: 0 20px 44px rgba(24, 23, 20, 0.14); overflow: hidden; }
    .dropdown-item { padding: 13px 16px; font-size: 13px; font-weight: 600; color: #29251f; cursor: pointer; transition: background 0.2s; }
    .dropdown-item:hover { background: #f4efe5; }
    .dropdown-item.danger { color: #b42318; }

    /* Feed Layout */
    .feed-container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    
    /* Banner Mewah */
    .feed-banner { background: linear-gradient(135deg, #1f3f2f, #0d110e); border-radius: 20px; padding: 40px; color: #fff; box-shadow: 0 20px 40px rgba(31, 63, 47, 0.15); margin-bottom: 32px; position: relative; overflow: hidden; }
    .feed-banner::after { content: ''; position: absolute; top: -50%; right: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(239, 184, 79, 0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
    .feed-banner-content h1 { font-size: 32px; font-weight: 900; margin: 0 0 8px; letter-spacing: -0.5px; }
    .feed-banner-content p { color: rgba(255, 255, 255, 0.8); font-size: 15px; margin: 0 0 24px; max-width: 500px; line-height: 1.5; }
    
    .feed-stats-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat-box { display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); padding: 16px 20px; border-radius: 12px; backdrop-filter: blur(10px); flex: 1; min-width: 200px; }
    .stat-box svg { width: 28px; height: 28px; color: #efb84f; }
    .stat-box strong { display: block; font-size: 22px; font-weight: 900; line-height: 1.2; }
    .stat-box span { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }

    /* Controls */
    .feed-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid rgba(24, 23, 20, 0.08); padding-bottom: 24px; }
    .count-text { margin: 0; font-size: 14px; color: #756f64; font-weight: 500; }
    .count-text strong { color: #181714; font-weight: 800; }
    .sort-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .sort-pill { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(24, 23, 20, 0.12); padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #5f574d; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
    .sort-pill svg { width: 14px; height: 14px; }
    .sort-pill:hover { background: #fbfaf6; border-color: rgba(31, 63, 47, 0.24); }
    .sort-pill.active { background: #1f3f2f; color: #fff; border-color: #1f3f2f; box-shadow: 0 8px 20px rgba(31, 63, 47, 0.15); }

    /* Grid Layout & Cards */
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .ui-card { background: linear-gradient(180deg, #fff 0%, #fff 68%, #fbf7ef 100%); border: 1px solid rgba(24, 23, 20, 0.08); border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 14px 34px rgba(35, 34, 29, 0.05); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
    .ui-card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px rgba(35, 34, 29, 0.11); border-color: rgba(31, 63, 47, 0.24); }
    .card-image { width: 100%; aspect-ratio: 4/3; background: #e9e0d0; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .ui-card:hover .card-image img { transform: scale(1.05); }
    .card-tag { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.92); color: #1f3f2f; font-size: 11.5px; font-weight: 800; padding: 6px 10px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 4px; }
    .card-tag svg { width: 12px; height: 12px; }
    .card-tag-new { position: absolute; top: 12px; right: 12px; background: #b42318; color: #fff; font-size: 11px; font-weight: 800; padding: 5px 10px; border-radius: 999px; box-shadow: 0 4px 12px rgba(180, 35, 24, 0.2); }
    .card-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .card-title { font-size: 16px; font-weight: 850; color: #181714; margin: 0; line-height: 1.25; }
    .card-desc { font-size: 12.5px; color: #756f64; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; }
    .card-stats { display: flex; justify-content: space-between; font-size: 12px; font-weight: 750; color: #827b70; align-items: center; }
    .stat-rating { background: #fff4d8; color: #8a5a00; padding: 6px 10px; border-radius: 999px; }
    .card-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(24,23,20,0.08); padding-top: 12px; margin-top: auto; }
    .price { font-size: 12px; font-weight: 800; color: #5f574d; }
    .link { font-size: 12px; font-weight: 900; color: #1f3f2f; transition: color 0.2s; }
    .ui-card:hover .link { color: #8a5a00; }

    /* Loading & Empty State */
    .feed-loading { text-align: center; padding: 80px 20px; color: #756f64; font-weight: 600; }
    .loading-dots { display: flex; gap: 6px; justify-content: center; margin-top: 12px; }
    .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: #1f3f2f; animation: pulse 1s infinite ease-in-out; }
    @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }
    
    .empty-box { text-align: center; padding: 60px 20px; background: rgba(31, 63, 47, 0.03); border: 1px dashed rgba(31, 63, 47, 0.15); border-radius: 16px; color: #181714; }
    .empty-box h3 { font-size: 20px; font-weight: 900; margin: 0 0 8px; }
    .empty-box p { color: #756f64; font-size: 14px; margin: 0 0 20px; }
    .btn-primary { background: #1f3f2f; color: #fff; border: none; padding: 10px 24px; border-radius: 999px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px rgba(31, 63, 47, 0.15); }
    .btn-primary:hover { background: #183326; transform: translateY(-2px); }

    /* Responsive */
    @media (max-width: 768px) {
        .feed-banner { padding: 32px 24px; }
        .feed-stats-row { flex-direction: column; gap: 12px; }
        .stat-box { width: 100%; }
        .feed-controls { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 640px) {
        .nav-bar { padding: 0 16px; }
        .feed-container { padding: 24px 16px; }
        .grid-layout { grid-template-columns: 1fr; }
    }
`;

export default Feed;
