import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Bell,
    Camera,
    CheckCircle2,
    Clock3,
    Eye,
    EyeOff,
    LogOut,
    MailOpen,
    Menu,
    RefreshCw,
    Search,
    Save,
    ShieldCheck,
    Store,
    Trash2,
    UserRound,
    X,
    XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminApiClient from '../api/adminApiClient';
import BrandLogo from '../components/BrandLogo';
import PasswordStrength from '../components/PasswordStrength';
import { getUploadUrl } from '../config/api';
import { getPasswordStrength, PASSWORD_RULE_MESSAGE } from '../utils/passwordStrength';
import './AdminDashboard.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=900&auto=format&fit=crop';

const STATUS_META = {
    pending_create: {
        label: 'UMKM baru',
        tone: 'warning',
        icon: Clock3,
        description: 'Data baru menunggu keputusan admin.',
    },
    pending_update: {
        label: 'Edit menunggu',
        tone: 'info',
        icon: AlertCircle,
        description: 'Perubahan user belum diterapkan ke feed.',
    },
    approved: {
        label: 'Approved',
        tone: 'success',
        icon: CheckCircle2,
        description: 'UMKM sudah tampil di feed publik.',
    },
    rejected: {
        label: 'Ditolak',
        tone: 'danger',
        icon: XCircle,
        description: 'UMKM tidak tampil sampai diperbaiki.',
    },
};

const FILTERS = [
    { key: 'pending', label: 'Antrean' },
    { key: 'pending_create', label: 'UMKM Baru' },
    { key: 'pending_update', label: 'Edit' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Ditolak' },
    { key: 'all', label: 'Semua' },
];

const ADMIN_NOTIFICATION_META = {
    umkm_pending_create: { label: 'UMKM baru', tone: 'warning', icon: Clock3 },
    umkm_pending_update: { label: 'Edit UMKM', tone: 'info', icon: AlertCircle },
};

const getCachedAdmin = () => {
    try {
        return JSON.parse(localStorage.getItem('adminUser') || 'null');
    } catch {
        return null;
    }
};

const getStatus = (item) => item?.verification_status || 'approved';

const getStatusMeta = (status) => STATUS_META[getStatus({ verification_status: status })] || STATUS_META.approved;

const getImageUrl = (image) => {
    if (!image) return FALLBACK_IMAGE;
    return getUploadUrl(image);
};

const getProfileImageUrl = (image) => {
    if (!image) return '';
    return getUploadUrl(image);
};

const getAdminInitial = (admin) => (
    String(admin?.name || admin?.username || 'A').trim().charAt(0).toUpperCase() || 'A'
);

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Belum ada';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const getPendingFields = (item) => item?.pending_update?.fields || null;

const getVisibleValue = (item, key) => String(item?.[key] || '-').trim() || '-';

const getPendingValue = (item, key) => {
    const fields = getPendingFields(item);
    return String(fields?.[key] || '-').trim() || '-';
};

const matchesSearch = (item, searchTerm) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return [
        item.nama_umkm,
        item.jenis_makanan,
        item.alamat_teks,
        item.owner?.username,
        item.owner?.email,
        item.verification_status,
    ].filter(Boolean).join(' ').toLowerCase().includes(query);
};

const getPendingTotal = (stats = {}) => (stats.pendingCreate || 0) + (stats.pendingUpdate || 0);

const scrollToVerificationPanel = () => {
    if (window.innerWidth > 760) return;

    window.requestAnimationFrame(() => {
        document.getElementById('admin-verification-panel')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    });
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(() => getCachedAdmin());
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pendingCreate: 0,
        pendingUpdate: 0,
        approved: 0,
        rejected: 0,
    });
    const [activeFilter, setActiveFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [note, setNote] = useState('');
    const [notice, setNotice] = useState(null);
    const [adminNotifications, setAdminNotifications] = useState({
        total: 0,
        unread: 0,
        notifications: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deletingAdminNotificationId, setDeletingAdminNotificationId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const loadDashboard = async () => {
        setIsLoading(true);
        setNotice(null);

        try {
            const [{ data: meData }, { data }, { data: notificationData }] = await Promise.all([
                adminApiClient.get('/me'),
                adminApiClient.get('/umkm'),
                adminApiClient.get('/notifications'),
            ]);

            setAdmin(meData.admin);
            localStorage.setItem('adminUser', JSON.stringify(meData.admin));
            setItems(Array.isArray(data.umkms) ? data.umkms : []);
            setStats(data.stats || {});
            setAdminNotifications({
                total: Number(notificationData.total || 0),
                unread: Number(notificationData.unread || 0),
                notifications: Array.isArray(notificationData.notifications) ? notificationData.notifications : [],
            });
            setSelectedId((current) => {
                if (current && data.umkms?.some((item) => Number(item.id) === Number(current))) return current;
                return data.umkms?.[0]?.id || null;
            });
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                navigate('/admin');
                return;
            }

            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal memuat dashboard admin.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!localStorage.getItem('adminToken')) {
            navigate('/admin');
            return;
        }

        const timeout = window.setTimeout(() => {
            void loadDashboard();
        }, 0);
        return () => window.clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isSidebarOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);

    const visibleItems = useMemo(() => (
        items
            .filter((item) => {
                const status = getStatus(item);
                if (activeFilter === 'pending') return status === 'pending_create' || status === 'pending_update';
                if (activeFilter === 'all') return true;
                return status === activeFilter;
            })
            .filter((item) => matchesSearch(item, searchTerm))
    ), [activeFilter, items, searchTerm]);

    const selectedItem = useMemo(() => (
        visibleItems.find((item) => Number(item.id) === Number(selectedId)) || visibleItems[0] || null
    ), [selectedId, visibleItems]);

    const pendingTotal = getPendingTotal(stats);

    const handleFilterChange = (filterKey) => {
        setActiveFilter(filterKey);
        setSelectedId(null);
        setNote('');
        setIsSidebarOpen(false);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setSelectedId(null);
        setNote('');
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setIsSidebarOpen(false);
        navigate('/admin');
    };

    const handleDecision = async (decision) => {
        if (!selectedItem || isProcessing) return;

        if (decision === 'reject' && !note.trim()) {
            setNotice({
                type: 'error',
                message: 'Tulis alasan penolakan dulu agar user tahu bagian yang harus diperbaiki.',
            });
            return;
        }

        setIsProcessing(true);
        setNotice(null);

        try {
            const endpoint = decision === 'approve' ? 'approve' : 'reject';
            const { data } = await adminApiClient.post(`/umkm/${selectedItem.id}/${endpoint}`, { note });
            setNotice({ type: 'success', message: data.message });
            setNote('');
            await loadDashboard();
            window.dispatchEvent(new Event('umkm-updated'));
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal memproses keputusan admin.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAdminNotificationRead = async (notificationId) => {
        const target = adminNotifications.notifications.find((item) => Number(item.id) === Number(notificationId));
        if (!target || target.isRead) return;

        try {
            await adminApiClient.patch(`/notifications/${notificationId}/read`);
            setAdminNotifications((current) => ({
                ...current,
                unread: Math.max(0, Number(current.unread || 0) - 1),
                notifications: current.notifications.map((item) => (
                    Number(item.id) === Number(notificationId)
                        ? { ...item, isRead: true, readAt: new Date().toISOString() }
                        : item
                )),
            }));
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Notifikasi admin belum bisa ditandai dibaca.',
            });
        }
    };

    const handleAdminNotificationOpen = async (notification) => {
        await handleAdminNotificationRead(notification.id);
        if (!notification.relatedUmkmId) return;

        setActiveFilter('all');
        setSearchTerm('');
        setSelectedId(notification.relatedUmkmId);
        scrollToVerificationPanel();
    };

    const removeAdminNotificationFromState = (notification) => {
        setAdminNotifications((current) => ({
            ...current,
            total: Math.max(0, Number(current.total || 0) - 1),
            unread: Math.max(0, Number(current.unread || 0) - (notification.isRead ? 0 : 1)),
            notifications: current.notifications.filter((item) => Number(item.id) !== Number(notification.id)),
        }));
    };

    const handleAdminNotificationDelete = async (notification) => {
        if (!notification || deletingAdminNotificationId) return;

        setDeletingAdminNotificationId(notification.id);
        setNotice(null);

        try {
            try {
                await adminApiClient.delete(`/notifications/${notification.id}`);
            } catch (deleteError) {
                const status = Number(deleteError.response?.status || 0);
                const responseMessage = deleteError.response?.data?.message;

                if (status === 404 && responseMessage === 'Notifikasi tidak ditemukan.') {
                    removeAdminNotificationFromState(notification);
                    setNotice({ type: 'success', message: 'Notifikasi sudah tidak tersedia dan dibersihkan dari panel.' });
                    return;
                }

                if (!deleteError.response || status === 404 || status === 405 || typeof responseMessage !== 'string') {
                    await adminApiClient.post(`/notifications/${notification.id}/delete`);
                } else {
                    throw deleteError;
                }
            }

            removeAdminNotificationFromState(notification);
            setNotice({ type: 'success', message: 'Notifikasi admin berhasil dihapus.' });
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Notifikasi admin belum bisa dihapus. Restart backend lalu coba lagi.',
            });
        } finally {
            setDeletingAdminNotificationId(null);
        }
    };

    const handleAllAdminNotificationsRead = async () => {
        try {
            await adminApiClient.patch('/notifications/read-all');
            setAdminNotifications((current) => ({
                ...current,
                unread: 0,
                notifications: current.notifications.map((item) => ({
                    ...item,
                    isRead: true,
                    readAt: item.readAt || new Date().toISOString(),
                })),
            }));
        } catch (error) {
            setNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal menandai notifikasi admin.',
            });
        }
    };

    return (
        <main className={isSidebarOpen ? 'admin-page is-sidebar-open' : 'admin-page'}>
            <header className="admin-mobile-topbar">
                <button
                    className="admin-mobile-menu-button"
                    type="button"
                    aria-label="Buka menu admin"
                    aria-expanded={isSidebarOpen}
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <Menu aria-hidden="true" />
                    <span>Menu</span>
                </button>

                <span className="admin-mobile-spacer" aria-hidden="true" />

                <button className="admin-mobile-refresh" type="button" onClick={loadDashboard} disabled={isLoading} aria-label="Refresh dashboard">
                    <RefreshCw aria-hidden="true" />
                </button>
            </header>

            {isSidebarOpen && (
                <button
                    className="admin-sidebar-scrim"
                    type="button"
                    aria-label="Tutup menu admin"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className="admin-sidebar">
                <div className="admin-sidebar-head">
                    <button className="admin-brand" type="button" onClick={() => navigate('/')}>
                        <BrandLogo showSubtitle={false} />
                    </button>
                    <button className="admin-sidebar-close" type="button" aria-label="Tutup menu admin" onClick={() => setIsSidebarOpen(false)}>
                        <X aria-hidden="true" />
                    </button>
                </div>

                <button
                    className="admin-profile"
                    type="button"
                    onClick={() => {
                        setIsProfileOpen(true);
                        setIsSidebarOpen(false);
                    }}
                >
                    <span className={admin?.profileImage ? 'has-photo' : undefined}>
                        {admin?.profileImage ? (
                            <img src={getProfileImageUrl(admin.profileImage)} alt="" />
                        ) : (
                            <em>{getAdminInitial(admin)}</em>
                        )}
                    </span>
                    <div>
                        <strong>{admin?.name || 'Admin Plus Review'}</strong>
                        <small>{admin?.username || 'admin'} - Edit profile</small>
                    </div>
                </button>

                <nav className="admin-filter-list" aria-label="Filter dashboard admin">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            className={activeFilter === filter.key ? 'is-active' : undefined}
                            type="button"
                            onClick={() => handleFilterChange(filter.key)}
                        >
                            <span>{filter.label}</span>
                            <small>{getFilterCount(filter.key, stats)}</small>
                        </button>
                    ))}
                </nav>

                <button className="admin-logout" type="button" onClick={handleLogout}>
                    <LogOut aria-hidden="true" />
                    <span>Logout admin</span>
                </button>
            </aside>

            <section className="admin-main">
                <header className="admin-header">
                    <div>
                        <span>Dashboard admin</span>
                        <h1>Verifikasi UMKM</h1>
                        <p>Review UMKM baru dan perubahan data sebelum tampil di Plus Review.</p>
                    </div>

                    <div className="admin-header-actions">
                        <div className="admin-review-summary">
                            <Clock3 aria-hidden="true" />
                            <strong>{pendingTotal}</strong>
                            <span>menunggu keputusan</span>
                        </div>

                        <button className="admin-refresh" type="button" onClick={loadDashboard} disabled={isLoading}>
                            <RefreshCw aria-hidden="true" />
                            <span>{isLoading ? 'Memuat...' : 'Refresh'}</span>
                        </button>
                    </div>
                </header>

                <div className="admin-stat-grid">
                    <AdminStat icon={Clock3} value={pendingTotal} label="Antrean" tone="warning" />
                    <AdminStat icon={Store} value={stats.pendingCreate || 0} label="UMKM baru" tone="neutral" />
                    <AdminStat icon={AlertCircle} value={stats.pendingUpdate || 0} label="Edit menunggu" tone="info" />
                    <AdminStat icon={CheckCircle2} value={stats.approved || 0} label="Approved" tone="success" />
                    <AdminStat icon={XCircle} value={stats.rejected || 0} label="Ditolak" tone="danger" />
                </div>

                <AdminNotificationPanel
                    data={adminNotifications}
                    onOpen={handleAdminNotificationOpen}
                    onRead={handleAdminNotificationRead}
                    onReadAll={handleAllAdminNotificationsRead}
                    onDelete={handleAdminNotificationDelete}
                    deletingId={deletingAdminNotificationId}
                />

                {notice && (
                    <div className={`admin-notice is-${notice.type}`} role="status">
                        {notice.message}
                    </div>
                )}

                <div className="admin-workspace">
                    <section className="admin-list-panel">
                        <div className="admin-list-head">
                            <div>
                                <span>Antrean data</span>
                                <strong>{visibleItems.length} UMKM</strong>
                                <small>Gunakan filter dan pencarian untuk memutuskan data lebih cepat.</small>
                            </div>

                            <form className="admin-search" onSubmit={(event) => event.preventDefault()}>
                                <Search aria-hidden="true" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => handleSearchChange(event.target.value)}
                                    placeholder="Cari nama, owner, status"
                                />
                                {searchTerm && (
                                    <button
                                        className="admin-search-clear"
                                        type="button"
                                        aria-label="Hapus pencarian"
                                        onClick={() => handleSearchChange('')}
                                    >
                                        <XCircle aria-hidden="true" />
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="admin-card-list">
                            {isLoading ? (
                                <AdminState title="Memuat antrean" text="Data moderasi sedang disiapkan." />
                            ) : visibleItems.length > 0 ? (
                                visibleItems.map((item) => (
                                    <AdminQueueCard
                                        key={item.id}
                                        item={item}
                                        isSelected={Number(selectedItem?.id) === Number(item.id)}
                                        onSelect={() => {
                                            setSelectedId(item.id);
                                            setNote('');
                                            scrollToVerificationPanel();
                                        }}
                                    />
                                ))
                            ) : (
                                <AdminState title="Tidak ada data" text="Filter ini sedang kosong." />
                            )}
                        </div>
                    </section>

                    <AdminDetailPanel
                        item={selectedItem}
                        note={note}
                        onNoteChange={setNote}
                        onApprove={() => handleDecision('approve')}
                        onReject={() => handleDecision('reject')}
                        isProcessing={isProcessing}
                    />
                </div>
            </section>

            {isProfileOpen && (
                <AdminProfileModal
                    admin={admin}
                    onClose={() => setIsProfileOpen(false)}
                    onSaved={(nextAdmin) => {
                        setAdmin(nextAdmin);
                        localStorage.setItem('adminUser', JSON.stringify(nextAdmin));
                    }}
                />
            )}
        </main>
    );
};

const getFilterCount = (key, stats) => {
    if (key === 'pending') return (stats.pendingCreate || 0) + (stats.pendingUpdate || 0);
    if (key === 'pending_create') return stats.pendingCreate || 0;
    if (key === 'pending_update') return stats.pendingUpdate || 0;
    if (key === 'approved') return stats.approved || 0;
    if (key === 'rejected') return stats.rejected || 0;
    return stats.total || 0;
};

const AdminStat = ({ icon: Icon, value, label, tone = 'neutral' }) => (
    <article className={`admin-stat is-${tone}`}>
        <Icon aria-hidden="true" />
        <strong>{value}</strong>
        <span>{label}</span>
    </article>
);

const AdminNotificationPanel = ({ data, onOpen, onRead, onReadAll, onDelete, deletingId }) => {
    const notifications = data.notifications || [];
    const visibleNotifications = notifications.slice(0, 3);

    return (
        <section className="admin-notification-panel" aria-label="Notifikasi admin">
            <div className="admin-notification-head">
                <span>
                    <Bell aria-hidden="true" />
                    Notifikasi verifikasi
                </span>
                <strong>
                    {data.unread > 0
                        ? `${data.unread} belum dibaca`
                        : 'Semua sudah dibaca'}
                </strong>
            </div>

            <div className="admin-notification-list">
                {visibleNotifications.length > 0 ? visibleNotifications.map((notification) => (
                    <AdminNotificationCard
                        key={notification.id}
                        notification={notification}
                        onOpen={() => onOpen(notification)}
                        onRead={() => onRead(notification.id)}
                        onDelete={() => onDelete(notification)}
                        isDeleting={Number(deletingId) === Number(notification.id)}
                    />
                )) : (
                    <div className="admin-notification-empty">
                        <CheckCircle2 aria-hidden="true" />
                        <span>Tidak ada notifikasi baru.</span>
                    </div>
                )}
            </div>

            <button className="admin-notification-read-all" type="button" disabled={data.unread === 0} onClick={onReadAll}>
                <MailOpen aria-hidden="true" />
                Tandai semua dibaca
            </button>
        </section>
    );
};

const AdminNotificationCard = ({ notification, onOpen, onRead, onDelete, isDeleting }) => {
    const meta = ADMIN_NOTIFICATION_META[notification.type] || {
        label: 'Notifikasi',
        tone: 'neutral',
        icon: Bell,
    };
    const relatedStatus = notification.umkm?.verification_status || notification.metadata?.status || '';
    const isCreateNotification = notification.type === 'umkm_pending_create';
    const isUpdateNotification = notification.type === 'umkm_pending_update';
    const isApproved = relatedStatus === 'approved' && (isCreateNotification || isUpdateNotification);
    const isRejected = relatedStatus === 'rejected' && isCreateNotification;
    const label = isApproved
        ? (isCreateNotification ? 'UMKM baru telah diverifikasi' : 'Edit UMKM telah diverifikasi')
        : isRejected
            ? 'UMKM baru ditolak'
            : meta.label;
    const title = isApproved
        ? label
        : isRejected
            ? 'UMKM baru ditolak admin'
            : notification.title;
    const tone = isApproved ? 'success' : isRejected ? 'danger' : meta.tone;
    const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : meta.icon;

    return (
        <article className={notification.isRead ? 'admin-notification-card' : 'admin-notification-card is-unread'}>
            <span className={`admin-notification-icon is-${tone}`}>
                <Icon aria-hidden="true" />
            </span>
            <div>
                <small>{label} - {formatDate(notification.createdAt)}</small>
                <strong>{title}</strong>
                <p>{notification.umkm?.nama_umkm || notification.metadata?.umkmName || notification.message}</p>
            </div>
            <div className="admin-notification-actions">
                {!notification.isRead && (
                    <button type="button" onClick={onRead}>
                        Baca
                    </button>
                )}
                <button className="is-open" type="button" onClick={onOpen}>
                    Pilih
                </button>
                <button className="is-danger" type="button" onClick={onDelete} disabled={isDeleting}>
                    <Trash2 aria-hidden="true" />
                    <span>{isDeleting ? 'Menghapus' : 'Hapus'}</span>
                </button>
            </div>
        </article>
    );
};

const AdminProfileModal = ({ admin, onClose, onSaved }) => {
    const [name, setName] = useState(admin?.name || '');
    const [password, setPassword] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const currentImageUrl = previewUrl || getProfileImageUrl(admin?.profileImage);
    const passwordStrength = getPasswordStrength(password);
    const hasChanges = name.trim() !== (admin?.name || '') || Boolean(password.trim()) || Boolean(profileImage);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setProfileImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setStatus(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSaving) return;

        if (!hasChanges) {
            setStatus({ type: 'warning', message: 'Isi perubahan terlebih dahulu sebelum menyimpan.' });
            return;
        }

        if (!name.trim()) {
            setStatus({ type: 'error', message: 'Nama admin wajib diisi.' });
            return;
        }

        if (password.trim() && !passwordStrength.isValid) {
            setStatus({ type: 'error', message: PASSWORD_RULE_MESSAGE });
            return;
        }

        setIsSaving(true);
        setStatus(null);

        try {
            let payload = {
                name: name.trim(),
            };

            if (password.trim()) payload.password = password;

            if (profileImage) {
                payload = new FormData();
                payload.append('name', name.trim());
                if (password.trim()) payload.append('password', password);
                payload.append('profileImage', profileImage);
            }

            const { data } = await adminApiClient.put('/profile', payload);
            if (data.sessionInvalidated) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.assign('/login');
                return;
            }
            onSaved(data.admin);
            setName(data.admin?.name || name.trim());
            setPassword('');
            setProfileImage(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl('');
            setStatus({ type: 'success', message: data.message || 'Profile admin berhasil diperbarui.' });
        } catch (error) {
            const responseMessage = typeof error.response?.data?.message === 'string'
                ? error.response.data.message
                : '';
            const statusCode = Number(error.response?.status || 0);
            const fallbackMessage = statusCode === 404
                ? 'Endpoint profile admin belum aktif. Stop backend lama, lalu jalankan ulang npm run backend dari folder food-review.'
                : error.request && !error.response
                ? 'Backend belum aktif atau perlu di-restart agar fitur profile admin terbaru terbaca.'
                : 'Profile admin belum bisa disimpan. Coba login ulang admin lalu simpan kembali.';

            setStatus({
                type: 'error',
                message: responseMessage || fallbackMessage,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-profile-modal-overlay" role="presentation" onMouseDown={onClose}>
            <form
                className="admin-profile-modal"
                onSubmit={handleSubmit}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label="Edit profile admin"
            >
                <div className="admin-profile-modal-head">
                    <div>
                        <span>Akun admin</span>
                        <strong>Edit profile</strong>
                        <small>{admin?.username || 'admin'}</small>
                    </div>
                    <button type="button" aria-label="Tutup edit profile admin" onClick={onClose}>
                        <X aria-hidden="true" />
                    </button>
                </div>

                <label className="admin-profile-upload">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                    <span>
                        {currentImageUrl ? (
                            <img src={currentImageUrl} alt="" />
                        ) : (
                            <em>{getAdminInitial(admin)}</em>
                        )}
                    </span>
                    <strong>
                        <Camera aria-hidden="true" />
                        Ganti foto profil
                    </strong>
                    <small>JPG, PNG, atau WEBP maksimal 2MB.</small>
                </label>

                <label className="admin-profile-field">
                    <span>Nama admin</span>
                    <div className="admin-profile-input-shell">
                        <UserRound aria-hidden="true" />
                        <input
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                setStatus(null);
                            }}
                            maxLength={60}
                            placeholder="Nama admin"
                        />
                    </div>
                </label>

                <label className="admin-profile-field">
                    <span>Password baru</span>
                    <div className="admin-profile-input-shell">
                        <ShieldCheck aria-hidden="true" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                setStatus(null);
                            }}
                            placeholder="Kosongkan jika tidak diganti"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                            onClick={() => setShowPassword((current) => !current)}
                        >
                            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                        </button>
                    </div>
                    <PasswordStrength password={password} compact emptyLabel="Tidak diganti" />
                </label>

                {status && (
                    <div className={`admin-profile-status is-${status.type}`} role="status">
                        {status.message}
                    </div>
                )}

                <div className="admin-profile-actions">
                    <button type="button" onClick={onClose}>
                        Batal
                    </button>
                    <button type="submit" disabled={isSaving}>
                        <Save aria-hidden="true" />
                        {isSaving ? 'Menyimpan...' : 'Simpan profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const StatusPill = ({ status }) => {
    const normalized = status || 'approved';
    const meta = getStatusMeta(normalized);
    const Icon = meta.icon;

    return (
        <span className={`admin-status is-${meta.tone}`}>
            <Icon aria-hidden="true" />
            {meta.label}
        </span>
    );
};

const AdminQueueCard = ({ item, isSelected, onSelect }) => {
    const submittedLabel = formatDate(item.submitted_at || item.updatedAt || item.createdAt);

    return (
        <button className={isSelected ? 'admin-queue-card is-selected' : 'admin-queue-card'} type="button" onClick={onSelect}>
            <img src={getImageUrl(item.image)} alt="" />
            <span className="admin-queue-content">
                <StatusPill status={getStatus(item)} />
                <strong>{item.nama_umkm}</strong>
                <small>{item.owner?.username || 'Owner tidak tersedia'} - {item.jenis_makanan || 'Kuliner'}</small>
                <em>{submittedLabel}</em>
            </span>
        </button>
    );
};

const AdminDetailPanel = ({ item, note, onNoteChange, onApprove, onReject, isProcessing }) => {
    if (!item) {
        return (
            <aside className="admin-detail-panel" id="admin-verification-panel">
                <AdminState title="Pilih UMKM" text="Klik salah satu data di antrean untuk melihat detail verifikasi." />
            </aside>
        );
    }

    const status = getStatus(item);
    const meta = getStatusMeta(status);
    const StatusIcon = meta.icon;
    const pendingFields = getPendingFields(item);
    const canDecide = status === 'pending_create' || status === 'pending_update' || status === 'rejected';

    return (
        <aside className="admin-detail-panel" id="admin-verification-panel">
            <div className="admin-detail-cover">
                <img src={getImageUrl(pendingFields?.image || item.pending_update?.primaryImage || item.image)} alt={item.nama_umkm} />
                <StatusPill status={status} />
            </div>

            <div className="admin-detail-head">
                <span>{meta.description}</span>
                <h2>{item.nama_umkm}</h2>
                <p>{item.deskripsi || 'Deskripsi belum tersedia.'}</p>
            </div>

            <div className={`admin-status-note is-${meta.tone}`}>
                <StatusIcon aria-hidden="true" />
                <span>
                    {canDecide
                        ? 'Periksa data, foto, alamat, dan perubahan sebelum mengambil keputusan.'
                        : 'Data ini sudah selesai diproses dan tidak membutuhkan aksi tambahan.'}
                </span>
            </div>

            <div className="admin-owner-box">
                <strong>Owner</strong>
                <span>{item.owner?.username || 'Tidak tersedia'}</span>
                <small>{item.owner?.email || 'Email tidak tersedia'}</small>
            </div>

            <div className="admin-info-grid">
                <Info label="Kategori" value={item.jenis_makanan || '-'} />
                <Info label="Harga" value={item.harga_range || '-'} />
                <Info label="Jam" value={item.jam_operasional || '-'} />
                <Info label="Dikirim" value={formatDate(item.submitted_at || item.createdAt)} />
            </div>

            {status === 'pending_update' && pendingFields && (
                <section className="admin-change-panel">
                    <div className="admin-section-title">
                        <span>Perubahan diajukan</span>
                        <strong>Bandingkan data lama dan baru</strong>
                    </div>

                    <CompareRow label="Nama" before={getVisibleValue(item, 'nama_umkm')} after={getPendingValue(item, 'nama_umkm')} />
                    <CompareRow label="Kategori" before={getVisibleValue(item, 'jenis_makanan')} after={getPendingValue(item, 'jenis_makanan')} />
                    <CompareRow label="Harga" before={getVisibleValue(item, 'harga_range')} after={getPendingValue(item, 'harga_range')} />
                    <CompareRow label="Jam" before={getVisibleValue(item, 'jam_operasional')} after={getPendingValue(item, 'jam_operasional')} />
                    <CompareRow label="Alamat" before={getVisibleValue(item, 'alamat_teks')} after={getPendingValue(item, 'alamat_teks')} />
                    <CompareRow label="Deskripsi" before={getVisibleValue(item, 'deskripsi')} after={getPendingValue(item, 'deskripsi')} />
                </section>
            )}

            {item.verification_note && (
                <div className="admin-last-note">
                    <strong>Catatan terakhir</strong>
                    <span>{item.verification_note}</span>
                </div>
            )}

            <div className="admin-action-panel">
                <div className="admin-note-box">
                    <label>
                        <span>Catatan admin</span>
                        <textarea
                            value={note}
                            onChange={(event) => onNoteChange(event.target.value)}
                            placeholder="Tulis alasan approve/reject, contoh: foto kurang jelas atau alamat perlu dilengkapi."
                        />
                    </label>
                </div>

                <div className="admin-decision-row">
                    <button className="admin-approve" type="button" disabled={!canDecide || isProcessing} onClick={onApprove}>
                        <CheckCircle2 aria-hidden="true" />
                        <span>{isProcessing ? 'Memproses...' : 'Approve'}</span>
                    </button>
                    <button className="admin-reject" type="button" disabled={!canDecide || isProcessing} onClick={onReject}>
                        <XCircle aria-hidden="true" />
                        <span>Reject</span>
                    </button>
                </div>

                {!canDecide && (
                    <p className="admin-decision-help">Aksi verifikasi hanya aktif untuk UMKM baru, edit menunggu, atau data yang ditolak.</p>
                )}
            </div>

            <a className="admin-open-link" href={`/umkm/${item.id}`} target="_blank" rel="noreferrer">
                <Eye aria-hidden="true" />
                <span>Lihat halaman detail</span>
            </a>
        </aside>
    );
};

const Info = ({ label, value }) => (
    <div className="admin-info-item">
        <small>{label}</small>
        <strong>{value}</strong>
    </div>
);

const CompareRow = ({ label, before, after }) => (
    <div className="admin-compare-row">
        <small>{label}</small>
        <span>{before}</span>
        <strong>{after}</strong>
    </div>
);

const AdminState = ({ title, text }) => (
    <div className="admin-empty-state">
        <ShieldCheck aria-hidden="true" />
        <strong>{title}</strong>
        <span>{text}</span>
    </div>
);

export default AdminDashboard;
