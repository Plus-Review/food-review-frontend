import { useEffect, useMemo, useState } from 'react';
import {
    Clock,
    MapPin,
    MessageCircle,
    PencilLine,
    Plus,
    Search,
    Star,
    Store,
    Tag,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import { getUploadUrl } from '../config/api';
import { getSearchQueryLabel, rankUmkmSearchResults } from '../utils/umkmSearch';
import './CategoryFeed.css';
import './MyUMKM.css';

const MY_UMKM_HERO_IMAGE = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?q=80&w=1800&auto=format&fit=crop';

const getCachedUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
};

const getReviews = (item) => (Array.isArray(item?.reviews) ? item.reviews : []);

const getAverageRating = (item) => {
    const reviews = getReviews(item);
    if (reviews.length === 0) return 0;

    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
};

const formatRating = (value) => Number(value || 0).toFixed(1);

const getCreatedTime = (item) => {
    const createdTime = new Date(item.createdAt || item.updatedAt || 0).getTime();
    if (Number.isFinite(createdTime) && createdTime > 0) return createdTime;
    return Number(item.id || 0);
};

const getImagePath = (item) => (
    item?.image
        ? getUploadUrl(item.image)
        : 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop'
);

const getShortText = (value, fallback, maxLength = 126) => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
};

const getVerificationLabel = (status) => {
    const normalized = status || 'approved';
    if (normalized === 'pending_create') return 'Menunggu verifikasi';
    if (normalized === 'pending_update') return 'Edit menunggu';
    if (normalized === 'rejected') return 'Ditolak admin';
    return 'Approved';
};

const MyUMKM = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [profile, setProfile] = useState(() => (isLoggedIn ? getCachedUser() : null));
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(isLoggedIn);
    const [searchTerm, setSearchTerm] = useState('');
    const searchLabel = getSearchQueryLabel(searchTerm);
    const profileId = profile?.id;

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        let ignore = false;

        apiClient.get('/auth/profile')
            .then(({ data }) => {
                if (!ignore) {
                    setProfile(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            })
            .catch(() => {
                // Data cache tetap dipakai saat backend profile belum bisa dibaca.
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

        const fetchUMKM = async () => {
            setIsLoading(true);
            try {
                const { data } = await apiClient.get('/umkm/mine');
                if (!ignore) setItems(Array.isArray(data) ? data : []);
            } catch {
                if (!ignore) setItems([]);
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };

        fetchUMKM();
        window.addEventListener('umkm-updated', fetchUMKM);

        return () => {
            ignore = true;
            window.removeEventListener('umkm-updated', fetchUMKM);
        };
    }, [isLoggedIn]);

    const myItems = useMemo(() => {
        if (!profileId) return [];

        return items
            .sort((a, b) => getCreatedTime(b) - getCreatedTime(a));
    }, [items, profileId]);

    const visibleItems = useMemo(() => {
        if (!searchLabel) return myItems;
        return rankUmkmSearchResults(myItems, searchLabel);
    }, [myItems, searchLabel]);

    const totalReviews = useMemo(() => (
        myItems.reduce((sum, item) => sum + getReviews(item).length, 0)
    ), [myItems]);

    const averageRating = useMemo(() => {
        if (myItems.length === 0) return 0;
        return myItems.reduce((sum, item) => sum + getAverageRating(item), 0) / myItems.length;
    }, [myItems]);

    return (
        <main className="category-page my-umkm-page">
            <AppNavbar active="umkm-saya" isLoggedIn={isLoggedIn} showWorkspaceLinks={isLoggedIn} />

            <header className="my-umkm-hero" style={{ '--my-umkm-hero-image': `url("${MY_UMKM_HERO_IMAGE}")` }}>
                <div className="my-umkm-hero-copy">
                    <span className="category-kicker">Ruang kelola</span>
                    <h1>UMKM Saya</h1>
                    <p>
                        Semua UMKM yang kamu tambahkan dikumpulkan di satu tempat, siap dibuka, dicek, dan dirapikan lagi.
                    </p>

                    <div className="category-hero-stats" aria-label="Ringkasan UMKM saya">
                        <MyUMKMStat icon={Store} value={myItems.length} label="UMKM" />
                        <MyUMKMStat icon={MessageCircle} value={totalReviews} label="Review" />
                        <MyUMKMStat icon={Star} value={formatRating(averageRating)} label="Rating" />
                    </div>
                </div>
            </header>

            <section className="my-umkm-shell">
                {!isLoggedIn ? (
                    <div className="category-state">
                        <strong>Login untuk melihat UMKM milikmu</strong>
                        <span>Daftar ini mengikuti akun yang sedang kamu gunakan.</span>
                        <button type="button" onClick={() => navigate('/login')}>Login</button>
                    </div>
                ) : (
                    <>
                        <div className="my-umkm-toolbar">
                            <div>
                                <span>Daftar milikmu</span>
                                <strong>
                                    {searchLabel
                                        ? `${visibleItems.length} hasil untuk "${searchLabel}"`
                                        : `${myItems.length} UMKM yang kamu input`}
                                </strong>
                            </div>

                            <form className="my-umkm-search" onSubmit={(event) => event.preventDefault()}>
                                <Search aria-hidden="true" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Cari UMKM milikmu"
                                    aria-label="Cari UMKM saya"
                                />
                                {searchLabel && (
                                    <button type="button" onClick={() => setSearchTerm('')} aria-label="Hapus pencarian">
                                        <X aria-hidden="true" />
                                    </button>
                                )}
                            </form>

                            <button className="my-umkm-add" type="button" onClick={() => navigate('/tambah')}>
                                <Plus aria-hidden="true" />
                                Tambah UMKM
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="category-state">
                                <strong>Memuat UMKM milikmu</strong>
                                <span>Sebentar, daftar kelola sedang disiapkan.</span>
                            </div>
                        ) : visibleItems.length > 0 ? (
                            <div className="my-umkm-grid">
                                {visibleItems.map((item) => (
                                    <MyUMKMCard key={item.id} item={item} navigate={navigate} />
                                ))}
                            </div>
                        ) : (
                            <div className="category-state">
                                <strong>{searchLabel ? `Tidak ada hasil untuk "${searchLabel}"` : 'Belum ada UMKM milikmu'}</strong>
                                <span>
                                    {searchLabel
                                        ? 'Coba kata kunci lain atau hapus pencarian.'
                                        : 'Tambahkan UMKM pertama agar muncul di halaman kelola ini.'}
                                </span>
                                <button type="button" onClick={() => (searchLabel ? setSearchTerm('') : navigate('/tambah'))}>
                                    {searchLabel ? 'Hapus pencarian' : 'Tambah UMKM'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
};

const MyUMKMStat = ({ icon: Icon, value, label }) => (
    <div className="category-stat">
        <Icon aria-hidden="true" />
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const MyUMKMCard = ({ item, navigate }) => {
    const reviews = getReviews(item);
    const rating = formatRating(getAverageRating(item));
    const summary = getShortText(
        item.deskripsi || item.alamat_teks || item.harga_range,
        'Detail UMKM belum lengkap.'
    );

    return (
        <article className="my-umkm-card" onClick={() => navigate(`/umkm/${item.id}`)}>
            <div className="my-umkm-image">
                <img src={getImagePath(item)} alt={item.nama_umkm} />
                <span>{item.jenis_makanan || 'Kuliner'}</span>
            </div>

            <div className="my-umkm-body">
                <div>
                    <span className={`my-umkm-status is-${item.verification_status || 'approved'}`}>
                        {getVerificationLabel(item.verification_status)}
                    </span>
                    <h2>{item.nama_umkm}</h2>
                    <p>{summary}</p>
                </div>

                <div className="my-umkm-meta">
                    <span>
                        <Star aria-hidden="true" />
                        {rating}
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

                <div className="my-umkm-footer">
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
                        <PencilLine aria-hidden="true" />
                        Kelola
                    </button>
                </div>
            </div>
        </article>
    );
};

export default MyUMKM;
