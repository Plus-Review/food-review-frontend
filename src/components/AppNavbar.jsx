import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Bell,
    Bookmark,
    ChevronDown,
    CirclePlus,
    Home,
    LogIn,
    LogOut,
    Menu,
    Newspaper,
    PencilLine,
    Store,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { getUploadUrl } from '../config/api';
import BrandLogo from './BrandLogo';
import './AppNavbar.css';

const getCachedUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
};

const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return '';
    return getUploadUrl(profileImage);
};

const AppNavbar = ({
    active = 'beranda',
    isLoggedIn = false,
    showWorkspaceLinks = isLoggedIn,
    onFeedClick,
}) => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [profile, setProfile] = useState(() => (isLoggedIn ? getCachedUser() : null));
    const [ownedUmkmCount, setOwnedUmkmCount] = useState(0);
    const [savedUmkmCount, setSavedUmkmCount] = useState(0);
    const [activityCount, setActivityCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        let ignore = false;

        const loadProfile = async () => {
            try {
                const { data } = await apiClient.get('/auth/profile');
                if (!ignore) {
                    setProfile(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch {
                // Navbar tetap memakai data lokal jika backend belum aktif.
            }
        };

        loadProfile();
        window.addEventListener('profile-updated', loadProfile);
        window.addEventListener('storage', loadProfile);

        return () => {
            ignore = true;
            window.removeEventListener('profile-updated', loadProfile);
            window.removeEventListener('storage', loadProfile);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        let ignore = false;

        const loadNotificationCount = async () => {
            try {
                const { data } = await apiClient.get('/notifications');
                if (!ignore) setNotificationCount(Number(data?.unread || 0));
            } catch {
                if (!ignore) setNotificationCount(0);
            }
        };

        loadNotificationCount();
        window.addEventListener('notifications-updated', loadNotificationCount);
        window.addEventListener('umkm-updated', loadNotificationCount);
        window.addEventListener('storage', loadNotificationCount);

        return () => {
            ignore = true;
            window.removeEventListener('notifications-updated', loadNotificationCount);
            window.removeEventListener('umkm-updated', loadNotificationCount);
            window.removeEventListener('storage', loadNotificationCount);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn || !profile?.id) {
            return undefined;
        }

        let ignore = false;

        const loadOwnedUmkm = async () => {
            try {
                const { data } = await apiClient.get('/umkm/mine');
                if (ignore) return;

                setOwnedUmkmCount(Array.isArray(data) ? data.length : 0);
            } catch {
                if (!ignore) setOwnedUmkmCount(0);
            }
        };

        loadOwnedUmkm();
        window.addEventListener('umkm-updated', loadOwnedUmkm);
        window.addEventListener('storage', loadOwnedUmkm);

        return () => {
            ignore = true;
            window.removeEventListener('umkm-updated', loadOwnedUmkm);
            window.removeEventListener('storage', loadOwnedUmkm);
        };
    }, [isLoggedIn, profile?.id]);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        let ignore = false;

        const loadSavedUmkm = async () => {
            try {
                const { data } = await apiClient.get('/umkm/saved');
                if (!ignore) setSavedUmkmCount(Array.isArray(data) ? data.length : 0);
            } catch {
                if (!ignore) setSavedUmkmCount(0);
            }
        };

        loadSavedUmkm();
        window.addEventListener('saved-umkm-updated', loadSavedUmkm);
        window.addEventListener('storage', loadSavedUmkm);

        return () => {
            ignore = true;
            window.removeEventListener('saved-umkm-updated', loadSavedUmkm);
            window.removeEventListener('storage', loadSavedUmkm);
        };
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        let ignore = false;

        const loadActivityCount = async () => {
            try {
                const { data } = await apiClient.get('/umkm/activity');
                if (!ignore) setActivityCount(Number(data?.total || 0));
            } catch {
                if (!ignore) setActivityCount(0);
            }
        };

        loadActivityCount();
        window.addEventListener('activity-updated', loadActivityCount);
        window.addEventListener('storage', loadActivityCount);

        return () => {
            ignore = true;
            window.removeEventListener('activity-updated', loadActivityCount);
            window.removeEventListener('storage', loadActivityCount);
        };
    }, [isLoggedIn]);

    const profileImageUrl = getProfileImageUrl(profile?.profileImage);
    const profileName = useMemo(() => {
        const rawName = String(profile?.username || profile?.nama || profile?.email || 'Akun').trim();
        if (!rawName) return 'Akun';
        if (rawName.includes('@')) return rawName.split('@')[0] || 'Akun';
        return rawName;
    }, [profile]);
    const profileInitial = useMemo(() => (
        profileName.charAt(0).toUpperCase() || 'A'
    ), [profileName]);
    const visibleOwnedUmkmCount = isLoggedIn && profile?.id ? ownedUmkmCount : 0;
    const visibleSavedUmkmCount = isLoggedIn ? savedUmkmCount : 0;
    const visibleActivityCount = isLoggedIn ? activityCount : 0;
    const visibleNotificationCount = isLoggedIn ? notificationCount : 0;

    const closeMenus = () => {
        setShowDropdown(false);
        setShowMobileMenu(false);
    };

    const goHome = () => {
        closeMenus();
        navigate('/');
    };

    const goFeed = () => {
        closeMenus();
        if (onFeedClick) {
            onFeedClick();
            return;
        }
        navigate('/#feed');
    };

    const goAdd = () => {
        closeMenus();
        navigate('/tambah');
    };

    const goMyUmkm = () => {
        closeMenus();
        navigate('/umkm-saya');
    };

    const goProfile = () => {
        closeMenus();
        navigate('/profile');
    };

    const goSavedUmkm = () => {
        closeMenus();
        navigate('/tersimpan');
    };

    const goActivity = () => {
        closeMenus();
        navigate('/aktivitas');
    };

    const goNotifications = () => {
        closeMenus();
        navigate('/notifikasi');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setProfile(null);
        closeMenus();
        navigate('/login');
    };

    return (
        <nav className="app-nav" aria-label="Navigasi utama">
            <button className="app-brand" type="button" onClick={goHome}>
                <BrandLogo />
            </button>

            <button
                className={showMobileMenu ? 'app-mobile-menu-toggle is-open' : 'app-mobile-menu-toggle'}
                type="button"
                aria-label={showMobileMenu ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                aria-controls="app-mobile-navigation"
                aria-expanded={showMobileMenu}
                onClick={() => {
                    setShowDropdown(false);
                    setShowMobileMenu((value) => !value);
                }}
            >
                {showMobileMenu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                <span>Menu</span>
            </button>

            {showMobileMenu && (
                <button className="app-mobile-scrim" type="button" aria-label="Tutup menu navigasi" onClick={() => setShowMobileMenu(false)} />
            )}

            <div id="app-mobile-navigation" className={showMobileMenu ? 'app-nav-links is-mobile-open' : 'app-nav-links'}>
                <div className="app-mobile-menu-head">
                    <div className="app-mobile-menu-title">
                        <button className="app-mobile-drawer-brand" type="button" onClick={goHome}>
                            <BrandLogo showSubtitle={false} />
                        </button>
                        <span>Pindah halaman dengan cepat</span>
                    </div>
                    <button type="button" aria-label="Tutup menu navigasi" onClick={() => setShowMobileMenu(false)}>
                        <X aria-hidden="true" />
                    </button>
                </div>

                <div className="app-mobile-link-list">
                    <button
                        className={active === 'beranda' ? 'app-nav-link is-active' : 'app-nav-link'}
                        type="button"
                        onClick={goHome}
                    >
                        <Home className="app-nav-icon" aria-hidden="true" />
                        <span>Beranda</span>
                    </button>

                    {showWorkspaceLinks && (
                        <>
                            <button
                                className={active === 'feed' ? 'app-nav-link is-active' : 'app-nav-link'}
                                type="button"
                                onClick={goFeed}
                            >
                                <Newspaper className="app-nav-icon" aria-hidden="true" />
                                <span>Feed</span>
                            </button>
                            <button
                                className={active === 'tambah' ? 'app-nav-link is-active' : 'app-nav-link'}
                                type="button"
                                onClick={goAdd}
                            >
                                <CirclePlus className="app-nav-icon" aria-hidden="true" />
                                <span>Tambah UMKM</span>
                            </button>
                            {visibleOwnedUmkmCount > 0 && (
                                <button
                                    className={active === 'umkm-saya' ? 'app-nav-link is-active app-nav-link-owned' : 'app-nav-link app-nav-link-owned'}
                                    type="button"
                                    onClick={goMyUmkm}
                                >
                                    <Store className="app-nav-icon" aria-hidden="true" />
                                    <span>UMKM Saya</span>
                                    <small>{visibleOwnedUmkmCount}</small>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="app-nav-account">
                {isLoggedIn ? (
                    <>
                        <button
                            className={[
                                'app-avatar',
                                showDropdown ? 'is-open' : '',
                                profileImageUrl ? 'has-photo' : '',
                            ].filter(Boolean).join(' ')}
                            type="button"
                            aria-label="Menu akun"
                            aria-expanded={showDropdown}
                            onClick={() => {
                                setShowMobileMenu(false);
                                setShowDropdown((value) => !value);
                            }}
                        >
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt={profileName || 'Foto profil'} />
                            ) : (
                                <span className="app-avatar-initial">{profileInitial}</span>
                            )}
                            <span className="app-avatar-copy">
                                <small>Profile</small>
                                <strong>{profileName}</strong>
                            </span>
                            <ChevronDown className="app-avatar-caret" aria-hidden="true" />
                        </button>
                        {showDropdown && (
                            <div className="app-dropdown">
                                <div className="app-dropdown-profile">
                                    <span className="app-dropdown-photo" aria-hidden="true">
                                        {profileImageUrl ? (
                                            <img src={profileImageUrl} alt="" />
                                        ) : (
                                            <span>{profileInitial}</span>
                                        )}
                                    </span>
                                    <div>
                                        <strong>{profileName || 'Akun Plus Review'}</strong>
                                        <small>{profile?.email || 'Kelola akunmu'}</small>
                                    </div>
                                </div>
                                <button type="button" onClick={goProfile}>
                                    <PencilLine className="app-dropdown-icon" aria-hidden="true" />
                                    <span>Edit Profile</span>
                                </button>
                                <button type="button" onClick={goActivity}>
                                    <Activity className="app-dropdown-icon" aria-hidden="true" />
                                    <span>Aktivitas</span>
                                    <small>{visibleActivityCount}</small>
                                </button>
                                <button type="button" onClick={goNotifications}>
                                    <Bell className="app-dropdown-icon" aria-hidden="true" />
                                    <span>Notifikasi</span>
                                    <small className={visibleNotificationCount > 0 ? 'is-hot' : undefined}>
                                        {visibleNotificationCount}
                                    </small>
                                </button>
                                <button type="button" onClick={goSavedUmkm}>
                                    <Bookmark className="app-dropdown-icon" aria-hidden="true" />
                                    <span>UMKM Disimpan</span>
                                    <small>{visibleSavedUmkmCount}</small>
                                </button>
                                <button className="is-danger" type="button" onClick={handleLogout}>
                                    <LogOut className="app-dropdown-icon" aria-hidden="true" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button className="app-login" type="button" onClick={() => navigate('/login')}>
                        <LogIn className="app-login-icon" aria-hidden="true" />
                        <span>Masuk</span>
                    </button>
                )}
            </div>
        </nav>
    );
};

export default AppNavbar;
