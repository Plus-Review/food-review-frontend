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
import SiteFooter from '../components/SiteFooter';
import { getUploadUrl } from '../config/api';
import { getResolvedCategoryLabel } from '../utils/categoryFeeds';
import { getSearchQueryLabel, rankUmkmSearchResults } from '../utils/umkmSearch';
import './CategoryFeed.css';
import './PopularFeed.css';

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
        ? getUploadUrl(item.image)
        : 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop'
);

const getTextPreview = (value, fallback, maxLength = 118) => {
    const text = String(value || '').trim();
    if (!text) return { text: fallback, isTruncated: false };
    if (text.length <= maxLength) return { text, isTruncated: false };
    return { text: `${text.slice(0, maxLength).trim()}...`, isTruncated: true };
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

const sortByLatest = (items) => (
    [...items].sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
);

const PopularFeed = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [platformStats, setPlatformStats] = useState({ totalUsers: 0 });
    const [feedMode, setFeedMode] = useState('popular');
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
    const latestItems = useMemo(() => sortByLatest(items), [items]);
    const feedCategories = useMemo(() => ([
        {
            key: 'popular',
            label: 'Paling Populer',
            description: 'Diurutkan dari review terbanyak, rating tertinggi, lalu update terbaru.',
            items: popularItems,
            Icon: Star,
        },
        {
            key: 'latest',
            label: 'Terbaru',
            description: 'Diurutkan dari UMKM yang paling baru masuk atau paling baru diperbarui.',
            items: latestItems,
            Icon: Clock,
        },
    ]), [latestItems, popularItems]);
    const activeCategory = feedCategories.find((category) => category.key === feedMode) || feedCategories[0];
    const activeItems = activeCategory.items;
    const highlightItems = useMemo(() => activeItems.slice(0, 2), [activeItems]);

    const visibleItems = useMemo(() => {
        if (!searchLabel) return activeItems;
        return rankUmkmSearchResults(activeItems, searchLabel);
    }, [activeItems, searchLabel]);

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
                    <span className="category-kicker">Feed {activeCategory.label.toLowerCase()}</span>
                    <h1>{activeCategory.label === 'Terbaru' ? 'Update UMKM Terbaru' : 'Paling Ramai Direview'}</h1>
                    <p>
                        {activeCategory.key === 'latest'
                            ? 'Kumpulan UMKM yang paling baru masuk atau diperbarui, disusun agar kamu tidak melewatkan rekomendasi terbaru.'
                            : 'Kumpulan UMKM dengan review dan rating paling kuat, disusun agar kamu cepat menemukan pilihan yang paling dipercaya pengguna Plus Review.'}
                    </p>

                    <div className="category-hero-stats" aria-label="Ringkasan feed populer">
                        <CategoryStat icon={Store} value={popularItems.length} label="UMKM" />
                        <CategoryStat icon={MessageCircle} value={totalReviews} label="Review" />
                        <CategoryStat icon={UsersRound} value={platformStats.totalUsers} label="Pengguna" />
                    </div>
                </div>
            </header>

            <section className="category-shell">
                <aside className="category-side-panel popular-side-panel" aria-label="Feed by kategori">
                    <span className="category-side-eyebrow">Pilihan kategori</span>

                    <div className="popular-mode-list" aria-label="Pilihan kategori feed populer">
                        {feedCategories.map((category) => {
                            const Icon = category.Icon;
                            const topItem = category.items[0];

                            return (
                                <button
                                    key={category.key}
                                    className={feedMode === category.key ? 'is-active' : undefined}
                                    type="button"
                                    onClick={() => setFeedMode(category.key)}
                                >
                                    <span className="popular-mode-icon" aria-hidden="true">
                                        <Icon />
                                    </span>
                                    <span>
                                        <strong>{category.label}</strong>
                                        <small>
                                            {category.items.length} UMKM
                                            {topItem ? ` - ${topItem.nama_umkm}` : ''}
                                        </small>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {highlightItems.length > 0 ? (
                        <div className="category-side-list popular-side-list">
                            <span className="popular-side-heading">Isi {activeCategory.label}</span>
                            {highlightItems.map((item, index) => (
                                <button key={item.id} type="button" onClick={() => navigate(`/umkm/${item.id}`)}>
                                    <img src={getImagePath(item)} alt="" loading="lazy" decoding="async" />
                                    <span>
                                        <strong>{index + 1}. {item.nama_umkm}</strong>
                                        <small>
                                            {activeCategory.key === 'latest'
                                                ? `${item.jam_operasional || item.jenis_makanan || 'UMKM terbaru'}`
                                                : `${getReviews(item).length} review - Rating ${formatRating(getAverageRating(item))}`}
                                        </small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="popular-side-empty">
                            <strong>Belum ada isi kategori</strong>
                            <span>UMKM akan tampil otomatis sesuai kategori yang dipilih.</span>
                        </div>
                    )}

                    <button className="popular-side-action" type="button" onClick={() => navigate(isLoggedIn ? '/tambah' : '/login')}>
                        {isLoggedIn ? 'Tambah UMKM' : 'Login untuk tambah'}
                    </button>
                </aside>

                <section className="category-list-panel">
                    <div className="category-list-head">
                        <div>
                            <span>{activeCategory.key === 'latest' ? 'Daftar update terbaru' : 'Daftar pilihan populer'}</span>
                            <strong>
                                {searchLabel
                                    ? `${visibleItems.length} hasil untuk "${searchLabel}"`
                                    : `${visibleItems.length} UMKM ${activeCategory.label.toLowerCase()}`}
                            </strong>
                        </div>

                        <form className="category-search" onSubmit={(event) => event.preventDefault()}>
                            <Search aria-hidden="true" />
                            <input
                                value={searchTerm}
                                onChange={(event) => updateSearchTerm(event.target.value)}
                                placeholder={`Cari di feed ${activeCategory.label.toLowerCase()}`}
                                aria-label={`Cari UMKM ${activeCategory.label.toLowerCase()}`}
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
                            <strong>Memuat feed {activeCategory.label.toLowerCase()}</strong>
                            <span>Sebentar, daftar UMKM {activeCategory.label.toLowerCase()} sedang disiapkan.</span>
                        </div>
                    ) : visibleItems.length > 0 ? (
                        <div className="category-card-grid">
                            {visibleItems.map((item) => (
                                <PopularUMKMCard key={item.id} item={item} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <div className="category-state">
                            <strong>{searchLabel ? `Tidak ada hasil untuk "${searchLabel}"` : `Belum ada UMKM ${activeCategory.label.toLowerCase()}`}</strong>
                            <span>
                                {searchLabel
                                    ? `Coba kata kunci lain di feed ${activeCategory.label.toLowerCase()}.`
                                    : 'UMKM akan tampil otomatis sesuai data yang masuk.'}
                            </span>
                            <button type="button" onClick={() => (searchLabel ? clearSearch() : navigate(isLoggedIn ? '/tambah' : '/login'))}>
                                {searchLabel ? 'Hapus pencarian' : isLoggedIn ? 'Tambah UMKM' : 'Login untuk tambah'}
                            </button>
                        </div>
                    )}
                </section>
            </section>
            <SiteFooter />
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
    const categoryLabel = getResolvedCategoryLabel(item);
    const summary = getTextPreview(
        item.deskripsi || item.alamat_teks || item.harga_range,
        'Detail UMKM belum lengkap.'
    );
    const address = getTextPreview(item.alamat_teks, 'Alamat belum ditambahkan', 72);
    const openDetail = (event) => {
        event.stopPropagation();
        navigate(`/umkm/${item.id}`);
    };

    return (
        <article className="category-umkm-card popular-umkm-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="category-umkm-image">
                <img src={getImagePath(item)} alt={item.nama_umkm} loading="lazy" decoding="async" />
                <span>{categoryLabel}</span>
            </div>

            <div className="category-umkm-body">
                <h2>{item.nama_umkm}</h2>
                <div className="category-card-summary">
                    <p>{summary.text}</p>
                    {summary.isTruncated && (
                        <button type="button" className="category-inline-more" onClick={openDetail}>
                            Buka detail
                        </button>
                    )}
                </div>

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
                        <span>{address.text}</span>
                    </span>
                    <button
                        type="button"
                        onClick={openDetail}
                    >
                        Buka detail
                    </button>
                </div>
            </div>
        </article>
    );
};

export default PopularFeed;
