import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    Bell,
    CheckCircle2,
    Clock3,
    Inbox,
    MailOpen,
    RefreshCw,
    Store,
    XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import { getUploadUrl } from '../config/api';
import './Notifications.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop';

const TYPE_META = {
    umkm_create_approved: { icon: CheckCircle2, tone: 'success', label: 'Disetujui' },
    umkm_update_approved: { icon: CheckCircle2, tone: 'success', label: 'Perubahan disetujui' },
    umkm_create_rejected: { icon: XCircle, tone: 'danger', label: 'Ditolak' },
    umkm_update_rejected: { icon: XCircle, tone: 'danger', label: 'Edit ditolak' },
    umkm_pending_create: { icon: Clock3, tone: 'warning', label: 'Menunggu admin' },
    umkm_pending_update: { icon: Clock3, tone: 'warning', label: 'Edit menunggu' },
    umkm_submitted: { icon: Clock3, tone: 'warning', label: 'Terkirim' },
    umkm_resubmitted: { icon: Clock3, tone: 'warning', label: 'Dikirim ulang' },
    umkm_update_submitted: { icon: Clock3, tone: 'warning', label: 'Perubahan terkirim' },
    umkm_admin_note: { icon: AlertCircle, tone: 'info', label: 'Catatan admin' },
};

const getMeta = (type) => TYPE_META[type] || { icon: Bell, tone: 'info', label: 'Notifikasi' };

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Baru saja';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const getImagePath = (item) => {
    const image = item?.umkm?.image;
    return image ? getUploadUrl(image) : FALLBACK_IMAGE;
};

const Notifications = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [notifications, setNotifications] = useState([]);
    const [summary, setSummary] = useState({ total: 0, unread: 0 });
    const [isLoading, setIsLoading] = useState(isLoggedIn);
    const [notice, setNotice] = useState(null);

    const loadNotifications = async () => {
        if (!isLoggedIn) return;

        setIsLoading(true);
        setNotice(null);

        try {
            const { data } = await apiClient.get('/notifications');
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            setSummary({
                total: Number(data.total || 0),
                unread: Number(data.unread || 0),
            });
            window.dispatchEvent(new Event('notifications-updated'));
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal memuat notifikasi.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        const timeout = window.setTimeout(() => {
            void loadNotifications();
        }, 0);
        window.addEventListener('umkm-updated', loadNotifications);

        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener('umkm-updated', loadNotifications);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    const latestNotification = notifications[0];
    const rejectedCount = useMemo(() => (
        notifications.filter((item) => String(item.type || '').includes('rejected')).length
    ), [notifications]);

    const markRead = async (notification) => {
        if (!notification || notification.isRead) return;

        try {
            await apiClient.patch(`/notifications/${notification.id}/read`);
            await loadNotifications();
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Notifikasi belum bisa ditandai dibaca.',
            });
        }
    };

    const markAllRead = async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            await loadNotifications();
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal menandai semua notifikasi.',
            });
        }
    };

    const openUmkm = async (notification) => {
        await markRead(notification);
        if (notification?.relatedUmkmId) {
            navigate(`/umkm/${notification.relatedUmkmId}`);
        }
    };

    return (
        <main className="notification-page">
            <AppNavbar active="profile" isLoggedIn={isLoggedIn} showWorkspaceLinks={isLoggedIn} />

            <section className="notification-hero">
                <div className="notification-hero-copy">
                    <span className="notification-kicker">
                        <Bell aria-hidden="true" />
                        Pusat notifikasi
                    </span>
                    <h1>Status UMKM dan kabar admin ada di sini.</h1>
                    <p>
                        Pantau apakah UMKM yang kamu tambah atau edit sudah disetujui, masih antre,
                        atau perlu diperbaiki dengan alasan yang jelas dari admin.
                    </p>
                </div>

                <div className="notification-summary-grid" aria-label="Ringkasan notifikasi">
                    <NotificationStat icon={Inbox} value={summary.total} label="Total notif" />
                    <NotificationStat icon={Bell} value={summary.unread} label="Belum dibaca" />
                    <NotificationStat icon={XCircle} value={rejectedCount} label="Butuh revisi" />
                </div>
            </section>

            <section className="notification-shell">
                {!isLoggedIn ? (
                    <NotificationState
                        icon={Bell}
                        title="Login untuk melihat notifikasi"
                        text="Notifikasi mengikuti akun Plus Review yang sedang digunakan."
                        actionLabel="Masuk"
                        onAction={() => navigate('/login')}
                    />
                ) : (
                    <>
                        <div className="notification-toolbar">
                            <div>
                                <span>Inbox verifikasi</span>
                                <strong>
                                    {latestNotification
                                        ? `Terbaru: ${formatDate(latestNotification.createdAt)}`
                                        : 'Belum ada notifikasi'}
                                </strong>
                            </div>

                            <div className="notification-actions">
                                <button type="button" onClick={loadNotifications} disabled={isLoading}>
                                    <RefreshCw aria-hidden="true" />
                                    {isLoading ? 'Memuat' : 'Refresh'}
                                </button>
                                <button type="button" onClick={markAllRead} disabled={summary.unread === 0}>
                                    <MailOpen aria-hidden="true" />
                                    Tandai dibaca
                                </button>
                            </div>
                        </div>

                        {notice && (
                            <div className={`notification-notice is-${notice.type}`} role="status">
                                {notice.message}
                            </div>
                        )}

                        {isLoading ? (
                            <NotificationState
                                icon={RefreshCw}
                                title="Memuat notifikasi"
                                text="Sebentar, inbox status UMKM sedang disiapkan."
                            />
                        ) : notifications.length > 0 ? (
                            <div className="notification-list">
                                {notifications.map((notification) => (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        onRead={() => markRead(notification)}
                                        onOpen={() => openUmkm(notification)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <NotificationState
                                icon={Inbox}
                                title="Belum ada notifikasi"
                                text="Saat kamu menambah atau mengedit UMKM, status verifikasi admin akan tampil di sini."
                                actionLabel="Tambah UMKM"
                                onAction={() => navigate('/tambah')}
                            />
                        )}
                    </>
                )}
            </section>
        </main>
    );
};

const NotificationStat = ({ icon: Icon, value, label }) => (
    <article className="notification-stat">
        <Icon aria-hidden="true" />
        <strong>{value}</strong>
        <span>{label}</span>
    </article>
);

const NotificationCard = ({ notification, onRead, onOpen }) => {
    const meta = getMeta(notification.type);
    const Icon = meta.icon;
    const note = notification.metadata?.note || notification.umkm?.verification_note || '';

    return (
        <article className={notification.isRead ? 'notification-card' : 'notification-card is-unread'}>
            <div className="notification-card-image">
                <img src={getImagePath(notification)} alt="" />
                <span className={`notification-status is-${meta.tone}`}>
                    <Icon aria-hidden="true" />
                    {meta.label}
                </span>
            </div>

            <div className="notification-card-body">
                <div className="notification-card-head">
                    <div>
                        <span>{formatDate(notification.createdAt)}</span>
                        <h2>{notification.title}</h2>
                    </div>
                    {!notification.isRead && <em>Baru</em>}
                </div>

                <p>{notification.message}</p>

                {note && String(notification.type || '').includes('rejected') && (
                    <div className="notification-reason">
                        <strong>Alasan admin</strong>
                        <span>{note}</span>
                    </div>
                )}

                <div className="notification-card-footer">
                    <span>
                        <Store aria-hidden="true" />
                        {notification.umkm?.nama_umkm || notification.metadata?.umkmName || 'UMKM'}
                    </span>

                    <div>
                        {!notification.isRead && (
                            <button type="button" onClick={onRead}>
                                Tandai dibaca
                            </button>
                        )}
                        {notification.relatedUmkmId && (
                            <button className="is-primary" type="button" onClick={onOpen}>
                                Buka UMKM
                                <ArrowRight aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

const NotificationState = ({ icon: Icon, title, text, actionLabel, onAction }) => (
    <div className="notification-state">
        <Icon aria-hidden="true" />
        <strong>{title}</strong>
        <span>{text}</span>
        {actionLabel && (
            <button type="button" onClick={onAction}>
                {actionLabel}
            </button>
        )}
    </div>
);

export default Notifications;
