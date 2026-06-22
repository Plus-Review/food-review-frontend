import { useEffect, useState } from 'react';
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
const Mail = (props) => <SvgIcon {...props}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></SvgIcon>;

/* ─────────────────────────────────────────────
   FUNGSI HELPER
───────────────────────────────────────────── */
const resolveImageUrl = (image) => {
    if (!image) return '';
    if (String(image).startsWith('http')) return image;
    return `${BASE_URL}/uploads/${image}`;
};

const getAverageRating = (item) => {
    const reviews = item.reviews || [];
    if (reviews.length === 0) return 0;
    return (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1);
};

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Profile = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('ulasan'); 
    
    const [userInfo, setUserInfo] = useState({ id: null, nama: 'Memuat...', email: 'Memuat...' });
    const [userReviews, setUserReviews] = useState([]);
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
                // 1. Ambil Data Profil User Asli dari Backend
                let currentUserId = null;
                try {
                    const profileRes = await apiClient.get('/auth/profile');
                    const user = profileRes.data.user;
                    currentUserId = user.id;
                    setUserInfo({
                        id: user.id,
                        nama: user.username || user.nama || localStorage.getItem('userName') || 'Mahasiswa',
                        email: user.email || localStorage.getItem('userEmail') || 'email@mahasiswa.com',
                    });
                } catch {
                    // Fallback jika /auth/profile gagal, decode token
                    const base64Url = token.split('.')[1];
                    const decodedToken = JSON.parse(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
                    currentUserId = decodedToken.userId || decodedToken.id;
                    setUserInfo({
                        id: currentUserId,
                        nama: localStorage.getItem('userName') || 'Mahasiswa (Kamu)',
                        email: localStorage.getItem('userEmail') || 'user@mahasiswa.com',
                    });
                }

                // 2. Tarik Daftar Semua UMKM & Filter Ulasan Milik User
                const umkmRes = await apiClient.get('/umkm');
                const semuaUmkm = umkmRes.data;
                let ulasanku = [];

                semuaUmkm.forEach(umkm => {
                    if (umkm.reviews && umkm.reviews.length > 0) {
                        const myReviewsInThisUmkm = umkm.reviews.filter(rev => Number(rev.userId) === Number(currentUserId) || Number(rev.user_id) === Number(currentUserId));
                        myReviewsInThisUmkm.forEach(rev => {
                            ulasanku.push({
                                ...rev,
                                umkm_id: umkm.id,
                                nama_umkm: umkm.nama_umkm,
                                umkm_image: umkm.image,
                                kategori: umkm.kategori || umkm.jenis_makanan || 'Kuliner'
                            });
                        });
                    }
                });
                ulasanku.sort((a, b) => b.id - a.id);
                setUserReviews(ulasanku);

                // 3. Tarik Daftar UMKM Favorit MySQL
                try {
                    const favRes = await apiClient.get('/favorit/me');
                    const warungFavoritku = favRes.data.map(fav => {
                        const detailWarung = fav.umkmDetail || fav.Umkm || fav; 
                        return {
                            ...detailWarung,
                            id: detailWarung.id,
                            nama_umkm: detailWarung.nama_umkm,
                            image: detailWarung.image,
                            kategori: detailWarung.kategori || detailWarung.jenis_makanan || detailWarung.jenis || 'Umum',
                            harga_range: detailWarung.harga_range || 'Harga belum tersedia',
                            deskripsi: detailWarung.deskripsi || detailWarung.alamat_teks || 'Deskripsi belum tersedia.',
                            reviews: detailWarung.reviews || []
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
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/login');
    };

    const userInitial = String(userInfo.nama).charAt(0).toUpperCase();

    return (
        <div className="profile-dashboard-wrapper">
            <style dangerouslySetInnerHTML={{ __html: profileCSS }} />

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
                                <div className="dropdown-item active" onClick={() => setShowDropdown(false)}>Profil Saya</div>
                                <div className="dropdown-item" onClick={() => navigate('/favorit')}>Favorit</div>
                                <div className="dropdown-item danger" onClick={handleLogout}>Logout</div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HERO PROFILE ── */}
            <header className="profile-hero">
                <div className="profile-hero-content">
                    <div className="profile-avatar-large">
                        {userInitial}
                    </div>
                    <div className="profile-info-text">
                        <h1>{userInfo.nama}</h1>
                        <p><Mail /> {userInfo.email}</p>
                        <div className="profile-badges">
                            <span className="badge-highlight"><MessageCircle /> {userReviews.length} Ulasan ditulis</span>
                            <span className="badge-normal"><Bookmark /> {userFavorites.length} Warung disimpan</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT & TABS ── */}
            <main className="profile-container">
                
                {/* Custom Tabs */}
                <div className="profile-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'ulasan' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('ulasan')}
                    >
                        <MessageCircle /> Ulasan Saya
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'favorit' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('favorit')}
                    >
                        <Bookmark /> Warung Favorit
                    </button>
                </div>

                <div className="tab-content-area">
                    {isLoading ? (
                        <div className="state-box">
                            <div className="loading-dots">
                                <span style={{ animationDelay: '0s' }} />
                                <span style={{ animationDelay: '0.15s' }} />
                                <span style={{ animationDelay: '0.3s' }} />
                            </div>
                            <p>Menyiapkan data profilmu...</p>
                        </div>
                    ) : activeTab === 'ulasan' ? (
                        
                        /* KONTEN TAB: ULASAN SAYA */
                        userReviews.length > 0 ? (
                            <div className="review-list">
                                {userReviews.map((rev, index) => (
                                    <div key={index} className="review-card">
                                        <div className="review-umkm-link" onClick={() => navigate(`/umkm/${rev.umkm_id}`)}>
                                            <img 
                                                src={resolveImageUrl(rev.umkm_image) || FALLBACK_IMAGE} 
                                                alt="umkm" 
                                            />
                                            <div className="review-umkm-meta">
                                                <h4>{rev.nama_umkm}</h4>
                                                <span>{rev.kategori}</span>
                                            </div>
                                            <div className="review-rating-badge">
                                                <Star /> {rev.rating || 0}.0
                                            </div>
                                        </div>
                                        <div className="review-comment-box">
                                            <p>"{rev.komentar || rev.comment}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="state-box empty">
                                <MessageCircle size={48} className="empty-icon" />
                                <h3>Belum ada ulasan</h3>
                                <p>Bagikan pengalaman kulinermu untuk membantu mahasiswa lain!</p>
                                <button className="btn-primary" onClick={() => navigate('/')}>Mulai Review Warung</button>
                            </div>
                        )

                    ) : (

                        /* KONTEN TAB: WARUNG FAVORIT */
                        userFavorites.length > 0 ? (
                            <div className="grid-layout">
                                {userFavorites.map(item => (
                                    <div className="ui-card" key={item.id} onClick={() => navigate(`/umkm/${item.id}`)}>
                                        <div className="card-image">
                                            <img src={resolveImageUrl(item.image) || FALLBACK_IMAGE} alt={item.nama_umkm} />
                                            <span className="card-tag">{item.kategori}</span>
                                        </div>
                                        <div className="card-content">
                                            <h3 className="card-title">{item.nama_umkm}</h3>
                                            <p className="card-desc">{item.deskripsi}</p>
                                            <div className="card-stats">
                                                <span className="stat-rating">⭐ {getAverageRating(item)}</span>
                                                <span className="stat-review">{item.reviews?.length || 0} ulasan</span>
                                            </div>
                                            <div className="card-foot">
                                                <span className="price">{item.harga_range}</span>
                                                <strong className="link">Lihat detail</strong>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="state-box empty">
                                <Bookmark size={48} className="empty-icon" />
                                <h3>Belum ada warung favorit</h3>
                                <p>Simpan warung favoritmu di sini agar mudah dicari kembali.</p>
                                <button className="btn-primary" onClick={() => navigate('/')}>Cari Warung Favorit</button>
                            </div>
                        )

                    )}
                </div>
            </main>
        </div>
    );
};

/* ─────────────────────────────────────────────
   CSS INJECTION (Premium Design)
───────────────────────────────────────────── */
const profileCSS = `
    .profile-dashboard-wrapper { font-family: Inter, "Segoe UI", system-ui, sans-serif; background: #fbfaf6; min-height: 100vh; color: #181714; padding-bottom: 80px; }
    
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

    /* Hero Profile */
    .profile-hero { background: linear-gradient(135deg, #1f3f2f, #0d110e); padding: 60px 24px; color: #fff; position: relative; overflow: hidden; }
    .profile-hero::after { content: ''; position: absolute; top: -50%; right: -10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(239, 184, 79, 0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
    .profile-hero-content { max-width: 1000px; margin: 0 auto; display: flex; align-items: center; gap: 32px; position: relative; z-index: 1; }
    .profile-avatar-large { width: 110px; height: 110px; border-radius: 50%; background: linear-gradient(135deg, #efb84f, #d49826); color: #181714; font-size: 48px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 4px solid rgba(255,255,255,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.3); flex-shrink: 0; }
    .profile-info-text { display: flex; flex-direction: column; gap: 8px; }
    .profile-info-text h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px; }
    .profile-info-text p { margin: 0; color: rgba(255,255,255,0.8); font-size: 15px; display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .profile-info-text p svg { width: 16px; height: 16px; opacity: 0.8; }
    .profile-badges { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
    .profile-badges span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .profile-badges svg { width: 14px; height: 14px; }
    .badge-highlight { background: #efb84f; color: #181714; }
    .badge-normal { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px); }

    /* Main Container & Tabs */
    .profile-container { max-width: 1000px; margin: 0 auto; padding: 40px 24px; }
    
    .profile-tabs { display: flex; gap: 12px; border-bottom: 2px solid rgba(31,63,47,0.1); padding-bottom: 16px; margin-bottom: 32px; overflow-x: auto; scrollbar-width: none; }
    .profile-tabs::-webkit-scrollbar { display: none; }
    .tab-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: none; padding: 10px 20px; font-size: 15px; font-weight: 700; color: #756f64; cursor: pointer; border-radius: 999px; transition: 0.2s; white-space: nowrap; font-family: inherit; }
    .tab-btn svg { width: 18px; height: 18px; opacity: 0.7; }
    .tab-btn:hover { background: rgba(31,63,47,0.05); color: #1f3f2f; }
    .tab-btn.active { background: #1f3f2f; color: #fff; box-shadow: 0 8px 20px rgba(31,63,47,0.15); }
    .tab-btn.active svg { opacity: 1; color: #efb84f; }

    /* Review List Layout */
    .review-list { display: flex; flex-direction: column; gap: 20px; }
    .review-card { background: #fff; border: 1px solid rgba(24, 23, 20, 0.08); border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(35, 34, 29, 0.03); transition: 0.2s; }
    .review-card:hover { border-color: rgba(31,63,47,0.2); box-shadow: 0 14px 40px rgba(35, 34, 29, 0.06); }
    
    .review-umkm-link { display: flex; align-items: center; gap: 16px; background: #fbfaf6; padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
    .review-umkm-link:hover { background: #fff; border-color: rgba(31,63,47,0.15); transform: translateY(-2px); }
    .review-umkm-link img { width: 54px; height: 54px; border-radius: 8px; object-fit: cover; }
    .review-umkm-meta { flex: 1; }
    .review-umkm-meta h4 { margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #181714; }
    .review-umkm-meta span { font-size: 12.5px; font-weight: 600; color: #756f64; }
    .review-rating-badge { display: flex; align-items: center; gap: 4px; background: #fff4d8; color: #8a5a00; padding: 6px 10px; border-radius: 8px; font-size: 13px; font-weight: 800; }
    .review-rating-badge svg { width: 14px; height: 14px; }
    
    .review-comment-box { margin-top: 16px; padding: 0 8px; border-left: 3px solid #efb84f; }
    .review-comment-box p { margin: 0; font-size: 15px; color: #444; line-height: 1.6; font-style: italic; }

    /* Grid Layout & Cards (For Favorites) */
    .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .ui-card { background: linear-gradient(180deg, #fff 0%, #fff 68%, #fbf7ef 100%); border: 1px solid rgba(24, 23, 20, 0.08); border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 14px 34px rgba(35, 34, 29, 0.05); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
    .ui-card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px rgba(35, 34, 29, 0.11); border-color: rgba(31, 63, 47, 0.24); }
    .card-image { width: 100%; aspect-ratio: 4/3; background: #e9e0d0; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .ui-card:hover .card-image img { transform: scale(1.05); }
    .card-tag { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,0.92); color: #1f3f2f; font-size: 11.5px; font-weight: 800; padding: 6px 10px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .card-content { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .card-title { font-size: 16px; font-weight: 850; color: #181714; margin: 0; line-height: 1.25; }
    .card-desc { font-size: 12.5px; color: #756f64; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; }
    .card-stats { display: flex; justify-content: space-between; font-size: 12px; font-weight: 750; color: #827b70; align-items: center; }
    .stat-rating { background: #fff4d8; color: #8a5a00; padding: 6px 10px; border-radius: 999px; }
    .card-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(24,23,20,0.08); padding-top: 12px; margin-top: auto; }
    .price { font-size: 12px; font-weight: 800; color: #5f574d; }
    .link { font-size: 12px; font-weight: 900; color: #1f3f2f; transition: color 0.2s; }
    .ui-card:hover .link { color: #8a5a00; }

    /* State Boxes (Loading/Empty) */
    .state-box { text-align: center; padding: 60px 20px; background: #fff; border: 1px dashed rgba(31, 63, 47, 0.15); border-radius: 16px; color: #181714; }
    .state-box.empty { background: rgba(31, 63, 47, 0.02); border-style: solid; border-color: rgba(24,23,20,0.06); }
    .empty-icon { color: #efb84f; margin-bottom: 16px; }
    .state-box h3 { font-size: 20px; font-weight: 900; margin: 0 0 8px; }
    .state-box p { color: #756f64; font-size: 14px; margin: 0 0 20px; line-height: 1.5; }
    .btn-primary { background: #1f3f2f; color: #fff; border: none; padding: 12px 24px; border-radius: 999px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px rgba(31, 63, 47, 0.15); font-family: inherit; }
    .btn-primary:hover { background: #183326; transform: translateY(-2px); }

    .loading-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 16px; }
    .loading-dots span { width: 10px; height: 10px; border-radius: 50%; background: #1f3f2f; animation: pulse 1s infinite ease-in-out; }
    @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }

    /* Responsive */
    @media (max-width: 768px) {
        .profile-hero-content { flex-direction: column; text-align: center; gap: 20px; }
        .profile-badges { justify-content: center; }
        .nav-links { display: none; }
        .profile-tabs { justify-content: center; }
    }
    @media (max-width: 640px) {
        .nav-bar { padding: 0 16px; }
        .profile-hero { padding: 40px 16px; }
        .profile-container { padding: 24px 16px; }
        .grid-layout { grid-template-columns: 1fr; }
        .review-umkm-link { flex-direction: column; align-items: flex-start; gap: 12px; }
        .review-rating-badge { align-self: flex-start; }
    }
`;

export default Profile;
