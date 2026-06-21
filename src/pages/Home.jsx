import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    BadgeCheck,
    BookmarkCheck,
    ChevronDown,
    Coffee,
    Compass,
    Cookie,
    LocateFixed,
    LogIn,
    MapPin,
    MessageCircle,
    Search,
    Star,
    Utensils,
    X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import cutleryIcon from '../assets/cutlery.png';
import AppNavbar from '../components/AppNavbar';
import BrandLogo from '../components/BrandLogo';
import SiteFooter from '../components/SiteFooter';
import { getUploadUrl } from '../config/api';
import { CATEGORY_FEEDS, getCategoryFeedKey, getResolvedCategoryLabel } from '../utils/categoryFeeds';
import { getSearchQueryLabel, getUmkmSearchScore, rankUmkmSearchResults } from '../utils/umkmSearch';
import './Home.css';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1600&auto=format&fit=crop';
const LANDING_HERO_IMAGE = 'https://images.pexels.com/photos/4589511/pexels-photo-4589511.jpeg?auto=compress&cs=tinysrgb&w=1800&h=1000&fit=crop';
const LANDING_PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop';
const POPULAR_FEED_LIMIT = 5;
const SAVED_UMKM_PREVIEW_LIMIT = 2;
const NEARBY_LIMIT = 2;
const EARTH_RADIUS_KM = 6371;
const LANDING_INTRO_STORAGE_KEY = 'plus-review-landing-intro-seen';
const CATEGORY_ICONS = {
    'makanan-berat': Utensils,
    'dessert-snacks': Cookie,
    drinks: Coffee,
};

const shouldShowLandingIntro = () => {
    if (typeof window === 'undefined') return false;

    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1') return true;
    if (params.get('capture') === '1') return false;

    try {
        return sessionStorage.getItem(LANDING_INTRO_STORAGE_KEY) !== '1';
    } catch {
        return true;
    }
};

const getReviews = (item) => item.reviews || [];

const getAverageRating = (item) => {
    const reviews = getReviews(item);
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
};

const formatRating = (value) => Number(value || 0).toFixed(1);

const getUploadImageUrl = (image) => (
    getUploadUrl(image)
);

const normalizeImageList = (images) => {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (!images) return [];

    try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return [];
    }
};

const getImagePath = (item) => (
    item?.image
        ? getUploadImageUrl(item.image)
        : 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop'
);

const getDetailImagePaths = (item, limit = 3) => (
    normalizeImageList(item?.images)
        .slice(0, limit)
        .map(getUploadImageUrl)
);

const getShortText = (value, fallback, maxLength = 136) => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
};

const getCreatedTime = (item) => {
    const createdTime = new Date(item.createdAt || item.updatedAt || 0).getTime();
    if (Number.isFinite(createdTime) && createdTime > 0) return createdTime;
    return Number(item.id || 0);
};

const hasUsableCoordinates = (item) => {
    const latitude = Number(item?.latitude);
    const longitude = Number(item?.longitude);

    return Number.isFinite(latitude)
        && Number.isFinite(longitude)
        && !(latitude === 0 && longitude === 0);
};

const getDistanceKm = (position, item) => {
    if (!position || !hasUsableCoordinates(item)) return Number.POSITIVE_INFINITY;

    const toRad = (value) => (Number(value) * Math.PI) / 180;
    const lat1 = toRad(position.latitude);
    const lat2 = toRad(item.latitude);
    const deltaLat = toRad(Number(item.latitude) - position.latitude);
    const deltaLng = toRad(Number(item.longitude) - position.longitude);
    const a = Math.sin(deltaLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
};

const formatDistance = (distanceKm) => {
    if (!Number.isFinite(distanceKm)) return 'Jarak belum ada';
    if (distanceKm < 1) return `${Math.max(1, Math.round(distanceKm * 1000))} m`;
    if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
    return `${Math.round(distanceKm)} km`;
};

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [showLandingIntro, setShowLandingIntro] = useState(() => !isLoggedIn && shouldShowLandingIntro());
    const [isLandingRevealing, setIsLandingRevealing] = useState(false);
    const [umkmList, setUmkmList] = useState([]);
    const [platformStats, setPlatformStats] = useState({ totalUsers: 0 });
    const [savedUmkm, setSavedUmkm] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loginNotice, setLoginNotice] = useState(null);
    const searchLabel = getSearchQueryLabel(searchTerm);

    const completeLandingIntro = useCallback(() => {
        try {
            sessionStorage.setItem(LANDING_INTRO_STORAGE_KEY, '1');
        } catch {
            // Intro tetap selesai jika sessionStorage tidak tersedia.
        }
        setShowLandingIntro(false);
    }, []);

    const beginLandingReveal = useCallback(() => {
        setIsLandingRevealing(true);
    }, []);

    useEffect(() => {
        let ignore = false;

        const fetchUMKM = async () => {
            try {
                const response = await apiClient.get('/umkm');
                if (!ignore) setUmkmList(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                if (!ignore) {
                    console.error('Gagal mengambil data UMKM', err);
                    setUmkmList([]);
                }
            }
        };

        fetchUMKM();

        window.addEventListener('umkm-updated', fetchUMKM);

        return () => {
            ignore = true;
            window.removeEventListener('umkm-updated', fetchUMKM);
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        const fetchStats = async () => {
            try {
                const { data } = await apiClient.get('/auth/stats');
                if (!ignore) {
                    setPlatformStats({
                        totalUsers: Number(data?.totalUsers || 0),
                    });
                }
            } catch {
                if (!ignore) setPlatformStats({ totalUsers: 0 });
            }
        };

        fetchStats();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        const targetId = location.hash === '#feed' || location.hash === '#umkm-saya'
            ? location.hash.slice(1)
            : '';
        if (!targetId) return;

        window.requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [location.hash]);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        let ignore = false;

        apiClient.get('/auth/profile')
            .then(({ data }) => {
                if (!ignore && data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.dispatchEvent(new Event('profile-updated'));
                }
            })
            .catch(() => {
                // Data lokal tetap dipakai jika backend profile belum aktif.
            });

        return () => {
            ignore = true;
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        let ignore = false;

        const fetchSavedUmkm = async () => {
            try {
                const { data } = await apiClient.get('/umkm/saved');
                if (!ignore) setSavedUmkm(Array.isArray(data) ? data : []);
            } catch {
                if (!ignore) setSavedUmkm([]);
            }
        };

        fetchSavedUmkm();
        window.addEventListener('saved-umkm-updated', fetchSavedUmkm);
        window.addEventListener('storage', fetchSavedUmkm);

        return () => {
            ignore = true;
            window.removeEventListener('saved-umkm-updated', fetchSavedUmkm);
            window.removeEventListener('storage', fetchSavedUmkm);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!loginNotice) return undefined;

        const timeout = window.setTimeout(() => {
            setLoginNotice(null);
        }, 5200);

        return () => window.clearTimeout(timeout);
    }, [loginNotice]);

    const filteredUmkm = useMemo(() => {
        if (!searchLabel) return umkmList;
        return rankUmkmSearchResults(umkmList, searchLabel);
    }, [searchLabel, umkmList]);

    const popularUmkm = useMemo(() => (
        [...filteredUmkm].sort((a, b) => {
            if (searchLabel) {
                const scoreDiff = getUmkmSearchScore(b, searchLabel) - getUmkmSearchScore(a, searchLabel);
                if (scoreDiff !== 0) return scoreDiff;
            }

            const reviewDiff = getReviews(b).length - getReviews(a).length;
            if (reviewDiff !== 0) return reviewDiff;
            return getAverageRating(b) - getAverageRating(a);
        })
    ), [filteredUmkm, searchLabel]);

    const visiblePopularUmkm = useMemo(() => (
        popularUmkm.slice(0, POPULAR_FEED_LIMIT)
    ), [popularUmkm]);

    const categoryFeeds = useMemo(() => (
        CATEGORY_FEEDS.map((category) => ({
            ...category,
            items: popularUmkm.filter((item) => getCategoryFeedKey(item) === category.key),
        }))
    ), [popularUmkm]);

    const latestUmkm = useMemo(() => (
        [...umkmList].sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
    ), [umkmList]);

    const totalReviews = useMemo(() => (
        umkmList.reduce((sum, item) => sum + getReviews(item).length, 0)
    ), [umkmList]);

    const latestFeedItem = latestUmkm[0];
    const latestFeedReviews = getReviews(latestFeedItem || {});
    const latestFeedRating = formatRating(getAverageRating(latestFeedItem || {}));
    const latestFeedSummary = getShortText(
        latestFeedItem?.deskripsi || latestFeedItem?.alamat_teks || latestFeedItem?.harga_range,
        'Cek detail, rating, dan review sebelum mampir di jam kosong berikutnya.'
    );

    const showLoginNotice = (feature = 'menggunakan fitur ini') => {
        setLoginNotice({
            title: 'Login dulu untuk lanjut',
            message: `Harap login dulu agar kamu bisa ${feature} di Plus Review.`,
        });
    };

    const guardedNavigate = (target, feature) => {
        if (!isLoggedIn && target !== '/' && target !== '/login' && !String(target).startsWith('/register')) {
            showLoginNotice(feature);
            return;
        }

        navigate(target);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = getSearchQueryLabel(searchTerm);
        navigate(query ? `/populer?q=${encodeURIComponent(query)}` : '/populer');
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleFeedClick = () => {
        navigate('/populer');
    };

    const navbarActive = location.hash === '#feed'
        ? 'feed'
        : location.hash === '#umkm-saya'
            ? 'umkm-saya'
            : 'beranda';

    if (!isLoggedIn) {
        const landingClassName = [
            'home-page landing-page',
            showLandingIntro && !isLandingRevealing ? 'is-intro-active' : '',
            isLandingRevealing ? 'is-intro-revealing' : '',
        ].filter(Boolean).join(' ');

        return (
            <main className={landingClassName}>
                {showLandingIntro && (
                    <LandingIntro
                        onRevealStart={beginLandingReveal}
                        onComplete={completeLandingIntro}
                    />
                )}

                {loginNotice && (
                    <LoginRequiredNotice
                        notice={loginNotice}
                        onClose={() => setLoginNotice(null)}
                        onLogin={() => navigate('/login')}
                        showAction={false}
                    />
                )}

                <GuestLanding
                    latestItem={latestFeedItem}
                    stats={{
                        umkm: umkmList.length,
                        reviews: totalReviews,
                        users: platformStats.totalUsers,
                    }}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onRequireLogin={showLoginNotice}
                    onLogin={() => navigate('/login')}
                    onRegister={() => navigate('/register')}
                />

                <SiteFooter />
            </main>
        );
    }

    return (
        <main className="home-page">
            <AppNavbar active={navbarActive} isLoggedIn={isLoggedIn} onFeedClick={handleFeedClick} />

            {loginNotice && (
                <LoginRequiredNotice
                    notice={loginNotice}
                    onClose={() => setLoginNotice(null)}
                    onLogin={() => navigate('/login')}
                />
            )}

            <section className="home-hero" style={{ '--home-hero-image': `url("${HERO_IMAGE}")` }}>
                <div className="home-hero-inner">
                    <div className="home-hero-copy">
                        <span className="home-kicker">Rekomendasi jajanan kampus</span>
                        <h1>Temukan UMKM favorit di sekitar kampus.</h1>
                        <p>
                            Lihat pilihan tempat makan, cek rating dari mahasiswa lain,
                            lalu pilih rekomendasi yang paling cocok untuk jam kosong berikutnya.
                        </p>

                        <form className="home-search" onSubmit={handleSearchSubmit}>
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Cari nama warung, menu, atau lokasi"
                                aria-label="Cari UMKM"
                            />
                            {searchLabel && (
                                <button className="home-search-clear" type="button" onClick={clearSearch} aria-label="Hapus pencarian">
                                    <X size={16} strokeWidth={2.7} />
                                </button>
                            )}
                            <button className="home-search-submit" type="submit">Cari</button>
                        </form>

                        <div className="home-hero-actions" aria-label="Aksi cepat beranda">
                            <button
                                className="home-hero-action is-primary"
                                type="button"
                                onClick={isLoggedIn ? handleFeedClick : () => showLoginNotice('melihat feed rekomendasi lengkap')}
                            >
                                Lihat Feed
                            </button>
                            <button className="home-hero-action" type="button" onClick={() => guardedNavigate('/tambah', 'menambahkan UMKM baru')}>
                                Tambah UMKM
                            </button>
                        </div>

                        <div className="home-stats" aria-label="Ringkasan data UMKM">
                            <StatItem value={umkmList.length} label="UMKM" />
                            <StatItem value={totalReviews} label="Review" />
                            <StatItem value={platformStats.totalUsers} label="Pengguna" />
                        </div>
                    </div>

                    <div className="home-hero-highlight" aria-label="UMKM pilihan">
                        <span>Update feed</span>
                        <strong>{latestFeedItem ? `${umkmList.length} UMKM tersedia` : 'Feed siap diisi'}</strong>
                        <small>
                            {latestFeedItem
                                ? `Terbaru: ${getShortText(latestFeedItem.nama_umkm, 'UMKM baru', 42)}`
                                : 'Tambahkan UMKM pertama untuk memulai'}
                        </small>
                    </div>
                </div>
            </section>

            <section className="home-section home-latest-section">
                <div className="home-latest-duo">
                    <div className="home-latest-column">
                        <SectionHeader
                            title="Baru Masuk Feed"
                            subtitle="Update UMKM terbaru yang baru masuk ke rekomendasi kampus."
                            action={latestFeedItem ? 'Buka Detail' : undefined}
                            onAction={() => latestFeedItem && guardedNavigate(`/umkm/${latestFeedItem.id}`, 'membuka detail UMKM')}
                            eyebrow="Update terbaru"
                        />

                        {latestFeedItem ? (
                            <LatestFeedCard
                                item={latestFeedItem}
                                rating={latestFeedRating}
                                reviews={latestFeedReviews.length}
                                summary={latestFeedSummary}
                                navigate={guardedNavigate}
                            />
                        ) : (
                            <div className="home-empty">
                                <strong>Belum ada UMKM baru</strong>
                                <span>Tambahkan UMKM pertama agar muncul di bagian ini.</span>
                            </div>
                        )}
                    </div>

                    <MyUMKMPanel
                        isLoggedIn={isLoggedIn}
                        items={savedUmkm}
                        allItems={umkmList}
                        navigate={navigate}
                        onRequireLogin={showLoginNotice}
                    />
                </div>
            </section>

            <section id="feed" className="home-section is-soft home-popular-section">
                <div className="home-feed-layout">
                    <div className="home-feed-popular-column">
                        <div className="home-feed-topbar">
                            <SectionHeader
                                title="Pilihan Populer"
                                subtitle="UMKM dengan review dan rating paling kuat tampil di sini agar mudah dipilih."
                                action="Tambah UMKM"
                                onAction={() => guardedNavigate('/tambah', 'menambahkan UMKM baru')}
                                eyebrow="Feed pilihan"
                            />

                            <CategoryFeedPanel
                                feeds={categoryFeeds}
                                isLoggedIn={isLoggedIn}
                                navigate={guardedNavigate}
                                onRequireLogin={showLoginNotice}
                            />
                        </div>

                        {popularUmkm.length > 0 && (
                            <div className="home-feed-list-head">
                                <div>
                                    <span>Paling ramai direview</span>
                                    <strong>
                                        {popularUmkm.length > POPULAR_FEED_LIMIT
                                            ? `${visiblePopularUmkm.length} dari ${popularUmkm.length} UMKM ditampilkan`
                                            : `${visiblePopularUmkm.length} UMKM ditampilkan`}
                                    </strong>
                                </div>
                                <div className="home-feed-list-actions">
                                    {searchLabel && <small>Hasil untuk "{searchLabel}"</small>}
                                    <button
                                        className="home-feed-more-button"
                                        type="button"
                                        onClick={() => guardedNavigate(searchLabel ? `/populer?q=${encodeURIComponent(searchLabel)}` : '/populer', 'melihat feed paling populer lengkap')}
                                    >
                                        Lihat selengkapnya
                                    </button>
                                </div>
                            </div>
                        )}

                        <UMKMGrid
                            items={visiblePopularUmkm}
                            navigate={guardedNavigate}
                            emptyLabel="Belum ada pilihan populer untuk ditampilkan."
                            scrollable
                        />
                    </div>
                </div>
            </section>

            <SiteFooter />
        </main>
    );
};

const StatItem = ({ value, label }) => (
    <div className="home-stat">
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const LoginRequiredNotice = ({ notice, onClose, onLogin, showAction = true }) => (
    <div className={showAction ? 'home-login-notice' : 'home-login-notice is-simple'} role="status" aria-live="polite">
        <span className="home-login-notice-icon" aria-hidden="true">
            <LogIn size={18} strokeWidth={2.6} />
        </span>
        <div className="home-login-notice-copy">
            <strong>{notice.title}</strong>
            <span>{notice.message}</span>
        </div>
        {showAction && (
            <button className="home-login-notice-action" type="button" onClick={onLogin}>
                Masuk
            </button>
        )}
        <button className="home-login-notice-close" type="button" aria-label="Tutup notifikasi login" onClick={onClose}>
            <X size={16} strokeWidth={2.6} />
        </button>
    </div>
);

const LandingIntro = ({ onRevealStart, onComplete }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const leaveTimer = window.setTimeout(() => {
            setIsLeaving(true);
            onRevealStart();
        }, reduceMotion ? 1500 : 3000);
        const completeTimer = window.setTimeout(() => {
            onComplete();
        }, reduceMotion ? 1750 : 3950);

        return () => {
            window.clearTimeout(leaveTimer);
            window.clearTimeout(completeTimer);
            document.body.style.overflow = previousOverflow;
        };
    }, [onComplete, onRevealStart]);

    return (
        <div
            className={isLeaving ? 'landing-loader is-leaving' : 'landing-loader'}
            role="status"
            aria-live="polite"
            aria-label="Plus Review sedang disiapkan"
        >
            <span className="landing-loader-topline" aria-hidden="true" />

            <div className="landing-loader-content">
                <div className="landing-loader-brand">
                    <BrandLogo showSubtitle={false} />
                </div>

                <div className="landing-loader-copy">
                    <strong>Pengalaman Plus Review segera dimulai</strong>
                    <span>Rekomendasi terbaik kampus sedang disiapkan khusus untukmu.</span>
                </div>

                <span className="landing-loader-progress" aria-hidden="true">
                    <span />
                </span>
            </div>

            <small className="landing-loader-status">Plus Review</small>
        </div>
    );
};

const GuestLanding = ({
    latestItem,
    stats,
    searchTerm,
    onSearchChange,
    onRequireLogin,
    onLogin,
    onRegister,
}) => {
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const revealSelectors = [
            '.landing-hero-note',
            '.landing-category-rail',
            '.landing-section-head',
            '.landing-feature-card',
            '.landing-flow-head',
            '.landing-step-card',
            '.landing-preview-copy',
            '.landing-preview-board',
            '.landing-mini-card',
            '.landing-final-cta',
        ];
        const elements = Array.from(document.querySelectorAll(revealSelectors.join(',')));

        elements.forEach((element, index) => {
            element.classList.add('landing-scroll-reveal');
            element.style.setProperty('--landing-reveal-delay', `${Math.min((index % 5) * 55, 220)}ms`);
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.14,
        });

        elements.forEach((element) => observer.observe(element));

        return () => {
            observer.disconnect();
            elements.forEach((element) => {
                element.classList.remove('landing-scroll-reveal', 'is-visible');
                element.style.removeProperty('--landing-reveal-delay');
            });
        };
    }, []);

    const latestName = latestItem?.nama_umkm || 'UMKM kampus pilihan';
    const latestImage = latestItem ? getImagePath(latestItem) : LANDING_PREVIEW_IMAGE;

    const scrollToPreview = () => {
        document.getElementById('landing-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const submitLandingSearch = (event) => {
        event.preventDefault();
        onRequireLogin('mencari dan membuka rekomendasi UMKM');
    };

    return (
        <>
            <nav className="landing-nav" aria-label="Navigasi landing Plus Review">
                <button className="landing-brand" type="button" onClick={scrollToPreview}>
                    <BrandLogo />
                </button>

                <div className="landing-nav-actions">
                    <button className="landing-nav-feature" type="button" onClick={scrollToPreview}>
                        <Compass aria-hidden="true" />
                        <span>Fitur</span>
                    </button>
                    <button className="landing-nav-feed" type="button" onClick={() => onRequireLogin('membuka feed rekomendasi')}>Feed</button>
                    <button className="landing-nav-login" type="button" onClick={onLogin}>Masuk</button>
                    <button className="landing-nav-register" type="button" onClick={onRegister}>Daftar</button>
                </div>
            </nav>

            <section className="landing-hero" style={{ '--landing-hero-image': `url("${LANDING_HERO_IMAGE}")` }}>
                <div className="landing-hero-content">
                    <span className="landing-kicker">Review UMKM kampus yang lebih jujur</span>
                    <h1>Plus Review</h1>
                    <p>
                        Temukan tempat makan, minuman, dan camilan kampus dari review mahasiswa.
                        Simpan pilihan favorit, lihat foto detail, lalu pilih UMKM yang paling pas sebelum berangkat.
                    </p>

                    <form className="landing-search" onSubmit={submitLandingSearch}>
                        <Search aria-hidden="true" />
                        <input
                            value={searchTerm}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Cari makanan berat, snacks, atau drinks"
                            aria-label="Cari rekomendasi UMKM"
                        />
                        <button type="submit">
                            Cari
                            <ArrowRight aria-hidden="true" />
                        </button>
                    </form>

                    <div className="landing-hero-actions">
                        <button className="landing-primary" type="button" onClick={onLogin}>
                            Mulai sekarang
                            <ArrowRight aria-hidden="true" />
                        </button>
                        <button className="landing-secondary" type="button" onClick={onRegister}>
                            Buat akun
                        </button>
                    </div>

                    <div className="landing-stat-row" aria-label="Ringkasan Plus Review">
                        <LandingStat value={stats.umkm} label="UMKM aktif" />
                        <LandingStat value={stats.reviews} label="Review masuk" />
                        <LandingStat value={stats.users} label="Pengguna" />
                    </div>

                    <div className="landing-hero-strip" aria-label="Sorotan Plus Review">
                        <LandingHeroPill icon={Utensils} label="Kategori" value="Makanan, snacks, drinks" />
                        <LandingHeroPill icon={BookmarkCheck} label="Simpan" value="Favorit bisa dibuka lagi" />
                        <LandingHeroPill icon={MessageCircle} label="Review" value="Rating, komentar, foto" />
                    </div>
                </div>

                <div className="landing-hero-note" aria-label="Preview update">
                    <img src={latestImage} alt="" />
                    <div>
                        <span>Update terbaru</span>
                        <strong>{latestName}</strong>
                        <small>Login untuk membuka detail, review, dan foto UMKM secara lengkap.</small>
                    </div>
                    <div className="landing-note-meter" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
            </section>

            <section className="landing-category-rail" aria-label="Kategori unggulan">
                <div className="landing-category-track">
                    {[0, 1].map((groupIndex) => (
                        <div className="landing-category-loop" key={`category-loop-${groupIndex}`} aria-hidden={groupIndex === 1}>
                            {CATEGORY_FEEDS.map((category) => {
                                const CategoryIcon = CATEGORY_ICONS[category.key] || Utensils;

                                return (
                                    <button
                                        key={`${category.key}-${groupIndex}`}
                                        type="button"
                                        tabIndex={groupIndex === 1 ? -1 : 0}
                                        onClick={() => onRequireLogin(`membuka kategori ${category.label}`)}
                                    >
                                        <span className="landing-category-image">
                                            <img src={category.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                                        </span>
                                            <span className="landing-category-copy">
                                                <strong>{category.label}</strong>
                                                <small>{category.caption}</small>
                                                <p>{getShortText(category.description, category.caption, 82)}</p>
                                                <em>Lihat kategori</em>
                                            </span>
                                            <span className="landing-category-card-icon" aria-hidden="true">
                                                <CategoryIcon />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </section>

            <section id="landing-preview" className="landing-section landing-feature-section">
                <div className="landing-section-head">
                    <span>Kenapa terasa beda</span>
                    <h2>Dibuat untuk keputusan makan yang cepat, rapi, dan menyenangkan.</h2>
                    <p>
                        User baru langsung paham apa yang bisa dilakukan: cari UMKM, cek bukti review, lalu simpan tempat yang ingin dicoba.
                    </p>
                </div>

                <div className="landing-feature-grid">
                    <LandingFeature
                        icon={BadgeCheck}
                        title="Rekomendasi jelas"
                        text="UMKM dipisah berdasarkan kategori, review, dan update terbaru supaya tidak terasa acak."
                    />
                    <LandingFeature
                        icon={BookmarkCheck}
                        title="Simpan pilihan"
                        text="User bisa menandai UMKM yang ingin dicoba nanti setelah login ke akun mereka."
                    />
                    <LandingFeature
                        icon={MessageCircle}
                        title="Review lebih hidup"
                        text="Review, rating, dan foto membantu mahasiswa lain memilih tempat yang paling cocok."
                    />
                </div>
            </section>

            <section className="landing-section landing-flow-section">
                <div className="landing-flow-head">
                    <span>Alur sederhana</span>
                    <h2>Dari cari sampai review, semuanya dibuat simpel.</h2>
                </div>

                <div className="landing-flow-grid">
                    <LandingStep number="01" icon={Search} title="Cari sesuai mood" text="Ketik menu, lokasi, atau kategori yang kamu mau." />
                    <LandingStep number="02" icon={Star} title="Cek reputasi" text="Lihat rating, komentar, foto detail, dan jam operasional." />
                    <LandingStep number="03" icon={BookmarkCheck} title="Simpan dulu" text="Tandai UMKM yang ingin kamu coba saat jam kosong." />
                    <LandingStep number="04" icon={MessageCircle} title="Bagikan review" text="Bantu mahasiswa lain memilih dengan review yang jelas." />
                </div>
            </section>

            <section className="landing-section landing-preview-section">
                <div className="landing-preview-copy">
                    <span>Preview pengalaman</span>
                    <h2>Feed yang terasa seperti katalog kuliner kampus.</h2>
                    <p>
                        Setiap UMKM dibuat mudah discan: kategori, kisaran harga, jam operasional,
                        foto, dan review tampil sebagai informasi utama.
                    </p>
                    <button type="button" onClick={() => onRequireLogin('melihat feed dan membuka detail UMKM')}>
                        Lihat feed setelah login
                        <ArrowRight aria-hidden="true" />
                    </button>
                </div>

                <div className="landing-preview-board" aria-label="Preview tampilan feed">
                    <article className="landing-preview-card is-large">
                        <img src={LANDING_PREVIEW_IMAGE} alt="" loading="lazy" decoding="async" />
                        <div className="landing-preview-floating" aria-hidden="true">
                            <span>5.0</span>
                            <small>review</small>
                        </div>
                        <div>
                            <span>Pilihan rekomendasi</span>
                            <strong>Feed Populer</strong>
                            <small>Restoran dan UMKM dengan rating, review, dan aktivitas terbaik tampil di sini.</small>
                        </div>
                    </article>

                    <div className="landing-mini-stack">
                        <LandingMini icon={Star} title="Rating & review" text="Bantu pilih tempat terbaik." />
                        <LandingMini icon={MapPin} title="Lokasi UMKM" text="Lebih mudah ditemukan." />
                        <LandingMini icon={Utensils} title="Kategori jelas" text="Cari sesuai mood makan." />
                    </div>
                </div>
            </section>

            <section className="landing-final-cta">
                <div>
                    <span>Siap mulai?</span>
                    <h2>Masuk dan jelajahi rekomendasi UMKM kampus.</h2>
                </div>
                <div>
                    <button className="landing-primary" type="button" onClick={onLogin}>
                        Masuk
                        <ArrowRight aria-hidden="true" />
                    </button>
                    <button className="landing-secondary is-dark" type="button" onClick={onRegister}>
                        Daftar akun
                    </button>
                </div>
            </section>
        </>
    );
};

const LandingStat = ({ value, label }) => (
    <div className="landing-stat">
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const LandingHeroPill = ({ icon: Icon, label, value }) => (
    <div className="landing-hero-pill">
        <span aria-hidden="true">
            <Icon />
        </span>
        <div>
            <strong>{label}</strong>
            <small>{value}</small>
        </div>
    </div>
);

const LandingFeature = ({ icon: Icon, title, text }) => (
    <article className="landing-feature-card">
        <span aria-hidden="true">
            <Icon />
        </span>
        <h3>{title}</h3>
        <p>{text}</p>
    </article>
);

const LandingStep = ({ number, icon: Icon, title, text }) => (
    <article className="landing-step-card">
        <span className="landing-step-number">{number}</span>
        <span className="landing-step-icon" aria-hidden="true">
            <Icon />
        </span>
        <h3>{title}</h3>
        <p>{text}</p>
    </article>
);

const LandingMini = ({ icon: Icon, title, text }) => (
    <article className="landing-mini-card">
        <span aria-hidden="true">
            <Icon />
        </span>
        <div>
            <strong>{title}</strong>
            <small>{text}</small>
        </div>
    </article>
);

const SectionHeader = ({ title, subtitle, action, onAction, eyebrow = 'Direkomendasikan' }) => (
    <div className="home-section-header">
        <div>
            <span className="home-section-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
        </div>

        {action && (
            <button className="home-section-action" onClick={onAction}>{action}</button>
        )}
    </div>
);

const MyUMKMPanel = ({ items, allItems, isLoggedIn, navigate, onRequireLogin }) => {
    const visibleItems = items.slice(0, SAVED_UMKM_PREVIEW_LIMIT);
    const restCount = Math.max(items.length - visibleItems.length, 0);

    return (
        <aside id="umkm-saya" className="home-my-panel" aria-label="UMKM disimpan">
            <div className="home-my-head">
                <span>UMKM Disimpan</span>
                <strong>{isLoggedIn ? `${items.length} UMKM tersimpan` : 'Masuk untuk melihat'}</strong>
                <p>
                    {isLoggedIn
                        ? 'Simpanan terbaru dari tombol Simpan nanti akan tampil otomatis di sini.'
                        : 'Login dulu agar UMKM yang kamu simpan bisa muncul di sini.'}
                </p>
            </div>

            {isLoggedIn && visibleItems.length > 0 ? (
                <div className="home-my-list">
                    {visibleItems.map((item) => (
                        <button key={`saved-${item.id}`} type="button" onClick={() => navigate(`/umkm/${item.id}`)}>
                            <img src={getImagePath(item)} alt="" loading="lazy" decoding="async" />
                            <span>
                                <strong>{item.nama_umkm}</strong>
                                <small>{item.savedAt ? `Disimpan terbaru` : item.jam_operasional || item.jenis_makanan || 'Tersimpan'}</small>
                            </span>
                            <em>Buka</em>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="home-my-empty">
                    <strong>{isLoggedIn ? 'Belum ada UMKM disimpan' : 'Akun belum masuk'}</strong>
                    <span>
                        {isLoggedIn
                            ? 'Tekan Simpan nanti di detail UMKM agar tampil di panel ini.'
                            : 'Setelah login, UMKM yang kamu simpan akan tampil sebagai daftar personal.'}
                    </span>
                </div>
            )}

            {isLoggedIn && restCount > 0 && (
                <button className="home-my-more-button" type="button" onClick={() => navigate('/tersimpan')}>
                    Lihat semua UMKM disimpan
                    <span>+{restCount} lainnya</span>
                </button>
            )}

            <button
                className="home-my-action"
                type="button"
                onClick={() => (
                    isLoggedIn
                        ? navigate('/tersimpan')
                        : onRequireLogin('melihat UMKM yang kamu simpan')
                )}
            >
                {isLoggedIn ? 'Buka UMKM Disimpan' : 'Login untuk Melihat'}
            </button>

            <NearbyUMKMFinder
                allItems={allItems}
                isLoggedIn={isLoggedIn}
                navigate={navigate}
                onRequireLogin={onRequireLogin}
            />
        </aside>
    );
};

const NearbyUMKMFinder = ({ allItems, isLoggedIn, navigate, onRequireLogin }) => {
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationMessage, setLocationMessage] = useState('');
    const [userPosition, setUserPosition] = useState(null);
    const [nearbySearch, setNearbySearch] = useState('');
    const nearbySearchLabel = getSearchQueryLabel(nearbySearch);

    const coordinateItems = useMemo(() => (
        allItems.filter(hasUsableCoordinates)
    ), [allItems]);

    const nearbyResults = useMemo(() => {
        if (!userPosition) return [];

        const matchedItems = nearbySearchLabel
            ? rankUmkmSearchResults(coordinateItems, nearbySearchLabel)
            : coordinateItems;

        return matchedItems
            .map((item) => ({
                item,
                distanceKm: getDistanceKm(userPosition, item),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, NEARBY_LIMIT);
    }, [coordinateItems, nearbySearchLabel, userPosition]);

    const requestLocation = () => {
        if (!isLoggedIn) {
            onRequireLogin('melihat UMKM terdekat dari posisimu');
            return;
        }

        if (!navigator.geolocation) {
            setLocationStatus('unsupported');
            setLocationMessage('Browser ini belum mendukung GPS. Coba buka lewat Chrome atau Edge terbaru.');
            return;
        }

        setLocationStatus('requesting');
        setLocationMessage('Menunggu izin lokasi dari browser...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserPosition({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationStatus('allowed');
                setLocationMessage('Lokasi Aktif, Rekomendasi Terdekat di sekitar.');
            },
            (error) => {
                setLocationStatus('denied');
                setLocationMessage(
                    error.code === error.PERMISSION_DENIED
                        ? 'Izin lokasi ditolak. Aktifkan GPS dan izinkan lokasi dari browser untuk melihat UMKM terdekat.'
                        : 'Lokasi belum bisa dibaca. Pastikan GPS aktif lalu coba lagi.'
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 60000,
            }
        );
    };

    return (
        <div className="home-nearby-panel">
            <div className="home-nearby-head">
                <span aria-hidden="true">
                    <Compass size={17} strokeWidth={2.6} />
                </span>
                <div>
                    <strong>Dekat dari posisimu</strong>
                    <small>Maksimal 2 rekomendasi terdekat.</small>
                </div>
            </div>

            {!userPosition ? (
                <button className="home-nearby-permission" type="button" onClick={requestLocation}>
                    <LocateFixed size={16} strokeWidth={2.7} />
                    <span>{locationStatus === 'requesting' ? 'Membaca lokasi...' : 'Aktifkan GPS'}</span>
                </button>
            ) : (
                <form className="home-nearby-search" onSubmit={(event) => event.preventDefault()}>
                    <Search size={15} strokeWidth={2.6} aria-hidden="true" />
                    <input
                        value={nearbySearch}
                        onChange={(event) => setNearbySearch(event.target.value)}
                        placeholder="Cari makanan, minuman..."
                        aria-label="Cari UMKM dekat posisi saya"
                    />
                    {nearbySearchLabel && (
                        <button type="button" onClick={() => setNearbySearch('')} aria-label="Hapus pencarian terdekat">
                            <X size={14} strokeWidth={2.6} />
                        </button>
                    )}
                </form>
            )}

            <div className="home-nearby-message" aria-live="polite">
                {locationMessage || 'Izinkan lokasi untuk melihat rekomendasi yang benar-benar dekat.'}
            </div>

            <div className="home-nearby-results">
                {userPosition && nearbyResults.length > 0 ? nearbyResults.map(({ item, distanceKm }) => (
                    <button key={`nearby-${item.id}`} className="home-nearby-card" type="button" onClick={() => navigate(`/umkm/${item.id}`)}>
                        <img src={getImagePath(item)} alt="" loading="lazy" decoding="async" />
                        <span>
                            <strong>{item.nama_umkm}</strong>
                            <small>{getResolvedCategoryLabel(item) || item.harga_range || 'Kuliner kampus'}</small>
                        </span>
                        <em>
                            <MapPin size={12} strokeWidth={2.7} aria-hidden="true" />
                            {formatDistance(distanceKm)}
                        </em>
                    </button>
                )) : (
                    <div className="home-nearby-empty">
                        <strong>
                            {userPosition
                                ? nearbySearchLabel
                                    ? 'Tidak ada hasil dekat'
                                    : 'Koordinat UMKM belum siap'
                                : 'GPS belum aktif'}
                        </strong>
                        <span>
                            {userPosition
                                ? nearbySearchLabel
                                    ? 'Coba kata kunci lain.'
                                    : 'UMKM yang punya titik peta akan tampil di sini.'
                                : 'Tekan Aktifkan GPS dulu.'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const LatestFeedCard = ({ item, rating, reviews, summary, navigate }) => {
    const imagePath = getImagePath(item);
    const detailPhotos = getDetailImagePaths(item, 4);
    const categoryLabel = getResolvedCategoryLabel(item);

    return (
        <article className="home-feed-spotlight home-latest-spotlight" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="home-feed-spotlight-image">
                <img src={imagePath} alt={item.nama_umkm} loading="lazy" decoding="async" />
                <span>{categoryLabel}</span>
            </div>

            <div className={`home-feed-spotlight-body ${detailPhotos.length > 0 ? 'has-detail-photos' : 'has-no-detail-photos'}`}>
                <div className="home-latest-copy">
                    <span className="home-latest-status">Terbaru masuk</span>
                    <h3>{item.nama_umkm}</h3>
                    <p>{summary}</p>
                </div>

                <div className="home-feed-spotlight-meta">
                    <span>
                        <small>Rating</small>
                        <strong>{rating}</strong>
                    </span>
                    <span>
                        <small>Review</small>
                        <strong>{reviews} Review</strong>
                    </span>
                    <span>
                        <small>Harga</small>
                        <strong>{item.harga_range || 'Belum diatur'}</strong>
                    </span>
                    <span>
                        <small>Jam operasional</small>
                        <strong>{item.jam_operasional || 'Belum diatur'}</strong>
                    </span>
                </div>

                {detailPhotos.length > 0 && (
                    <div className={`home-latest-detail-strip is-count-${detailPhotos.length}`} aria-label="Preview foto detail UMKM">
                        <span>Detail foto</span>
                        <div>
                            {detailPhotos.map((photo, index) => (
                                <img key={`${photo}-${index}`} src={photo} alt={`${item.nama_umkm} detail ${index + 1}`} loading="lazy" decoding="async" />
                            ))}
                        </div>
                    </div>
                )}

                <div className="home-latest-footer">
                    <button
                        className="home-feed-detail-button"
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/umkm/${item.id}`);
                        }}
                    >
                        Lihat detail UMKM
                    </button>
                </div>
            </div>
        </article>
    );
};

const CategoryFeedPanel = ({ feeds, isLoggedIn, navigate, onRequireLogin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const totalCategoryItems = feeds.reduce((sum, feed) => sum + feed.items.length, 0);
    const activeCategoryCount = feeds.filter((feed) => feed.items.length > 0).length;

    return (
        <aside className={isOpen ? 'home-category-feed is-open' : 'home-category-feed'} aria-label="Feed by kategori">
            <button
                className="home-category-head"
                type="button"
                aria-controls="home-category-feed-menu"
                aria-expanded={isOpen}
                onClick={() => {
                    if (!isLoggedIn) {
                        onRequireLogin('membuka feed berdasarkan kategori');
                        return;
                    }

                    setIsOpen((current) => !current);
                }}
            >
                <span className="home-category-icon-shell" aria-hidden="true">
                    <img className="home-category-food-mark" src={cutleryIcon} alt="" />
                </span>

                <div className="home-category-head-copy">
                    <span>Feed by Kategori</span>
                    <strong>Pilih suasana makanmu</strong>
                    <em>{activeCategoryCount || feeds.length} kategori siap dibuka</em>
                </div>

                <span className="home-category-head-action">
                    <small>{totalCategoryItems} UMKM</small>
                    <span className="home-category-caret" aria-hidden="true">
                        <ChevronDown size={17} strokeWidth={2.7} />
                    </span>
                </span>
            </button>

            {isOpen && (
                <div id="home-category-feed-menu" className="home-category-dropdown">
                    <div className="home-category-grid" aria-label="Daftar kategori feed">
                        {feeds.map((feed) => {
                            const CategoryIcon = CATEGORY_ICONS[feed.key] || Utensils;

                            return (
                                <article
                                    key={feed.key}
                                    className="home-category-tile"
                                    onClick={() => navigate(`/kategori/${feed.key}`)}
                                >
                                    <div className="home-category-tile-image">
                                        <img src={feed.imageUrl} alt={feed.label} referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                                        <span>{feed.items.length} UMKM</span>
                                    </div>

                                    <div className="home-category-tile-body">
                                        <div className="home-category-tile-head">
                                            <span className="home-category-tile-icon" aria-hidden="true">
                                                <CategoryIcon size={17} strokeWidth={2.4} />
                                            </span>
                                            <small>{feed.caption}</small>
                                        </div>
                                        <h3>{feed.label}</h3>
                                        <p>{feed.description}</p>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                navigate(`/kategori/${feed.key}`);
                                            }}
                                        >
                                            Lihat semua
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            )}
        </aside>
    );
};

const UMKMGrid = ({ items, navigate, emptyLabel, compact = false, scrollable = false }) => {
    if (items.length === 0) {
        return (
            <div className="home-empty">
                <strong>Data belum tersedia</strong>
                <span>{emptyLabel}</span>
            </div>
        );
    }

    return (
        <div className={`home-grid${compact ? ' is-compact' : ''}${scrollable ? ' is-scrollable' : ''}`}>
            {items.map((item) => (
                <UMKMCard key={`${compact ? 'recent' : 'popular'}-${item.id}`} item={item} navigate={navigate} />
            ))}
        </div>
    );
};

const UMKMCard = ({ item, navigate }) => {
    const imagePath = getImagePath(item);
    const reviews = getReviews(item);
    const totalReviews = reviews.length;
    const calculatedAvgRating = formatRating(getAverageRating(item));
    const categoryLabel = getResolvedCategoryLabel(item);
    const detailText = getShortText(
        item.deskripsi || item.alamat_teks || item.harga_range,
        'Informasi belum lengkap',
        92
    );

    return (
        <article className="home-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="home-card-image">
                <img src={imagePath} alt={item.nama_umkm} loading="lazy" decoding="async" />
                <span>{categoryLabel}</span>
            </div>

            <div className="home-card-body">
                <div className="home-card-copy">
                    <h3>{item.nama_umkm}</h3>
                    <p>{detailText}</p>
                </div>

                <div className="home-card-meta">
                    <span className="home-rating">Rating {calculatedAvgRating}</span>
                    <span>{totalReviews} review</span>
                </div>

                <div className="home-card-schedule">
                    <span>Jam</span>
                    <strong>{item.jam_operasional || 'Belum diatur'}</strong>
                </div>

                <div className="home-card-footer">
                    <span>{item.harga_range || 'Harga belum diatur'}</span>
                    <strong>Lihat detail</strong>
                </div>
            </div>
        </article>
    );
};

export default Home;
