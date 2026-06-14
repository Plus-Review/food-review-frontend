import { useEffect, useMemo, useState } from 'react';
import {
    Bookmark,
    Clock,
    MapPin,
    MessageCircle,
    Star,
    Tag,
    Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import './CategoryFeed.css';
import './SavedUMKM.css';

const BASE_URL = 'http://localhost:5000';

const getReviews = (item) => (Array.isArray(item?.reviews) ? item.reviews : []);

const getAverageRating = (item) => {
    const reviews = getReviews(item);
    if (reviews.length === 0) return 0;

    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
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

const SavedUMKM = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(isLoggedIn);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        let ignore = false;

        const fetchSaved = async () => {
            setIsLoading(true);
            try {
                const { data } = await apiClient.get('/umkm/saved');
                if (!ignore) setItems(Array.isArray(data) ? data : []);
            } catch (error) {
                if (!ignore) {
                    setItems([]);
                    setNotice({
                        type: 'error',
                        message: error.response?.data?.message || 'Gagal mengambil UMKM tersimpan.',
                    });
                }
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };

        fetchSaved();

        return () => {
            ignore = true;
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!notice) return undefined;

        const timeout = window.setTimeout(() => setNotice(null), 4200);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    const totalReviews = useMemo(() => (
        items.reduce((sum, item) => sum + getReviews(item).length, 0)
    ), [items]);

    const averageRating = useMemo(() => {
        if (items.length === 0) return 0;
        return items.reduce((sum, item) => sum + getAverageRating(item), 0) / items.length;
    }, [items]);

    const handleRemoveSaved = async (itemId) => {
        try {
            await apiClient.delete(`/umkm/${itemId}/save`);
            setItems((current) => current.filter((item) => Number(item.id) !== Number(itemId)));
            setNotice({ type: 'success', message: 'UMKM dihapus dari daftar simpanan.' });
            window.dispatchEvent(new Event('saved-umkm-updated'));
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal menghapus simpanan.',
            });
        }
    };

    return (
        <main className="category-page saved-page">
            <AppNavbar active="feed" isLoggedIn={isLoggedIn} showWorkspaceLinks={isLoggedIn} />

            <header className="saved-hero">
                <div className="saved-hero-copy">
                    <span className="category-kicker">Daftar personal</span>
                    <h1>UMKM Disimpan</h1>
                    <p>
                        Tempat makan yang kamu tandai untuk dibuka lagi nanti, tanpa perlu mencari ulang di feed.
                    </p>

                    <div className="category-hero-stats" aria-label="Ringkasan UMKM tersimpan">
                        <SavedStat icon={Bookmark} value={items.length} label="Tersimpan" />
                        <SavedStat icon={MessageCircle} value={totalReviews} label="Review" />
                        <SavedStat icon={Star} value={formatRating(averageRating)} label="Rating" />
                    </div>
                </div>
            </header>

            <section className="saved-shell">
                {notice && (
                    <div className={`saved-notice is-${notice.type}`} role="status">
                        {notice.message}
                    </div>
                )}

                {!isLoggedIn ? (
                    <div className="category-state">
                        <strong>Login untuk melihat simpanan</strong>
                        <span>Daftar UMKM tersimpan akan mengikuti akun yang sedang kamu gunakan.</span>
                        <button type="button" onClick={() => navigate('/login')}>Login</button>
                    </div>
                ) : isLoading ? (
                    <div className="category-state">
                        <strong>Memuat simpanan</strong>
                        <span>Sebentar, daftar UMKM tersimpan sedang disiapkan.</span>
                    </div>
                ) : items.length > 0 ? (
                    <div className="saved-card-grid">
                        {items.map((item) => (
                            <SavedCard
                                key={item.id}
                                item={item}
                                navigate={navigate}
                                onRemove={handleRemoveSaved}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="category-state">
                        <strong>Belum ada UMKM tersimpan</strong>
                        <span>Tekan tombol Simpan nanti di halaman detail UMKM agar muncul di sini.</span>
                        <button type="button" onClick={() => navigate('/#feed')}>Buka feed</button>
                    </div>
                )}
            </section>
        </main>
    );
};

const SavedStat = ({ icon: Icon, value, label }) => (
    <div className="category-stat">
        <Icon aria-hidden="true" />
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const SavedCard = ({ item, navigate, onRemove }) => {
    const reviews = getReviews(item);
    const rating = formatRating(getAverageRating(item));
    const summary = getShortText(
        item.deskripsi || item.alamat_teks || item.harga_range,
        'Detail UMKM belum lengkap.'
    );

    return (
        <article className="saved-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="saved-card-image">
                <img src={getImagePath(item)} alt={item.nama_umkm} />
                <span>{item.jenis_makanan || 'Kuliner'}</span>
            </div>

            <div className="saved-card-body">
                <div>
                    <h2>{item.nama_umkm}</h2>
                    <p>{summary}</p>
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

                <div className="saved-card-footer">
                    <span>
                        <MapPin aria-hidden="true" />
                        {item.alamat_teks || 'Alamat belum ditambahkan'}
                    </span>
                    <div>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/umkm/${item.id}`);
                            }}
                        >
                            Buka detail
                        </button>
                        <button
                            className="is-remove"
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onRemove(item.id);
                            }}
                        >
                            <Trash2 aria-hidden="true" />
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default SavedUMKM;
