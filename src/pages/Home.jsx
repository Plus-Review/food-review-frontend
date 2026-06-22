import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = 'http://localhost:5000';
const EARTH_RADIUS_KM = 6371;

/* ─────────────────────────────────────────────
   DATA STATIS KATEGORI
───────────────────────────────────────────── */
const KATEGORI = [
    { label: 'Semua', emoji: '🍽️', keyword: '' },
    { label: 'Makanan Berat', emoji: '🍛', keyword: 'Makanan Berat' },
    { label: 'Cepat Saji', emoji: '🍔', keyword: 'Cepat Saji' },
    { label: 'Minuman', emoji: '🧋', keyword: 'Minuman' },
    { label: 'Snack', emoji: '🍿', keyword: 'Snack' },
    { label: 'Mie', emoji: '🍜', keyword: 'Mie' },
];

/* ─────────────────────────────────────────────
   IKON SVG MURNI
───────────────────────────────────────────── */
const IconLogin = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const IconX = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconCompass = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);

const IconMapPin = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const IconLocate = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <circle cx="12" cy="12" r="7" />
    </svg>
);

/* ─────────────────────────────────────────────
   FUNGSI HELPER
───────────────────────────────────────────── */
const getReviews = (item) => {
    if (Array.isArray(item?.reviews)) return item.reviews;
    if (Array.isArray(item?.Reviews)) return item.Reviews;
    return [];
};

const getAverageRating = (item) => {
    const reviews = getReviews(item);
    if (reviews.length === 0) return 0;

    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
};

const getImagePath = (item) => {
    const image = String(item?.image || '').trim();

    if (!image) {
        return 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop';
    }

    return image.startsWith('http') ? image : `${BASE_URL}/uploads/${image}`;
};

const getDistanceKm = (position, item) => {
    if (!position) return Infinity;

    const lat1 = Number(position.latitude);
    const lon1 = Number(position.longitude);
    const lat2 = Number(item?.latitude);
    const lon2 = Number(item?.longitude);

    if (!Number.isFinite(lat1) || !Number.isFinite(lon1)) return Infinity;
    if (!Number.isFinite(lat2) || !Number.isFinite(lon2)) return Infinity;
    if (lat2 === 0 && lon2 === 0) return Infinity;

    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
};

const formatDistance = (distanceKm) => {
    if (!Number.isFinite(distanceKm)) return 'Jarak belum ada';
    if (distanceKm < 1) return `${Math.max(1, Math.round(distanceKm * 1000))}m`;
    return `${distanceKm.toFixed(1)}km`;
};

const getCachedUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
};

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const Home = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));

    const [showDropdown, setShowDropdown] = useState(false);
    const [umkmList, setUmkmList] = useState([]);
    const [favoriteList, setFavoriteList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeKategori, setActiveKategori] = useState('Semua');
    const [currentUser, setCurrentUser] = useState(() => getCachedUser());
    const [loginNotice, setLoginNotice] = useState(null);

    useEffect(() => {
        let ignore = false;

        const fetchData = async () => {
            try {
                const response = await apiClient.get('/umkm');

                if (!ignore) {
                    setUmkmList(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                console.error('Gagal mengambil data UMKM:', error);

                if (!ignore) {
                    setUmkmList([]);
                }
            }
        };

        fetchData();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setFavoriteList([]);
            return undefined;
        }

        let ignore = false;

        const fetchUserData = async () => {
            try {
                const profileResponse = await apiClient.get('/auth/profile');

                if (!ignore) {
                    setCurrentUser(profileResponse.data.user);
                    localStorage.setItem('user', JSON.stringify(profileResponse.data.user));
                }
            } catch {
                // Jika profile gagal, data lokal tetap dipakai.
            }

            try {
                const favoriteResponse = await apiClient.get('/favorit/me');

                if (!ignore) {
                    const favoriteItems = Array.isArray(favoriteResponse.data)
                        ? favoriteResponse.data.map((fav) => fav.umkmDetail || fav.Umkm || fav)
                        : [];

                    setFavoriteList(favoriteItems.filter(Boolean));
                }
            } catch {
                if (!ignore) setFavoriteList([]);
            }
        };

        fetchUserData();

        return () => {
            ignore = true;
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!loginNotice) return undefined;

        const timeout = window.setTimeout(() => {
            setLoginNotice(null);
        }, 5000);

        return () => window.clearTimeout(timeout);
    }, [loginNotice]);

    const filteredUmkm = useMemo(() => {
        return umkmList
            .filter((item) => {
                if (activeKategori === 'Semua') return true;

                return item.kategori === activeKategori || item.jenis_makanan === activeKategori;
            })
            .slice(0, 6);
    }, [umkmList, activeKategori]);

    const popularUmkm = useMemo(() => {
        return [...umkmList]
            .sort((a, b) => getAverageRating(b) - getAverageRating(a))
            .slice(0, 6);
    }, [umkmList]);

    const newestUmkm = useMemo(() => {
        return [...umkmList]
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();

                return dateB - dateA;
            })
            .slice(0, 6);
    }, [umkmList]);

    useEffect(() => {
        const revealSelectors = [
            '.category-row',
            '.dashboard-split',
            '.section-head',
            '.ui-card',
            '.side-panel',
            '.cta-banner',
        ];

        const elements = Array.from(document.querySelectorAll(revealSelectors.join(',')));

        if (!elements.length) return undefined;

        if (!('IntersectionObserver' in window)) {
            elements.forEach((element) => {
                element.classList.add('reveal-on-scroll', 'is-visible');
            });

            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -45px 0px',
            }
        );

        elements.forEach((element, index) => {
            element.classList.add('reveal-on-scroll');

            const delay = Math.min((index % 6) * 45, 225);
            element.style.setProperty('--reveal-delay', `${delay}ms`);

            if (!element.classList.contains('is-visible')) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [
        umkmList.length,
        filteredUmkm.length,
        popularUmkm.length,
        newestUmkm.length,
        favoriteList.length,
        activeKategori,
    ]);

    const showLoginNotice = useCallback((feature) => {
        setLoginNotice({
            title: 'Login Diperlukan',
            message: `Silakan masuk ke akunmu untuk ${feature}.`,
        });
    }, []);

    const guardedNavigate = useCallback((target, feature) => {
        if (!isLoggedIn) {
            showLoginNotice(feature);
            return;
        }

        navigate(target);
    }, [isLoggedIn, navigate, showLoginNotice]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setShowDropdown(false);
        navigate('/login');
    }, [navigate]);

    const navigateToFeed = useCallback((sortType) => {
        navigate('/feed', { state: { defaultSort: sortType } });
    }, [navigate]);

    const handleSearch = useCallback((event) => {
        event.preventDefault();

        const keyword = searchTerm.trim();

        if (keyword) {
            navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
        }
    }, [navigate, searchTerm]);

    return (
        <div className="home-page-container">
            <style dangerouslySetInnerHTML={{ __html: injectedCSS }} />

            {loginNotice && (
                <div className="login-notice-float">
                    <span className="notice-icon">
                        <IconLogin />
                    </span>

                    <div className="notice-copy">
                        <strong>{loginNotice.title}</strong>
                        <span>{loginNotice.message}</span>
                    </div>

                    <button className="notice-action" type="button" onClick={() => navigate('/login')}>
                        Masuk
                    </button>

                    <button className="notice-close" type="button" onClick={() => setLoginNotice(null)} aria-label="Tutup notifikasi">
                        <IconX />
                    </button>
                </div>
            )}

            <nav className="nav-bar">
                <div className="brand-logo" onClick={() => navigate('/')}>
                    Plus<span>Review</span>
                </div>

                <div className="nav-links">
                    <button className="nav-btn active" type="button" onClick={() => navigate('/')}>
                        Beranda
                    </button>

                    <button className="nav-btn" type="button" onClick={() => navigateToFeed('terbaru_ditambahkan')}>
                        Feed
                    </button>

                    <button className="nav-btn" type="button" onClick={() => guardedNavigate('/tambah', 'menambahkan UMKM')}>
                        Tambah UMKM
                    </button>
                </div>

                <div className="nav-account">
                    {isLoggedIn ? (
                        <div style={{ position: 'relative' }}>
                            <div className="avatar-btn" onClick={() => setShowDropdown((current) => !current)}>
                                {(currentUser?.name || currentUser?.username || localStorage.getItem('userName') || 'M').charAt(0).toUpperCase()}
                            </div>

                            {showDropdown && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={() => navigate('/profil')}>
                                        Profil Saya
                                    </div>

                                    <div className="dropdown-item" onClick={() => navigate('/favorit')}>
                                        Favorit
                                    </div>

                                    <div className="dropdown-item danger" onClick={handleLogout}>
                                        Logout
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="btn-login" type="button" onClick={() => navigate('/login')}>
                            Login
                        </button>
                    )}
                </div>
            </nav>

            <header className="hero-section">
                <div className="hero-eyebrow">📍&nbsp; Parepare, Sulawesi Selatan</div>

                <h1 className="hero-title">
                    Temukan warung favoritmu<br />
                    di <span>sekitar kampus</span>
                </h1>

                <p className="hero-desc">
                    Review jujur, rating transparan, dan rekomendasi kuliner dari sesama mahasiswa.
                </p>

                <form className="search-wrapper" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Cari warung, makanan, atau kategori..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />

                    <button type="submit" className="btn-search">
                        Cari
                    </button>
                </form>
            </header>

            <div className="category-row">
                {KATEGORI.map((kategori) => (
                    <button
                        key={kategori.label}
                        className={`cat-chip ${activeKategori === kategori.label ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => setActiveKategori(kategori.label)}
                    >
                        <span className="cat-emoji">{kategori.emoji}</span>
                        <span className="cat-label">{kategori.label}</span>
                    </button>
                ))}
            </div>

            <main className="main-layout">
                <div className="dashboard-split">
                    <div className="col-main">
                        <div className="section-head">
                            <h2>Semua UMKM</h2>

                            <button type="button" onClick={() => navigateToFeed('terbaru_ditambahkan')}>
                                Lihat semua →
                            </button>
                        </div>

                        <div className="scroll-layout">
                            {filteredUmkm.length > 0 ? (
                                filteredUmkm.map((item) => (
                                    <UmkmCard key={item.id} item={item} navigate={navigate} />
                                ))
                            ) : (
                                <div className="empty-box">
                                    UMKM dengan kriteria tersebut belum tersedia.
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="col-side">
                        <div className="side-panel">
                            <div className="panel-header">
                                <span>UMKM Favorit</span>
                                <strong>{isLoggedIn ? `${favoriteList.length} warung disimpan` : 'Masuk untuk melihat'}</strong>
                            </div>

                            {isLoggedIn && favoriteList.length > 0 ? (
                                <div className="panel-list">
                                    {favoriteList.slice(0, 3).map((item) => (
                                        <div key={item.id} className="panel-item" onClick={() => navigate(`/umkm/${item.id}`)}>
                                            <img
                                                src={getImagePath(item)}
                                                alt={item.nama_umkm || 'Foto UMKM favorit'}
                                                loading="lazy"
                                                decoding="async"
                                            />

                                            <div>
                                                <strong>{item.nama_umkm}</strong>
                                                <span>{item.kategori || item.jenis_makanan || 'Kuliner'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="panel-empty">
                                    <strong>{isLoggedIn ? 'Belum ada warung favorit' : 'Akun belum masuk'}</strong>
                                </div>
                            )}

                            <button
                                className="btn-action-dark"
                                type="button"
                                onClick={() => (isLoggedIn ? navigate('/favorit') : showLoginNotice('melihat favorit'))}
                            >
                                {isLoggedIn ? 'Lihat Semua Favorit' : 'Login untuk Kelola'}
                            </button>
                        </div>

                        <NearbyPanel
                            allItems={umkmList}
                            isLoggedIn={isLoggedIn}
                            navigate={navigate}
                            onRequireLogin={showLoginNotice}
                        />
                    </aside>
                </div>

                <div className="cta-banner">
                    <div>
                        <h3>Punya warung favorit?</h3>
                        <p>Daftarkan UMKM-mu dan bantu mahasiswa lain menemukan tempat makan terbaik.</p>
                    </div>

                    <button type="button" onClick={() => guardedNavigate('/tambah', 'menambahkan UMKM')}>
                        Tambahkan sekarang →
                    </button>
                </div>

                <div className="section-head">
                    <h2>Rekomendasi Terpopuler</h2>

                    <button type="button" onClick={() => navigateToFeed('bintang_tertinggi')}>
                        Paling dicari →
                    </button>
                </div>

                <div className="scroll-layout">
                    {popularUmkm.map((item) => (
                        <UmkmCard key={`${item.id}-pop`} item={item} navigate={navigate} />
                    ))}
                </div>

                <div className="section-head section-head-spaced">
                    <h2>Baru Ditambahkan</h2>

                    <button type="button" onClick={() => navigateToFeed('review_terbaru')}>
                        Lihat feed →
                    </button>
                </div>

                <div className="scroll-layout">
                    {newestUmkm.map((item) => (
                        <UmkmCard key={`${item.id}-new`} item={item} navigate={navigate} />
                    ))}
                </div>
            </main>
        </div>
    );
};

/* ─────────────────────────────────────────────
   KOMPONEN CARD
───────────────────────────────────────────── */
const UmkmCard = React.memo(({ item, navigate }) => {
    const avgRating = getAverageRating(item).toFixed(1);
    const reviewsCount = getReviews(item).length;

    return (
        <article className="ui-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="card-image">
                <img
                    src={getImagePath(item)}
                    alt={item.nama_umkm || 'Foto UMKM'}
                    loading="lazy"
                    decoding="async"
                />

                <span className="card-tag">
                    {item.kategori || item.jenis_makanan || 'Kuliner'}
                </span>
            </div>

            <div className="card-content">
                <h3 className="card-title">{item.nama_umkm}</h3>

                <p className="card-desc">
                    {item.deskripsi || item.alamat_teks || 'Deskripsi belum tersedia.'}
                </p>

                <div className="card-stats">
                    <span className="stat-rating">⭐ {avgRating}</span>
                    <span className="stat-review">{reviewsCount} ulasan</span>
                </div>

                <div className="card-foot">
                    <span className="price">{item.harga_range || 'Harga belum diatur'}</span>
                    <strong className="link">Lihat detail</strong>
                </div>
            </div>
        </article>
    );
});

/* ─────────────────────────────────────────────
   KOMPONEN UMKM TERDEKAT
───────────────────────────────────────────── */
const NearbyPanel = React.memo(({ allItems, isLoggedIn, navigate, onRequireLogin }) => {
    const [pos, setPos] = useState(null);
    const [loading, setLoading] = useState(false);

    const getGPS = useCallback(() => {
        if (!isLoggedIn) {
            onRequireLogin('menggunakan fitur GPS');
            return;
        }

        if (!navigator.geolocation) {
            onRequireLogin('menggunakan GPS di browser yang mendukung lokasi');
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setPos({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLoading(false);
            },
            () => {
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 60000,
            }
        );
    }, [isLoggedIn, onRequireLogin]);

    const results = useMemo(() => {
        if (!pos) return [];

        return allItems
            .filter((item) => Number(item.latitude) && Number(item.longitude))
            .map((item) => ({
                item,
                dist: getDistanceKm(pos, item),
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);
    }, [allItems, pos]);

    return (
        <div className="side-panel alt-panel">
            <div className="panel-header with-icon">
                <div className="icon-wrap">
                    <IconCompass />
                </div>

                <div>
                    <strong>Dekat posisimu</strong>
                    <span>Berdasarkan radius GPS.</span>
                </div>
            </div>

            {!pos ? (
                <button className="btn-gps" type="button" onClick={getGPS}>
                    <IconLocate />
                    {loading ? 'Membaca lokasi...' : 'Aktifkan GPS'}
                </button>
            ) : (
                <div className="panel-list">
                    {results.length > 0 ? (
                        results.map(({ item, dist }) => (
                            <div key={item.id} className="panel-item" onClick={() => navigate(`/umkm/${item.id}`)}>
                                <img
                                    src={getImagePath(item)}
                                    alt={item.nama_umkm || 'Foto UMKM terdekat'}
                                    loading="lazy"
                                    decoding="async"
                                />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <strong>{item.nama_umkm}</strong>
                                    <span>{item.kategori || item.jenis_makanan || 'Kuliner'}</span>
                                </div>

                                <em className="dist-tag">
                                    <IconMapPin />
                                    {formatDistance(dist)}
                                </em>
                            </div>
                        ))
                    ) : (
                        <div className="panel-empty">
                            Tidak ada hasil dekat.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

/* ─────────────────────────────────────────────
   CSS INJECTION
───────────────────────────────────────────── */
const injectedCSS = `
    :root {
        --green: #1f3f2f;
        --green-2: #2f6047;
        --green-dark: #102417;
        --cream: #fbfaf6;
        --cream-2: #f5efe4;
        --gold: #efb84f;
        --gold-soft: #fff4d8;
        --text: #181714;
        --muted: #756f64;
        --line: rgba(24, 23, 20, 0.1);
        --shadow-sm: 0 8px 22px rgba(24, 23, 20, 0.08);
        --shadow-md: 0 16px 38px rgba(24, 23, 20, 0.12);
        --radius-xl: 28px;
        --radius-lg: 22px;
        --radius-md: 16px;
    }

    * {
        box-sizing: border-box;
    }

    html,
    body {
        margin: 0;
        overflow-x: hidden;
        background: var(--cream);
        color-scheme: light;
    }

    button,
    input {
        font: inherit;
    }

    button {
        -webkit-tap-highlight-color: transparent;
    }

    .home-page-container {
        min-height: 100vh;
        overflow-x: hidden;
        background:
            radial-gradient(circle at 10% 0%, rgba(239, 184, 79, 0.14), transparent 24%),
            radial-gradient(circle at 90% 12%, rgba(31, 63, 47, 0.1), transparent 28%),
            linear-gradient(180deg, #fffaf0 0%, var(--cream) 38%, #f6efe5 100%);
        color: var(--text);
        font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    @keyframes fadeUp {
        from {
            opacity: 0;
            transform: translateY(14px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes softFade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes shineMove {
        from {
            transform: translateX(-140%) skewX(-12deg);
        }
        to {
            transform: translateX(140%) skewX(-12deg);
        }
    }

    /* =========================
       LOGIN NOTICE
    ========================= */

    .login-notice-float {
        position: fixed;
        top: 88px;
        right: clamp(14px, 3vw, 34px);
        z-index: 1200;
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) auto 34px;
        align-items: center;
        gap: 10px;
        width: min(100% - 28px, 500px);
        border: 1px solid rgba(31, 63, 47, 0.16);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: var(--shadow-md);
        padding: 12px;
        animation: slideDown 0.25s ease both;
    }

    .notice-icon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
    }

    .notice-copy {
        min-width: 0;
    }

    .notice-copy strong {
        display: block;
        color: var(--text);
        font-size: 14px;
        font-weight: 900;
        line-height: 1.2;
    }

    .notice-copy span {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 12.5px;
        font-weight: 650;
        line-height: 1.4;
    }

    .notice-action {
        min-height: 36px;
        border: 0;
        border-radius: 999px;
        background: var(--green);
        color: #fff;
        cursor: pointer;
        font-size: 12.5px;
        font-weight: 850;
        padding: 8px 14px;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .notice-action:hover {
        transform: translateY(-2px);
        background: var(--green-2);
    }

    .notice-close {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 50%;
        background: rgba(24, 23, 20, 0.06);
        color: var(--text);
        cursor: pointer;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .notice-close:hover {
        transform: rotate(90deg);
        background: rgba(24, 23, 20, 0.1);
    }

    /* =========================
       NAVBAR
    ========================= */

    .nav-bar {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 22px;
        min-height: 74px;
        padding: 0 clamp(18px, 5vw, 70px);
        border-bottom: 1px solid rgba(24, 23, 20, 0.06);
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 8px 24px rgba(35, 34, 29, 0.06);
    }

    .brand-logo {
        position: relative;
        color: var(--text);
        cursor: pointer;
        font-size: 22px;
        font-weight: 950;
        letter-spacing: -0.04em;
        white-space: nowrap;
    }

    .brand-logo span {
        color: var(--gold);
    }

    .brand-logo::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -7px;
        width: 42px;
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--gold), transparent);
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .nav-btn {
        min-height: 38px;
        border: 1px solid transparent;
        border-radius: 999px;
        background: transparent;
        color: #6f695e;
        cursor: pointer;
        font-size: 13px;
        font-weight: 760;
        padding: 9px 16px;
        transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
    }

    .nav-btn:hover {
        transform: translateY(-2px);
        border-color: rgba(31, 63, 47, 0.16);
        background: #fff;
        color: var(--green);
    }

    .nav-btn.active {
        border-color: transparent;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
        box-shadow: 0 10px 24px rgba(31, 63, 47, 0.18);
    }

    .btn-login {
        min-height: 42px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, #181714, #393227);
        color: #fff;
        cursor: pointer;
        font-weight: 900;
        padding: 10px 20px;
        transition: transform 0.18s ease;
    }

    .btn-login:hover {
        transform: translateY(-2px);
    }

    .avatar-btn {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 3px solid #fff;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--gold), #ffcf72);
        color: var(--text);
        cursor: pointer;
        font-weight: 950;
        box-shadow: 0 10px 24px rgba(181, 122, 21, 0.18);
        transition: transform 0.18s ease;
    }

    .avatar-btn:hover {
        transform: translateY(-2px) scale(1.03);
    }

    .dropdown-menu {
        position: absolute;
        top: 56px;
        right: 0;
        min-width: 182px;
        overflow: hidden;
        border: 1px solid rgba(24, 23, 20, 0.1);
        border-radius: 16px;
        background: #fff;
        box-shadow: var(--shadow-md);
        animation: slideDown 0.2s ease both;
    }

    .dropdown-item {
        padding: 13px 16px;
        color: #29251f;
        cursor: pointer;
        font-size: 13px;
        font-weight: 750;
        transition: background 0.16s ease, color 0.16s ease;
    }

    .dropdown-item:hover {
        background: var(--gold-soft);
        color: var(--green);
    }

    .dropdown-item.danger {
        color: #b42318;
    }

    .dropdown-item.danger:hover {
        background: #fff0ef;
    }

    /* =========================
       HERO
    ========================= */

    .hero-section {
        position: relative;
        isolation: isolate;
        min-height: clamp(520px, 72vh, 720px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: clamp(72px, 9vw, 112px) clamp(18px, 4vw, 42px) clamp(110px, 12vw, 154px);
        text-align: center;
        background: var(--cream);
    }

    .hero-section::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -3;
        background-image: url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=85&w=1800&auto=format&fit=crop');
        background-size: cover;
        background-position: center;
        animation: softFade 0.5s ease both;
    }

    .hero-section::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
            linear-gradient(115deg, rgba(5, 18, 12, 0.92) 0%, rgba(31, 63, 47, 0.72) 48%, rgba(13, 17, 14, 0.84) 100%),
            linear-gradient(180deg, rgba(251, 250, 246, 0) 0%, rgba(251, 250, 246, 0) 62%, rgba(251, 250, 246, 0.62) 86%, var(--cream) 100%);
    }

    .hero-section > * {
        position: relative;
        z-index: 1;
        animation: fadeUp 0.5s ease both;
    }

    .hero-eyebrow {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(249, 214, 139, 0.36);
        border-radius: 999px;
        background: rgba(255, 248, 232, 0.16);
        color: #ffe5a8;
        font-size: 12.5px;
        font-weight: 900;
        padding: 9px 14px;
    }

    .hero-title {
        max-width: 960px;
        margin: 24px 0 0;
        color: #fff;
        font-size: clamp(40px, 7vw, 78px);
        font-weight: 950;
        letter-spacing: -0.065em;
        line-height: 0.98;
        text-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
    }

    .hero-title span {
        color: var(--gold);
    }

    .hero-desc {
        max-width: 660px;
        margin: 22px 0 0;
        color: rgba(255, 255, 255, 0.82);
        font-size: clamp(15px, 1.55vw, 18px);
        font-weight: 650;
        line-height: 1.75;
    }

    .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        width: min(100%, 650px);
        margin-top: 30px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
        padding: 8px;
    }

    .search-wrapper input {
        flex: 1;
        min-width: 0;
        height: 48px;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--text);
        font-size: 14.5px;
        font-weight: 750;
        padding: 0 16px;
    }

    .search-wrapper input::placeholder {
        color: #8c8478;
    }

    .btn-search {
        min-height: 46px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        font-weight: 950;
        padding: 0 26px;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .btn-search:hover {
        transform: translateY(-2px);
        background: var(--green-2);
    }

    /* =========================
       CATEGORY
    ========================= */

    .category-row {
        position: relative;
        z-index: 4;
        display: flex;
        justify-content: center;
        gap: 14px;
        width: min(1160px, calc(100% - 32px));
        margin: -48px auto 0;
        overflow-x: auto;
        overflow-y: visible;
        padding: 14px 8px 24px;
        scrollbar-width: none;
    }

    .category-row::-webkit-scrollbar {
        display: none;
    }

    .cat-chip {
        flex: 0 0 auto;
        display: grid;
        justify-items: center;
        gap: 9px;
        min-width: 118px;
        border: 0;
        background: transparent;
        cursor: pointer;
        padding: 0;
    }

    .cat-emoji {
        position: relative;
        display: grid;
        place-items: center;
        width: 72px;
        height: 72px;
        overflow: hidden;
        border: 1px solid rgba(31, 63, 47, 0.11);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.96);
        font-size: 30px;
        box-shadow: 0 12px 28px rgba(35, 34, 29, 0.1);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        will-change: transform;
    }

    .cat-emoji::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.62) 45%, transparent 70%);
        transform: translateX(-140%) skewX(-12deg);
    }

    .cat-label {
        color: var(--muted);
        font-size: 12.5px;
        font-weight: 780;
        transition: color 0.18s ease;
    }

    .cat-chip:hover .cat-emoji {
        transform: translateY(-5px);
        border-color: rgba(31, 63, 47, 0.28);
        box-shadow: 0 18px 38px rgba(35, 34, 29, 0.14);
    }

    .cat-chip:hover .cat-emoji::after {
        animation: shineMove 0.65s ease both;
    }

    .cat-chip.is-active .cat-emoji {
        border-color: transparent;
        background: linear-gradient(145deg, var(--green), var(--green-2));
        box-shadow: 0 18px 38px rgba(31, 63, 47, 0.2);
    }

    .cat-chip.is-active .cat-label {
        color: var(--green);
        font-weight: 950;
    }

    /* =========================
       MAIN LAYOUT
    ========================= */

    .main-layout {
        width: min(1220px, calc(100% - 40px));
        margin: 0 auto;
        padding: clamp(28px, 5vw, 50px) 0 clamp(68px, 8vw, 94px);
    }

    .dashboard-split {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 340px);
        gap: 26px;
        align-items: start;
        margin-bottom: clamp(36px, 5vw, 52px);
    }

    .col-main,
    .col-side {
        min-width: 0;
    }

    .section-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 16px;
        padding-inline: 2px;
    }

    .section-head-spaced {
        margin-top: 40px;
    }

    .section-head h2 {
        margin: 0;
        color: var(--text);
        font-size: clamp(24px, 3vw, 32px);
        font-weight: 950;
        letter-spacing: -0.045em;
        line-height: 1.06;
    }

    .section-head button {
        flex: 0 0 auto;
        min-height: 38px;
        border: 1px solid rgba(31, 63, 47, 0.13);
        border-radius: 999px;
        background: #fff;
        color: var(--green);
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
        padding: 8px 14px;
        box-shadow: 0 8px 18px rgba(24, 23, 20, 0.05);
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .section-head button:hover {
        transform: translateY(-2px);
        background: var(--gold-soft);
    }

    .scroll-layout {
        display: flex;
        gap: 18px;
        overflow-x: auto;
        overflow-y: visible;
        margin: 0 -8px;
        padding: 8px 8px 26px;
        scroll-behavior: smooth;
        scrollbar-width: none;
        scroll-snap-type: x proximity;
    }

    .scroll-layout::-webkit-scrollbar {
        display: none;
    }

    .empty-box {
        width: 100%;
        border: 1px dashed rgba(31, 63, 47, 0.24);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.74);
        color: var(--muted);
        font-size: 14px;
        font-weight: 700;
        line-height: 1.6;
        padding: 40px;
        text-align: center;
    }

    /* =========================
       CARD
    ========================= */

    .ui-card {
        position: relative;
        flex: 0 0 clamp(238px, 21vw, 276px);
        height: clamp(350px, 34vw, 392px);
        overflow: hidden;
        border: 1px solid rgba(31, 63, 47, 0.12);
        border-radius: 26px;
        background: #fff;
        color: var(--text);
        cursor: pointer;
        box-shadow: 0 14px 32px rgba(35, 34, 29, 0.08);
        scroll-snap-align: start;
        contain: layout paint;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .ui-card::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 3;
        pointer-events: none;
        background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.08) 42%, rgba(0, 0, 0, 0.56) 100%),
            linear-gradient(180deg, rgba(251, 250, 246, 0) 0%, rgba(31, 63, 47, 0.12) 100%);
    }

    .ui-card:hover {
        transform: translateY(-7px);
        border-color: rgba(239, 184, 79, 0.42);
        box-shadow: 0 22px 48px rgba(35, 34, 29, 0.16);
    }

    .card-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #e9e0d0;
    }

    .card-image img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        object-position: center;
        transition: transform 0.25s ease;
    }

    .ui-card:hover .card-image img {
        transform: scale(1.045);
    }

    .card-tag {
        position: absolute;
        top: 14px;
        left: 14px;
        z-index: 5;
        display: inline-flex;
        align-items: center;
        max-width: calc(100% - 28px);
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.42);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        color: var(--green);
        font-size: 11.5px;
        font-weight: 950;
        padding: 7px 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .card-content {
        position: relative;
        z-index: 4;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        width: 100%;
        height: 100%;
        padding: 17px;
        color: #fff;
    }

    .card-title {
        margin: 0;
        color: #fff;
        font-size: clamp(16.5px, 1.6vw, 19px);
        font-weight: 950;
        line-height: 1.16;
        letter-spacing: -0.025em;
        text-shadow: 0 8px 18px rgba(0, 0, 0, 0.34);
    }

    .card-desc {
        display: -webkit-box;
        min-height: 38px;
        margin: 8px 0 0;
        overflow: hidden;
        color: rgba(255, 255, 255, 0.82);
        font-size: 12.6px;
        font-weight: 650;
        line-height: 1.5;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    .card-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 12px;
        font-size: 11.5px;
        font-weight: 850;
    }

    .stat-rating,
    .stat-review {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border-radius: 999px;
        padding: 6px 9px;
    }

    .stat-rating {
        background: rgba(255, 244, 216, 0.96);
        color: #8a5a00;
    }

    .stat-review {
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
    }

    .card-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .price {
        color: rgba(255, 255, 255, 0.88);
        font-size: 11.8px;
        font-weight: 900;
    }

    .link {
        color: var(--gold);
        font-size: 11.8px;
        font-weight: 950;
        white-space: nowrap;
        transition: transform 0.18s ease;
    }

    .ui-card:hover .link {
        transform: translateX(3px);
    }

    /* =========================
       SIDE PANEL
    ========================= */

    .side-panel {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 16px;
        border: 1px solid rgba(31, 63, 47, 0.12);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 14px 32px rgba(35, 34, 29, 0.08);
        padding: 16px;
    }

    .alt-panel {
        background:
            radial-gradient(circle at 100% 0%, rgba(239, 184, 79, 0.18), transparent 34%),
            linear-gradient(145deg, rgba(31,63,47,0.06), rgba(255,248,232,0.72));
    }

    .panel-header span {
        display: block;
        color: #8a5a00;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .panel-header strong {
        display: block;
        margin-top: 5px;
        color: var(--text);
        font-size: 19px;
        font-weight: 950;
        line-height: 1.15;
        letter-spacing: -0.025em;
    }

    .panel-header.with-icon {
        display: flex;
        align-items: center;
        gap: 11px;
    }

    .panel-header.with-icon strong {
        margin: 0;
        font-size: 15px;
    }

    .panel-header.with-icon span {
        margin-top: 3px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: none;
    }

    .icon-wrap {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
    }

    .panel-list {
        display: grid;
        gap: 9px;
    }

    .panel-item {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(24,23,20,0.07);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.92);
        color: var(--text);
        cursor: pointer;
        padding: 8px;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .panel-item:hover {
        transform: translateY(-2px);
        background: #fff8e9;
    }

    .panel-item img {
        width: 54px;
        height: 54px;
        border-radius: 14px;
        object-fit: cover;
        object-position: center;
        background: #eee7da;
    }

    .panel-item strong {
        display: block;
        overflow: hidden;
        color: var(--text);
        font-size: 13px;
        font-weight: 950;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .panel-item span {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        color: var(--muted);
        font-size: 11.5px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dist-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border-radius: 999px;
        background: var(--gold-soft);
        color: #8a5a00;
        font-size: 10.5px;
        font-style: normal;
        font-weight: 950;
        padding: 6px 8px;
        white-space: nowrap;
    }

    .panel-empty {
        border: 1px dashed rgba(31,63,47,0.2);
        border-radius: 16px;
        background: rgba(31,63,47,0.035);
        text-align: center;
        padding: 16px;
    }

    .panel-empty strong {
        color: var(--text);
        font-size: 13px;
        font-weight: 900;
    }

    .btn-action-dark,
    .btn-gps {
        min-height: 42px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 12.8px;
        font-weight: 950;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .btn-action-dark {
        border: 0;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
        padding: 11px;
    }

    .btn-action-dark:hover,
    .btn-gps:hover {
        transform: translateY(-2px);
    }

    .btn-gps {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px solid rgba(31,63,47,0.18);
        background: #fff;
        color: var(--green);
        padding: 10px 12px;
    }

    .btn-gps:hover {
        background: var(--gold-soft);
    }

    /* =========================
       CTA
    ========================= */

    .cta-banner {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin: clamp(16px, 3vw, 26px) 0 clamp(40px, 5vw, 56px);
        border-radius: 28px;
        background: var(--green);
        box-shadow: 0 20px 50px rgba(31,63,47,0.22);
        padding: clamp(26px, 4vw, 40px);
    }

    .cta-banner::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -2;
        background-image:
            linear-gradient(105deg, rgba(7, 22, 15, 0.94), rgba(31,63,47,0.82), rgba(24, 23, 20, 0.5)),
            url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=85&w=1600&auto=format&fit=crop');
        background-size: cover;
        background-position: center;
    }

    .cta-banner::after {
        content: "";
        position: absolute;
        inset: auto 0 0;
        z-index: -1;
        height: 50%;
        background: linear-gradient(180deg, transparent, rgba(13, 31, 22, 0.78));
    }

    .cta-banner h3 {
        margin: 0;
        color: #fff;
        font-size: clamp(22px, 3vw, 30px);
        font-weight: 950;
        letter-spacing: -0.04em;
        line-height: 1.1;
    }

    .cta-banner p {
        max-width: 560px;
        margin: 10px 0 0;
        color: rgba(255,255,255,0.82);
        font-size: 14px;
        font-weight: 650;
        line-height: 1.65;
    }

    .cta-banner button {
        flex: 0 0 auto;
        min-height: 48px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--gold), #ffd37b);
        color: var(--text);
        cursor: pointer;
        font-size: 13.5px;
        font-weight: 950;
        padding: 12px 22px;
        transition: transform 0.18s ease;
        white-space: nowrap;
    }

    .cta-banner button:hover {
        transform: translateY(-3px);
    }

    /* =========================
       SCROLL REVEAL
    ========================= */

    .reveal-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition:
            opacity 460ms ease,
            transform 460ms cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: var(--reveal-delay, 0ms);
        will-change: opacity, transform;
    }

    .reveal-on-scroll.is-visible {
        opacity: 1;
        transform: translateY(0);
    }

    .ui-card.reveal-on-scroll {
        transform: translateY(22px) scale(0.985);
    }

    .ui-card.reveal-on-scroll.is-visible {
        transform: translateY(0) scale(1);
    }

    .ui-card.reveal-on-scroll.is-visible:hover {
        transform: translateY(-7px);
    }

    .side-panel.reveal-on-scroll {
        transform: translateY(18px);
    }

    .side-panel.reveal-on-scroll.is-visible {
        transform: translateY(0);
    }

    .category-row.reveal-on-scroll {
        transform: translateY(16px);
    }

    .category-row.reveal-on-scroll.is-visible {
        transform: translateY(0);
    }

    .section-head.reveal-on-scroll {
        transform: translateY(14px);
    }

    .section-head.reveal-on-scroll.is-visible {
        transform: translateY(0);
    }

    .cta-banner.reveal-on-scroll {
        transform: translateY(20px);
    }

    .cta-banner.reveal-on-scroll.is-visible {
        transform: translateY(0);
    }

    /* =========================
       RESPONSIVE
    ========================= */

    @media (max-width: 1020px) {
        .dashboard-split {
            grid-template-columns: 1fr;
        }

        .col-side {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .col-side .side-panel {
            margin-bottom: 0;
        }

        .ui-card {
            flex-basis: clamp(240px, 32vw, 276px);
        }
    }

    @media (max-width: 900px) {
        .nav-bar {
            min-height: auto;
            flex-wrap: wrap;
            padding-block: 14px;
        }

        .nav-links {
            order: 3;
            width: 100%;
            overflow-x: auto;
            padding-bottom: 2px;
            scrollbar-width: none;
        }

        .nav-links::-webkit-scrollbar {
            display: none;
        }

        .hero-title {
            font-size: clamp(38px, 10vw, 60px);
        }

        .cta-banner {
            align-items: stretch;
            flex-direction: column;
            text-align: left;
        }

        .cta-banner button {
            width: 100%;
        }
    }

    @media (max-width: 720px) {
        .main-layout {
            width: min(100% - 28px, 1220px);
            padding-top: 34px;
        }

        .col-side {
            grid-template-columns: 1fr;
        }

        .hero-section {
            min-height: 600px;
            padding-inline: 16px;
            padding-bottom: 126px;
        }

        .search-wrapper {
            align-items: stretch;
            flex-direction: column;
            border-radius: 24px;
            padding: 10px;
        }

        .search-wrapper input {
            height: 48px;
            border-radius: 16px;
            background: #fff;
        }

        .btn-search {
            width: 100%;
        }

        .category-row {
            justify-content: flex-start;
            width: auto;
            margin-top: -44px;
            padding-inline: 16px;
            scroll-snap-type: x mandatory;
        }

        .cat-chip {
            scroll-snap-align: start;
        }

        .section-head {
            align-items: stretch;
            flex-direction: column;
        }

        .section-head button {
            width: max-content;
        }

        .ui-card {
            flex-basis: 268px;
            height: 378px;
        }

        .login-notice-float {
            left: 14px;
            right: 14px;
            grid-template-columns: 42px minmax(0, 1fr) 34px;
            width: auto;
        }

        .notice-action {
            grid-column: 1 / -1;
            width: 100%;
        }
    }

    @media (max-width: 520px) {
        .hero-section {
            min-height: 570px;
        }

        .hero-title {
            letter-spacing: -0.055em;
        }

        .hero-desc {
            font-size: 14.5px;
        }

        .cat-emoji {
            width: 66px;
            height: 66px;
            border-radius: 20px;
            font-size: 27px;
        }

        .cat-chip {
            min-width: 102px;
        }

        .scroll-layout {
            gap: 15px;
            margin-inline: -4px;
            padding-inline: 4px;
        }

        .ui-card {
            flex-basis: 82vw;
            height: 392px;
        }

        .card-content {
            padding: 16px;
        }

        .panel-item {
            grid-template-columns: 54px minmax(0, 1fr);
        }

        .dist-tag {
            grid-column: 1 / -1;
            justify-content: center;
            width: 100%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }

        .reveal-on-scroll {
            opacity: 1 !important;
            transform: none !important;
        }
    }
`;

export default Home;