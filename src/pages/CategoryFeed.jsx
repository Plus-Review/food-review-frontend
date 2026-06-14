import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Clock,
    MapPin,
    MessageCircle,
    Search,
    Star,
    Store,
    Tag,
    X,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import { CATEGORY_FEEDS, getCategoryFeedByKey, getCategoryFeedKey } from '../utils/categoryFeeds';
import { getSearchQueryLabel, rankUmkmSearchResults } from '../utils/umkmSearch';
import './CategoryFeed.css';

const BASE_URL = 'http://localhost:5000';

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

const CategoryFeed = () => {
    const { categoryKey } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const category = getCategoryFeedByKey(categoryKey) || CATEGORY_FEEDS[0];
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
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

    const categoryCounts = useMemo(() => (
        CATEGORY_FEEDS.reduce((acc, feed) => {
            acc[feed.key] = items.filter((item) => getCategoryFeedKey(item) === feed.key).length;
            return acc;
        }, {})
    ), [items]);

    const categoryItems = useMemo(() => (
        items
            .filter((item) => getCategoryFeedKey(item) === category.key)
            .sort((a, b) => {
                const reviewDiff = getReviews(b).length - getReviews(a).length;
                if (reviewDiff !== 0) return reviewDiff;

                const ratingDiff = getAverageRating(b) - getAverageRating(a);
                if (ratingDiff !== 0) return ratingDiff;

                return getCreatedTime(b) - getCreatedTime(a);
            })
    ), [category.key, items]);

    const visibleItems = useMemo(() => {
        if (!searchLabel) return categoryItems;
        return rankUmkmSearchResults(categoryItems, searchLabel);
    }, [categoryItems, searchLabel]);

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

    const totalReviews = categoryItems.reduce((sum, item) => sum + getReviews(item).length, 0);
    const categoryRating = categoryItems.length === 0
        ? 0
        : categoryItems.reduce((sum, item) => sum + getAverageRating(item), 0) / categoryItems.length;

    return (
        <main className="category-page">
            <AppNavbar active="feed" isLoggedIn={isLoggedIn} showWorkspaceLinks={isLoggedIn} />

            <header className="category-hero" style={{ '--category-image': `url("${category.heroImageUrl || category.imageUrl}")` }}>
                <div className="category-hero-copy">
                    <span className="category-kicker">Feed kategori</span>
                    <h1>{category.label}</h1>
                    <p>{category.description}</p>

                    <div className="category-hero-stats" aria-label="Ringkasan kategori">
                        <CategoryStat icon={Store} value={categoryItems.length} label="UMKM" />
                        <CategoryStat icon={MessageCircle} value={totalReviews} label="Review" />
                        <CategoryStat icon={Star} value={formatRating(categoryRating)} label="Rating" />
                    </div>
                </div>
            </header>

            <section className="category-shell">
                <aside className="category-side-panel" aria-label="Kategori lain">
                    <span className="category-side-eyebrow">Pilih kategori</span>
                    <div className="category-side-list">
                        {CATEGORY_FEEDS.map((feed) => (
                            <button
                                key={feed.key}
                                className={feed.key === category.key ? 'is-active' : undefined}
                                type="button"
                                onClick={() => navigate(`/kategori/${feed.key}`)}
                            >
                                <img src={feed.imageUrl} alt="" referrerPolicy="no-referrer" />
                                <span>
                                    <strong>{feed.label}</strong>
                                    <small>{categoryCounts[feed.key] || 0} UMKM</small>
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="category-list-panel">
                    <div className="category-list-head">
                        <div>
                            <span>Daftar pilihan</span>
                            <strong>
                                {searchLabel
                                    ? `${visibleItems.length} hasil untuk "${searchLabel}"`
                                    : `${visibleItems.length} UMKM ${category.label}`}
                            </strong>
                        </div>

                        <form className="category-search" onSubmit={(event) => event.preventDefault()}>
                            <Search aria-hidden="true" />
                            <input
                                value={searchTerm}
                                onChange={(event) => updateSearchTerm(event.target.value)}
                                placeholder="Cari di kategori ini"
                                aria-label="Cari UMKM kategori"
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
                            <strong>Memuat kategori</strong>
                            <span>Sebentar, daftar UMKM sedang disiapkan.</span>
                        </div>
                    ) : visibleItems.length > 0 ? (
                        <div className="category-card-grid">
                            {visibleItems.map((item) => (
                                <CategoryUMKMCard key={item.id} item={item} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <div className="category-state">
                            <strong>{searchLabel ? `Tidak ada hasil untuk "${searchLabel}"` : `${category.label} belum punya pilihan`}</strong>
                            <span>
                                {searchLabel
                                    ? 'Coba kata kunci lain di kategori ini.'
                                    : 'UMKM yang cocok dengan kategori ini akan muncul otomatis setelah ditambahkan.'}
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

const CategoryUMKMCard = ({ item, navigate }) => {
    const reviews = getReviews(item);
    const rating = formatRating(getAverageRating(item));
    const summary = getShortText(
        item.deskripsi || item.alamat_teks || item.harga_range,
        'Detail UMKM belum lengkap.'
    );

    return (
        <article className="category-umkm-card" onClick={() => navigate(`/umkm/${item.id}`)}>
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

export default CategoryFeed;
