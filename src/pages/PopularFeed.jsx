import { useEffect, useMemo, useState } from 'react';
import {
    Clock,
    MapPin,
    MessageCircle,
    Search,
    Star,
    Store,
    Tag,
    UsersRound,
    X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import { getSearchQueryLabel, rankUmkmSearchResults } from '../utils/umkmSearch';
import './CategoryFeed.css';
import './PopularFeed.css';

const BASE_URL = 'http://localhost:5000';
const POPULAR_HERO_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1800&auto=format&fit=crop';

const getReviews = (item) => item.reviews || [];

const getAverageRating = (item) => {
    const reviews = getReviews(item);
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
};

const formatRating = (value) => Number(value || 0).toFixed(1);

const getImagePath = (item) => (
    item?.image
        ? `${BASE_URL}/uploads/${item.image}`
        : 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop'
);

const getShortText = (value, fallback, maxLength = 128) => {
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

const sortByPopularity = (items) => (
    [...items].sort((a, b) => {
        const reviewDiff = getReviews(b).length - getReviews(a).length;
        if (reviewDiff !== 0) return reviewDiff;

        const ratingDiff = getAverageRating(b) - getAverageRating(a);
        if (ratingDiff !== 0) return ratingDiff;

        return getCreatedTime(b) - getCreatedTime(a);
    })
);

const PopularFeed = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [platformStats, setPlatformStats] = useState({ totalUsers: 0 });
    const searchTerm = searchParams.get('q') || '';
    const searchLabel = getSearchQueryLabel(searchTerm);

    useEffect(() => {
        let ignore = false;

        const fetchUMKM = async () => {
            setIsLoading(true);
            try {
                const { data } = await apiClient.get('/umkm');
                if (!ignore) setItems(Array.isArray(data) ? data : []);
            } catch {
                if (!ignore) setItems([]);
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };

        fetchUMKM();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        const fetchStats = async () => {
            try {
                const { data } = await apiClient.get('/auth/stats');
                if (!ignore) {
                    setPlatformStats({ totalUsers: Number(data?.totalUsers || 0) });
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

    const popularItems = useMemo(() => sortByPopularity(items), [items]);
    const highlightItems = useMemo(() => popularItems.slice(0, 5), [popularItems]);

    const visibleItems = useMemo(() => {
        if (!searchLabel) return popularItems;
        return rankUmkmSearchResults(popularItems, searchLabel);
    }, [popularItems, searchLabel]);

    const updateSearchTerm = (nextValue) => {
        const nextParams = new URLSearchParams(searchParams);
        const nextLabel = getSearchQueryLabel(nextValue);
        if (nextLabel) nextParams.set('q', nextLabel);
        else nextParams.delete('q');

        setSearchParams(nextParams, { replace: true });
    };

    const clearSearch = () => {
        updateSearchTerm('');
    };

    const totalReviews = popularItems.reduce((sum, item) => sum + getReviews(item).length, 0);
    return (
        <main className="category-page popular-page">
            <AppNavbar active="feed" isLoggedIn={isLoggedIn} showWorkspaceLinks={isLoggedIn} />

            <header className="category-hero popular-hero" style={{ '--category-image': `url("${POPULAR_HERO_IMAGE}")` }}>
                <div className="category-hero-copy">
                    <span className="category-kicker">Feed paling populer</span>
                    <h1>Paling Ramai Direview</h1>
                    <p>
                        Kumpulan UMKM dengan review dan rating paling kuat, disusun agar kamu cepat menemukan pilihan
                        yang paling dipercaya pengguna Plus Review.
                    </p>

                    <div className="category-hero-stats" aria-label="Ringkasan feed populer">
                        <CategoryStat icon={Store} value={popularItems.length} label="UMKM" />
                        <CategoryStat icon={MessageCircle} value={totalReviews} label="Review" />
                        <CategoryStat icon={UsersRound} value={platformStats.totalUsers} label="Pengguna" />
                    </div>
                </div>
            </header>

            <section className="category-shell">
                <aside className="category-side-panel popular-side-panel" aria-label="Sorotan paling populer">
                    <span className="category-side-eyebrow">Sorotan populer</span>

                    {highlightItems.length > 0 ? (
                        <div className="category-side-list popular-side-list">
                            {highlightItems.map((item, index) => (
                                <button key={item.id} type="button" onClick={() => navigate(`/umkm/${item.id}`)}>
                                    <img src={getImagePath(item)} alt="" />
                                    <span>
                                        <strong>{index + 1}. {item.nama_umkm}</strong>
                                        <small>{getReviews(item).length} review - Rating {formatRating(getAverageRating(item))}</small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="popular-side-empty">
                            <strong>Belum ada sorotan</strong>
                            <span>UMKM dengan review akan tampil di sini.</span>
                        </div>
                    )}

                    <button className="popular-side-action" type="button" onClick={() => navigate(isLoggedIn ? '/tambah' : '/login')}>
                        {isLoggedIn ? 'Tambah UMKM' : 'Login untuk tambah'}
                    </button>
                </aside>

                <section className="category-list-panel">
                    <div className="category-list-head">
                        <div>
                            <span>Daftar pilihan populer</span>
                            <strong>
                                {searchLabel
                                    ? `${visibleItems.length} hasil untuk "${searchLabel}"`
                                    : `${visibleItems.length} UMKM paling populer`}
                            </strong>
                        </div>

                        <form className="category-search" onSubmit={(event) => event.preventDefault()}>
                            <Search aria-hidden="true" />
                            <input
                                value={searchTerm}
                                onChange={(event) => updateSearchTerm(event.target.value)}
                                placeholder="Cari di feed populer"
                                aria-label="Cari UMKM populer"
                            />
                            {searchLabel && (
                                <button className="category-search-clear" type="button" onClick={clearSearch} aria-label="Hapus pencarian">
                                    <X aria-hidden="true" />
                                </button>
                            )}
                        </form>
                    </div>

                    {isLoading ? (
                        <div className="category-state">
                            <strong>Memuat feed populer</strong>
                            <span>Sebentar, daftar UMKM paling ramai sedang disiapkan.</span>
                        </div>
                    ) : visibleItems.length > 0 ? (
                        <div className="category-card-grid">
                            {visibleItems.map((item) => (
                                <PopularUMKMCard key={item.id} item={item} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <div className="category-state">
                            <strong>{searchLabel ? `Tidak ada hasil untuk "${searchLabel}"` : 'Belum ada pilihan populer'}</strong>
                            <span>
                                {searchLabel
                                    ? 'Coba kata kunci lain di feed populer.'
                                    : 'UMKM yang mulai mendapat review dan rating akan tampil otomatis di halaman ini.'}
                            </span>
                            <button type="button" onClick={() => (searchLabel ? clearSearch() : navigate(isLoggedIn ? '/tambah' : '/login'))}>
                                {searchLabel ? 'Hapus pencarian' : isLoggedIn ? 'Tambah UMKM' : 'Login untuk tambah'}
                            </button>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
};

const CategoryStat = ({ icon: Icon, value, label }) => (
    <div className="category-stat">
        <Icon aria-hidden="true" />
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const PopularUMKMCard = ({ item, navigate }) => {
    const reviews = getReviews(item);
    const rating = formatRating(getAverageRating(item));
    const summary = getShortText(
        item.deskripsi || item.alamat_teks || item.harga_range,
        'Detail UMKM belum lengkap.'
    );

    return (
        <article className="category-umkm-card popular-umkm-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="category-umkm-image">
                <img src={getImagePath(item)} alt={item.nama_umkm} />
                <span>{item.jenis_makanan || 'Kuliner'}</span>
            </div>

            <div className="category-umkm-body">
                <h2>{item.nama_umkm}</h2>
                <p>{summary}</p>

                <div className="category-umkm-meta">
                    <span>
                        <Star aria-hidden="true" />
                        Rating {rating}
                    </span>
                    <span>
                        <MessageCircle aria-hidden="true" />
                        {reviews.length} review
                    </span>
                    <span>
                        <Clock aria-hidden="true" />
                        {item.jam_operasional || 'Jam belum diatur'}
                    </span>
                    <span>
                        <Tag aria-hidden="true" />
                        {item.harga_range || 'Harga belum diatur'}
                    </span>
                </div>

                <div className="category-umkm-footer">
                    <span>
                        <MapPin aria-hidden="true" />
                        {item.alamat_teks || 'Alamat belum ditambahkan'}
                    </span>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/umkm/${item.id}`);
                        }}
                    >
                        Buka detail
                    </button>
                </div>
            </div>
        </article>
    );
};

export default PopularFeed;
