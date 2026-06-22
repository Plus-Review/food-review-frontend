import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1200&auto=format&fit=crop';

/* ─────────────────────────────────────────────
   IKON SVG MURNI
───────────────────────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const Bookmark = (props) => <SvgIcon {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></SvgIcon>;
const MessageCircle = (props) => <SvgIcon {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></SvgIcon>;
const Star = (props) => <SvgIcon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgIcon>;
const Trash2 = (props) => <SvgIcon {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></SvgIcon>;
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

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Favorit = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [userFavorites, setUserFavorites] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState(null);

    const isLoggedIn = !!localStorage.getItem('token');
    const userName = localStorage.getItem('userName') || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchFavorites = async () => {
            try {
                const res = await apiClient.get('/favorit/me');
                const warungFavoritku = res.data.map(fav => {
                    const detailWarung = fav.umkmDetail || fav.Umkm || fav; 
                    return {
                        ...detailWarung, 
                        id: detailWarung.id,
                        nama_umkm: detailWarung.nama_umkm,
                        image: detailWarung.image,
                        kategori: detailWarung.kategori || detailWarung.jenis_makanan || detailWarung.jenis || 'Umum',
                        harga_range: detailWarung.harga_range || 'Harga belum tersedia',
                        deskripsi: detailWarung.deskripsi,
                        alamat_teks: detailWarung.alamat_teks,
                        jam_operasional: detailWarung.jam_operasional,
                        reviews: detailWarung.reviews || []
                    };
                });
                setUserFavorites(warungFavoritku);
            } catch (err) {
                console.error("Gagal menarik data favorit", err);
                setNotice({ type: 'error', message: 'Gagal memuat daftar favorit.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (!notice) return;
        const timeout = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(timeout);
    }, [notice]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/login');
    };

    const handleRemoveSaved = async (itemId) => {
        try {
            await apiClient.post('/favorit/toggle', { umkm_id: itemId });
            setUserFavorites((current) => current.filter((item) => Number(item.id) !== Number(itemId)));
            setNotice({ type: 'success', message: 'UMKM berhasil dihapus dari daftar simpanan.' });
            window.dispatchEvent(new Event('saved-umkm-updated'));
        } catch (error) {
            setNotice({ type: 'error', message: error.response?.data?.message || 'Gagal menghapus simpanan.' });
        }
    };

    /* Kalkulasi Statistik */
    const totalReviews = useMemo(() => (
        userFavorites.reduce((sum, item) => sum + (item.reviews?.length || 0), 0)
    ), [userFavorites]);

    const averageRating = useMemo(() => {
        if (userFavorites.length === 0) return 0;
        const totalAvg = userFavorites.reduce((sum, item) => {
            const revs = item.reviews || [];
            if (revs.length === 0) return sum;
            return sum + (revs.reduce((s, r) => s + Number(r.rating || 0), 0) / revs.length);
        }, 0);
        return totalAvg / userFavorites.length;
    }, [userFavorites]);

    return (
        <div className="saved-page-wrapper">
            <style dangerouslySetInnerHTML={{ __html: favoritCSS }} />

            {/* ── NAVBAR ── */}
            <nav className="nav-bar glass-effect">
                <div className="brand-logo" onClick={() => navigate('/')}>
                    Plus<span>Review</span>
                </div>
                <div className="nav-links">
                    <button className="nav-btn" onClick={() => navigate('/')}>Beranda</button>
                    <button className="nav-btn" onClick={() => navigate('/feed')}>Feed</button>
                    <button className="nav-btn" onClick={() => navigate('/tambah')}>Tambah UMKM</button>
                </div>
                <div className="nav-account">
                    <div style={{ position: 'relative' }}>
                        <div className="avatar-btn" onClick={() => setShowDropdown(!showDropdown)}>
                            {userInitial}
                        </div>
                        {showDropdown && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item" onClick={() => navigate('/profil')}>Profil Saya</div>
                                <div className="dropdown-item active" onClick={() => setShowDropdown(false)}>Favorit</div>
                                <div className="dropdown-item danger" onClick={handleLogout}>Logout</div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HERO HEADER ── */}
            <header className="saved-hero">
                <div className="saved-hero-copy">
                    <span className="hero-kicker">Koleksi Personal</span>
                    <h1>UMKM Disimpan</h1>
                    <p>
                        Tempat makan yang kamu tandai untuk dikunjungi lagi nanti, tanpa perlu mencari ulang di beranda atau feed.
                    </p>

                    <div className="saved-hero-stats">
                        <div className="stat-box">
                            <Bookmark aria-hidden="true" />
                            <div>
                                <strong>{userFavorites.length}</strong>
                                <span>Tersimpan</span>
                            </div>
                        </div>
                        <div className="stat-box">
                            <MessageCircle aria-hidden="true" />
                            <div>
                                <strong>{totalReviews}</strong>
                                <span>Total Review</span>
                            </div>
                        </div>
                        <div className="stat-box">
                            <Star aria-hidden="true" />
                            <div>
                                <strong>{averageRating.toFixed(1)}</strong>
                                <span>Rata-rata Rating</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <section className="saved-shell">
                {notice && (
                    <div className={`toast-notice type-${notice.type}`}>
                        <span>{notice.message}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="empty-state">
                        <div className="loading-dots">
                            <span style={{ animationDelay: '0s' }} />
                            <span style={{ animationDelay: '0.15s' }} />
                            <span style={{ animationDelay: '0.3s' }} />
                        </div>
                        <strong>Memuat koleksimu...</strong>
                    </div>
                ) : userFavorites.length > 0 ? (
                    <div className="grid-layout">
                        {userFavorites.map((item) => (
                            <SavedCard
                                key={item.id}
                                item={item}
                                navigate={navigate}
                                onRemove={handleRemoveSaved}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Bookmark size={48} className="empty-icon" />
                        <h2>Belum ada warung favorit</h2>
                        <p>Kamu belum menyimpan warung apa pun. Eksplor beranda dan temukan warung favorit barumu!</p>
                        <button className="btn-primary" onClick={() => navigate('/#feed')}>
                            Eksplor Sekarang
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
};

/* ─────────────────────────────────────────────
   KOMPONEN CARD SAVED UMKM
───────────────────────────────────────────── */
const SavedCard = ({ item, navigate, onRemove }) => {
    const primaryImage = resolveImageUrl(item.image) || FALLBACK_IMAGE;
    const reviews = item.reviews || [];
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
        : '0.0';
        
    const kategori = item.kategori || item.jenis_makanan || item.jenis || 'Umum';
    const categoryType = getFoodCategoryType(kategori);

    const openDetail = (event) => {
        event.stopPropagation();
        navigate(`/umkm/${item.id}`);
    };

    return (
        <div className="ui-card" onClick={openDetail}>
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
                    <button
                        className="btn-remove-fav"
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRemove(item.id);
                        }}
                    >
                        <Trash2 /> Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────────── */
const favoritCSS = `
    .saved-page-wrapper { font-family: Inter, "Segoe UI", system-ui, sans-serif; background: #fbfaf6; min-height: 100vh; color: #181714; padding-bottom: 80px; }
    
    /* Navbar */
    .nav-bar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(28px, 5vw, 72px); min-height: 72px; border-bottom: 1px solid rgba(24, 23, 20, 0.06); background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(251, 250, 246, 0.9)); box-shadow: 0 14px 34px rgba(35, 34, 29, 0.06); backdrop-filter: blur(18px); }
    .brand-logo { font-size: 20px; font-weight: 900; color: #181714; cursor: pointer; }
    .brand-logo span { color: #efb84f; }
    .nav-links { display: flex; gap: 8px; }
    .nav-btn { min-height: 36px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #6f695e; cursor: pointer; font-size: 13px; font-weight: 700; padding: 8px 16px; transition: all 0.2s; }
    .nav-btn:hover { background: #fff; color: #1f3f2f; border-color: rgba(31, 63, 47, 0.24); }
    .avatar-btn { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; border: 2px solid #fff; background: radial-gradient(circle at 34% 28%, #ffe0a2 0 18%, #efb84f 19% 100%); color: #181714; font-weight: 800; cursor: pointer; box-shadow: 0 12px 28px rgba(181, 122, 21, 0.18); }
    .dropdown-menu { position: absolute; top: 52px; right: 0; min-width: 172px; border: 1px solid rgba(24, 23, 20, 0.1); border-radius: 8px; background: linear-gradient(180deg, #fff, #fbfaf6); box-shadow: 0 20px 44px rgba(24, 23, 20, 0.14); overflow: hidden; }
    .dropdown-item { padding: 13px 16px; font-size: 13px; font-weight: 600; color: #29251f; cursor: pointer; transition: background 0.2s; }
    .dropdown-item:hover { background: #f4efe5; }
    .dropdown-item.active { background: #f4fbf6; color: #1f3f2f; font-weight: 800; }
    .dropdown-item.danger { color: #b42318; }

    /* Toast */
    .toast-notice { position: fixed; top: 90px; right: 24px; z-index: 1100; padding: 14px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #fff; display: flex; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-notice.type-success { background: #1f3f2f; }
    .toast-notice.type-error { background: #b42318; }
    @keyframes slideIn { from{ transform: translateX(100%); opacity: 0; } to{ transform: translateX(0); opacity: 1; } }

    /* Hero Section - Diperbaiki agar tidak overlap */
    .saved-hero { background: linear-gradient(135deg, rgba(31, 63, 47, 0.95), rgba(13, 17, 14, 0.98)), url("https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1800&auto=format&fit=crop"); background-position: center 54%; background-size: cover; background-blend-mode: overlay; display: block; padding: 60px 0; }
    .saved-hero-copy { width: 100%; max-width: 1248px; margin: 0 auto; padding: 0 24px; }
    .hero-kicker { display: inline-flex; background: rgba(239, 184, 79, 0.15); color: #f9d68b; font-size: 12px; font-weight: 850; padding: 8px 14px; border-radius: 999px; margin-bottom: 16px; border: 1px solid rgba(239, 184, 79, 0.3); }
    .saved-hero h1 { margin: 0 0 12px; color: #fff; font-size: clamp(36px, 5vw, 54px); font-weight: 900; letter-spacing: -0.5px; }
    .saved-hero p { max-width: 600px; color: rgba(255, 255, 255, 0.85); font-size: 16px; line-height: 1.6; margin: 0 0 32px; }

    /* Hero Stats */
    .saved-hero-stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat-box { display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); padding: 14px 20px; border-radius: 12px; backdrop-filter: blur(12px); min-width: 180px; }
    .stat-box svg { width: 24px; height: 24px; color: #efb84f; }
    .stat-box strong { font-size: 20px; font-weight: 900; color: #fff; }
    .stat-box span { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.7); display: block; margin-top: 2px; }
    .stat-box div { display: flex; flex-direction: column; }

    /* Main Container - Margin diganti agar tidak overlap */
    .saved-shell { max-width: 1248px; margin: 0 auto; padding: 40px 24px; position: relative; z-index: 10; }

    /* Empty State / Loading */
    .empty-state { text-align: center; padding: 80px 20px; background: #fff; border: 1px dashed rgba(31, 63, 47, 0.2); border-radius: 16px; box-shadow: 0 14px 34px rgba(0,0,0,0.04); }
    .empty-icon { color: #efb84f; margin-bottom: 16px; width: 48px; height: 48px; }
    .empty-state h2 { font-size: 22px; font-weight: 900; color: #181714; margin: 0 0 12px; }
    .empty-state p { color: #756f64; font-size: 15px; margin: 0 0 24px; line-height: 1.6; }
    .btn-primary { background: #1f3f2f; color: #fff; border: none; padding: 12px 28px; border-radius: 999px; font-size: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 12px 24px rgba(31, 63, 47, 0.15); }
    .btn-primary:hover { background: #183326; transform: translateY(-2px); }

    .loading-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 16px; }
    .loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: #1f3f2f; animation: pulse 1s infinite ease-in-out; }
    @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }

    /* Grid Layout & Cards (Reuse from Home/Feed) */
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; }
    
    .ui-card { background: linear-gradient(180deg, #fff 0%, #fff 68%, #fbf7ef 100%); border: 1px solid rgba(24, 23, 20, 0.08); border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 14px 34px rgba(35, 34, 29, 0.05); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
    .ui-card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px rgba(35, 34, 29, 0.11); border-color: rgba(31, 63, 47, 0.24); }
    .card-image { width: 100%; aspect-ratio: 4/3; background: #e9e0d0; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .ui-card:hover .card-image img { transform: scale(1.05); }
    .card-tag { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.92); color: #1f3f2f; font-size: 11.5px; font-weight: 800; padding: 6px 10px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 4px; }
    .card-tag svg { width: 12px; height: 12px; }
    
    .card-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .card-title { font-size: 16px; font-weight: 850; color: #181714; margin: 0; line-height: 1.25; }
    .card-desc { font-size: 12.5px; color: #756f64; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; }
    .card-stats { display: flex; justify-content: space-between; font-size: 12px; font-weight: 750; color: #827b70; align-items: center; }
    .stat-rating { background: #fff4d8; color: #8a5a00; padding: 6px 10px; border-radius: 999px; }
    
    .card-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(24,23,20,0.08); padding-top: 12px; margin-top: auto; }
    .price { font-size: 12px; font-weight: 800; color: #5f574d; }
    
    /* Tombol Hapus Khusus di Favorit */
    .btn-remove-fav { display: flex; align-items: center; gap: 4px; background: #fff0ed; color: #b42318; border: 1px solid rgba(180, 35, 24, 0.2); border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .btn-remove-fav svg { width: 14px; height: 14px; }
    .btn-remove-fav:hover { background: #fde8e4; transform: translateY(-1px); }

    /* Responsive */
    @media (max-width: 768px) {
        .saved-hero-stats { flex-direction: column; }
        .stat-box { width: 100%; }
        .nav-links { display: none; }
        .grid-layout { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    }
    @media (max-width: 640px) {
        .nav-bar { padding: 0 16px; }
        .saved-hero { padding: 40px 0; }
        .saved-hero-copy { padding: 0 16px; }
        .saved-shell { padding: 32px 16px; }
        .grid-layout { grid-template-columns: 1fr; }
    }
`;

export default Favorit;
