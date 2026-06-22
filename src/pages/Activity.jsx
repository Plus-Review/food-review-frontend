import { useEffect, useMemo, useState } from 'react';
import {
    Activity as ActivityIcon,
    ArrowUpRight,
    Camera,
    Clock,
    Image as ImageIcon,
    MessageCircle,
    Star,
    Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import { getUploadUrl } from '../config/api';
import './Activity.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=900&auto=format&fit=crop';

const getCachedUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
};

const resolveUploadUrl = (filename) => {
    if (!filename) return '';
    return getUploadUrl(filename);
};

const getUmkmImage = (umkm) => resolveUploadUrl(umkm?.image) || FALLBACK_IMAGE;

const getReviewImages = (activity) => (
    Array.isArray(activity?.images) ? activity.images.filter(Boolean) : []
);

const getReviews = (umkm) => (
    Array.isArray(umkm?.reviews) ? umkm.reviews : []
);

const getAverageRating = (umkm) => {
    const reviews = getReviews(umkm);
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
};

const formatRating = (value) => Number(value || 0).toFixed(1);

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Baru saja';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const getProfileName = (profile) => {
    const rawName = String(profile?.username || profile?.nama || profile?.email || 'Akun').trim();
    if (!rawName) return 'Akun';
    if (rawName.includes('@')) return rawName.split('@')[0] || 'Akun';
    return rawName;
};

const Activity = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [profile, setProfile] = useState(() => (isLoggedIn ? getCachedUser() : null));
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({ total: 0, totalPhotos: 0, averageRating: 0 });
    const [isLoading, setIsLoading] = useState(isLoggedIn);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        let ignore = false;

        const loadProfile = async () => {
            try {
                const { data } = await apiClient.get('/auth/profile');
                if (ignore) return;
                setProfile(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } catch {
                // Data cache tetap cukup untuk sapaan halaman aktivitas.
            }
        };

        loadProfile();

        return () => {
            ignore = true;
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        let ignore = false;

        const loadActivity = async () => {
            setIsLoading(true);
            setNotice(null);

            try {
                const { data } = await apiClient.get('/umkm/activity');
                if (ignore) return;

                const nextActivities = Array.isArray(data?.activities) ? data.activities : [];
                setActivities(nextActivities);
                setStats({
                    total: Number(data?.total ?? nextActivities.length),
                    totalPhotos: Number(data?.totalPhotos || 0),
                    averageRating: Number(data?.averageRating || 0),
                });
            } catch (error) {
                if (ignore) return;
                setActivities([]);
                setStats({ total: 0, totalPhotos: 0, averageRating: 0 });
                setNotice({
                    type: 'error',
                    message: error.response?.data?.message || 'Gagal memuat aktivitas review.',
                });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };

        loadActivity();
        window.addEventListener('activity-updated', loadActivity);

        return () => {
            ignore = true;
            window.removeEventListener('activity-updated', loadActivity);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!notice) return undefined;

        const timeout = window.setTimeout(() => setNotice(null), 4300);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    const profileName = useMemo(() => getProfileName(profile), [profile]);
    const latestActivity = activities[0];

    return (
        <main className="activity-page">
            <AppNavbar active="profile" isLoggedIn={isLoggedIn} showWorkspaceLinks={isLoggedIn} />

            <header className="activity-hero">
                <div className="activity-hero-copy">
                    <span className="activity-kicker">
                        <ActivityIcon aria-hidden="true" />
                        Aktivitas akun
                    </span>
                    <h1>Review dan komen yang kamu kirim</h1>
                    <p>
                        Semua jejak review kamu tersusun rapi di sini, lengkap dengan rating, foto, waktu kirim,
                        dan akses cepat ke UMKM yang pernah kamu komentari.
                    </p>

                    <div className="activity-hero-stats" aria-label="Ringkasan aktivitas">
                        <ActivityStat icon={MessageCircle} value={stats.total} label="Review" />
                        <ActivityStat icon={Star} value={formatRating(stats.averageRating)} label="Rata rating" />
                        <ActivityStat icon={Camera} value={stats.totalPhotos} label="Foto terkirim" />
                    </div>
                </div>
            </header>

            <section className="activity-shell">
                <aside className="activity-side-card" aria-label="Ringkasan akun">
                    <span className="activity-side-icon">
                        <ActivityIcon aria-hidden="true" />
                    </span>
                    <strong>{profileName}</strong>
                    <p>
                        {latestActivity
                            ? `Aktivitas terakhir: ${formatDate(latestActivity.createdAt)}`
                            : 'Belum ada aktivitas review yang tercatat.'}
                    </p>
                    <button type="button" onClick={() => navigate('/#feed')}>
                        Cari UMKM untuk direview
                    </button>
                </aside>

                <section className="activity-list-panel">
                    <div className="activity-list-head">
                        <div>
                            <span>Riwayat aktivitas</span>
                            <strong>{activities.length} review terkirim</strong>
                        </div>
                    </div>

                    {notice && (
                        <div className={`activity-notice is-${notice.type}`} role="status">
                            {notice.message}
                        </div>
                    )}

                    {!isLoggedIn ? (
                        <ActivityState
                            title="Login untuk melihat aktivitas"
                            text="Aktivitas review hanya bisa dibuka oleh akun yang sedang login."
                            actionLabel="Login"
                            onAction={() => navigate('/login')}
                        />
                    ) : isLoading ? (
                        <ActivityState
                            title="Memuat aktivitas"
                            text="Sebentar, riwayat review kamu sedang disusun."
                        />
                    ) : activities.length > 0 ? (
                        <div className="activity-list">
                            {activities.map((activity) => (
                                <ActivityCard key={activity.id} activity={activity} navigate={navigate} />
                            ))}
                        </div>
                    ) : (
                        <ActivityState
                            title="Belum ada review"
                            text="Review yang kamu kirim di detail UMKM akan muncul di halaman ini."
                            actionLabel="Buka feed"
                            onAction={() => navigate('/#feed')}
                        />
                    )}
                </section>
            </section>
        </main>
    );
};

const ActivityStat = ({ icon: Icon, value, label }) => (
    <div className="activity-stat">
        <Icon aria-hidden="true" />
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const ActivityState = ({ title, text, actionLabel, onAction }) => (
    <div className="activity-state">
        <strong>{title}</strong>
        <span>{text}</span>
        {actionLabel && (
            <button type="button" onClick={onAction}>
                {actionLabel}
            </button>
        )}
    </div>
);

const ActivityCard = ({ activity, navigate }) => {
    const umkm = activity.umkm;
    const reviewImages = getReviewImages(activity);
    const previewImages = reviewImages.slice(0, 3);
    const reviewCount = getReviews(umkm).length;
    const umkmRating = formatRating(getAverageRating(umkm));

    const openDetail = () => {
        if (umkm?.id) navigate(`/umkm/${umkm.id}`);
    };

    return (
        <article className="activity-card">
            <button className="activity-card-image" type="button" onClick={openDetail} disabled={!umkm?.id}>
                <img src={getUmkmImage(umkm)} alt={umkm?.nama_umkm || 'UMKM'} loading="lazy" decoding="async" />
                <span>{umkm?.jenis_makanan || 'Kuliner'}</span>
            </button>

            <div className="activity-card-body">
                <div className="activity-card-top">
                    <div>
                        <span className="activity-card-label">Review kamu</span>
                        <h2>{umkm?.nama_umkm || 'UMKM tidak tersedia'}</h2>
                    </div>
                    <span className="activity-card-date">
                        <Clock aria-hidden="true" />
                        {formatDate(activity.createdAt)}
                    </span>
                </div>

                <div className="activity-review-line">
                    <span>
                        <Star aria-hidden="true" />
                        {formatRating(activity.rating)}
                    </span>
                    <span>
                        <MessageCircle aria-hidden="true" />
                        {reviewCount} review UMKM
                    </span>
                    <span>
                        <Store aria-hidden="true" />
                        Rating UMKM {umkmRating}
                    </span>
                </div>

                <p className="activity-comment">{activity.komentar || 'Komentar tidak tersedia.'}</p>

                <div className="activity-card-footer">
                    {previewImages.length > 0 ? (
                        <div className="activity-photo-strip" aria-label="Foto review">
                            {previewImages.map((image, index) => (
                                <span key={`${image}-${index}`}>
                                    <img src={resolveUploadUrl(image)} alt={`Foto review ${index + 1}`} loading="lazy" decoding="async" />
                                </span>
                            ))}
                            {reviewImages.length > previewImages.length && (
                                <em>+{reviewImages.length - previewImages.length}</em>
                            )}
                        </div>
                    ) : (
                        <span className="activity-no-photo">
                            <ImageIcon aria-hidden="true" />
                            Tanpa foto review
                        </span>
                    )}

                    <button type="button" onClick={openDetail} disabled={!umkm?.id}>
                        <span>Buka UMKM</span>
                        <ArrowUpRight aria-hidden="true" />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default Activity;
