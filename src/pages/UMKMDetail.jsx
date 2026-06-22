import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import apiClient from '../api/apiClient';

const BASE_URL = 'http://localhost:5000';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1200&auto=format&fit=crop';

const defaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/* ─────────────────────────────────────────────
   IKON SVG MURNI
───────────────────────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const Bookmark = (props) => <SvgIcon {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></SvgIcon>;
const Camera = (props) => <SvgIcon {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></SvgIcon>;
const ChevronLeft = (props) => <SvgIcon {...props}><path d="m15 18-6-6 6-6"/></SvgIcon>;
const ChevronRight = (props) => <SvgIcon {...props}><path d="m9 18 6-6-6-6"/></SvgIcon>;
const Clock = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
const Cookie = (props) => <SvgIcon {...props}><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 12.5v.01"/><path d="M12 16v.01"/><path d="M11 7v.01"/><path d="M7 12v.01"/></SvgIcon>;
const CupSoda = (props) => <SvgIcon {...props}><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></SvgIcon>;
const DollarSign = (props) => <SvgIcon {...props}><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></SvgIcon>;
const ImageIcon = (props) => <SvgIcon {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></SvgIcon>;
const Info = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></SvgIcon>;
const ImagePlus = (props) => <SvgIcon {...props}><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" y1="5" x2="22" y2="5"/><line x1="19" y1="2" x2="19" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></SvgIcon>;
const MapPin = (props) => <SvgIcon {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></SvgIcon>;
const MessageCircle = (props) => <SvgIcon {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></SvgIcon>;
const Navigation = (props) => <SvgIcon {...props}><polygon points="3 11 22 2 13 21 11 13 3 11"/></SvgIcon>;
const PencilLine = (props) => <SvgIcon {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></SvgIcon>;
const Save = (props) => <SvgIcon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></SvgIcon>;
const Send = (props) => <SvgIcon {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></SvgIcon>;
const Star = (props) => <SvgIcon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgIcon>;
const Trash2 = (props) => <SvgIcon {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></SvgIcon>;
const Utensils = (props) => <SvgIcon {...props}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></SvgIcon>;
const X = (props) => <SvgIcon {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></SvgIcon>;

/* ─────────────────────────────────────────────
   FUNGSI HELPER
───────────────────────────────────────────── */
const resolveImageUrl = (image) => {
    if (!image) return '';
    if (String(image).startsWith('http')) return image;
    return `${BASE_URL}/uploads/${image}`;
};

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

const mergeUpdatedUmkm = (current, updated) => {
    if (!updated) return current;
    return { ...(current || {}), ...updated, reviews: Array.isArray(updated.reviews) ? updated.reviews : (current?.reviews || []) };
};

const getReviews = (item) => item?.reviews || [];
const getAverageRating = (reviews) => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
};
const formatRating = (value) => Number(value || 0).toFixed(1);
const getInitial = (name) => String(name || 'A').trim().charAt(0).toUpperCase() || 'A';
const getReviewName = (r) => r?.User?.username || r?.User?.nama || r?.nama_user || r?.username || 'Anonim';
const getReviewUserId = (r) => r?.userId || r?.User?.id || r?.UserId || null;

const isAuthSessionError = (error) => {
    const status = error?.response?.status;
    const msg = String(error?.response?.data?.message || '').toLowerCase();
    return status === 401 || (status === 400 && msg.includes('token')) || msg.includes('login');
};

const getFoodCategoryType = (val) => {
    const c = String(val || '').toLowerCase();
    if (c.includes('drink') || c.includes('minum') || c.includes('kopi') || c.includes('teh')) return 'drink';
    if (c.includes('snack') || c.includes('dessert') || c.includes('jajan') || c.includes('kue')) return 'dessert';
    return 'meal';
};
const renderFoodCategoryIcon = (type) => {
    if (type === 'drink') return <CupSoda aria-hidden="true" />;
    if (type === 'dessert') return <Cookie aria-hidden="true" />;
    return <Utensils aria-hidden="true" />;
};

const formatDate = (val) => {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return 'Baru saja';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getCachedUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

const revokePhotoPreviews = (photos = []) => photos.forEach(p => { if (p?.preview) URL.revokeObjectURL(p.preview); });

const defaultEditForm = { nama_umkm: '', jenis_makanan: '', harga_range: '', jam_operasional: '', deskripsi: '', alamat_teks: '' };
const FOOD_TYPE_OPTIONS = ['Makanan berat', 'Snacks & Dessert', 'Drink'];
const PRICE_OPTIONS = ['Rp5.000 - Rp10.000', 'Rp10.000 - Rp20.000', 'Rp20.000 - Rp35.000', 'Rp35.000+'];
const OPERATING_HOUR_OPTIONS = ['07.00 - 15.00', '08.00 - 17.00', '09.00 - 21.00', '10.00 - 22.00', '24 jam'];
const MAX_DETAIL_PHOTOS = 7;
const MAX_REVIEW_PHOTOS = 4;
const REVIEW_PREVIEW_LENGTH = 180;

/* ─────────────────────────────────────────────
   KOMPONEN SUB / UI
───────────────────────────────────────────── */
const InlineNavbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="inline-navbar">
            <button type="button" onClick={() => navigate(-1)} className="btn-nav-back">
                <ChevronLeft /> Kembali
            </button>
            <div className="nav-logo" onClick={() => navigate('/')}>
                Plus<span>Review</span>
            </div>
        </nav>
    );
};

const RatingStars = ({ value = 0, interactive = false, onChange }) => {
    const activeValue = Math.round(Number(value) || 0);
    return (
        <div className={interactive ? 'detail-stars is-interactive' : 'detail-stars'}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= activeValue;
                if (interactive) {
                    return (
                        <button key={star} className={isActive ? 'detail-star is-active' : 'detail-star'} type="button" onClick={() => onChange(star)}>
                            <Star />
                        </button>
                    );
                }
                return <Star key={star} className={isActive ? 'detail-star is-active' : 'detail-star'} />;
            })}
        </div>
    );
};

const Avatar = ({ name }) => (
    <span className="detail-avatar">{getInitial(name)}</span>
);

const ReviewBubble = ({ review, canManage, isDeleting, isUpdating, onDelete, onEdit, onOpenPhotos }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const reviewName = getReviewName(review);
    const comment = String(review.komentar || '').trim();
    const isLong = comment.length > REVIEW_PREVIEW_LENGTH;
    const reviewPhotos = normalizeImageList(review.images).map(resolveImageUrl).filter(Boolean);

    return (
        <article className="review-item">
            <Avatar name={reviewName} />
            <div className="review-bubble">
                <div className="review-head">
                    <div className="review-meta-text">
                        <strong>{reviewName}</strong>
                        <span>{formatDate(review.createdAt || review.waktu)}</span>
                    </div>
                    {canManage && (
                        <div className="review-actions">
                            <button className="btn-review-edit" disabled={isUpdating} onClick={onEdit}>
                                <PencilLine /> {isUpdating ? 'Wait...' : 'Edit'}
                            </button>
                            <button className="btn-review-delete" disabled={isDeleting} onClick={onDelete}>
                                <Trash2 /> {isDeleting ? 'Wait...' : 'Hapus'}
                            </button>
                        </div>
                    )}
                </div>
                <RatingStars value={review.rating || 0} />
                <p className={isExpanded ? 'is-expanded' : ''}>{comment}</p>
                {isLong && (
                    <button className="btn-review-more" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? 'Tutup' : 'Lihat selengkapnya'}
                    </button>
                )}
                {reviewPhotos.length > 0 && (
                    <div className="review-photos-grid">
                        {reviewPhotos.map((photo, i) => (
                            <button key={i} onClick={() => onOpenPhotos(reviewPhotos, i)}>
                                <img src={photo} alt="Review" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
};

const Lightbox = ({ photos, title, initialIndex = 0, onClose }) => {
    const [activeIndex, setActiveIndex] = useState(Math.min(Math.max(initialIndex, 0), Math.max(photos.length - 1, 0)));
    const activePhoto = photos[activeIndex] || photos[0];

    const handlePrev = () => setActiveIndex((c) => (c === 0 ? photos.length - 1 : c - 1));
    const handleNext = () => setActiveIndex((c) => (c === photos.length - 1 ? 0 : c + 1));

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-panel" onClick={e => e.stopPropagation()}>
                <div className="lightbox-header">
                    <div>
                        <span>Galeri Foto</span>
                        <strong>{title}</strong>
                    </div>
                    <button onClick={onClose}><X /></button>
                </div>
                <figure className="lightbox-hero">
                    <img src={activePhoto} alt="UMKM" />
                    {photos.length > 1 && (
                        <div className="lightbox-nav">
                            <button onClick={handlePrev}><ChevronLeft /></button>
                            <button onClick={handleNext}><ChevronRight /></button>
                        </div>
                    )}
                    <figcaption>
                        Foto {activeIndex + 1} dari {photos.length}
                    </figcaption>
                </figure>
                {photos.length > 1 && (
                    <div className="lightbox-thumbs">
                        {photos.map((photo, i) => (
                            <button key={i} className={i === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(i)}>
                                <img src={photo} alt="Thumb" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailState = ({ title, description }) => (
    <main className="detail-page">
        <style dangerouslySetInnerHTML={{ __html: detailCSS }} />
        <InlineNavbar />
        <div className="state-card">
            <Info />
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    </main>
);

const DetailCategoryDropdown = ({ value, options, placeholder, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const clickOut = (e) => !dropdownRef.current?.contains(e.target) && setIsOpen(false);
        const esc = (e) => e.key === 'Escape' && setIsOpen(false);
        window.addEventListener('pointerdown', clickOut);
        window.addEventListener('keydown', esc);
        return () => { window.removeEventListener('pointerdown', clickOut); window.removeEventListener('keydown', esc); };
    }, [isOpen]);

    return (
        <div className={`custom-dropdown ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button type="button" className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span className={!value ? 'placeholder' : ''}>{value || placeholder}</span>
                <i />
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {options.map((opt) => (
                        <button key={opt} type="button" className={`dropdown-item ${value === opt ? 'selected' : ''}`} onClick={() => { onChange(opt); setIsOpen(false); }}>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ icon: Icon, iconNode, label, value }) => (
    <div className="info-item">
        <span className="info-icon">{iconNode || <Icon />}</span>
        <div className="info-text">
            <small>{label}</small>
            <strong>{value}</strong>
        </div>
    </div>
);

const ManageField = ({ label, children, required, wide }) => (
    <label className={`manage-field ${wide ? 'wide' : ''}`}>
        <span>{label} {required && <small>*</small>}</span>
        {children}
    </label>
);

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA UMKM DETAIL
───────────────────────────────────────────── */
const UMKMDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [umkm, setUmkm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [komentar, setKomentar] = useState('');
    const [reviewPhotos, setReviewPhotos] = useState([]);
    const [reviewLightboxPhotos, setReviewLightboxPhotos] = useState([]);
    const [reviewLightboxStartIndex, setReviewLightboxStartIndex] = useState(0);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalNotice, setModalNotice] = useState(null);
    const [pageNotice, setPageNotice] = useState(null);
    const [currentUser, setCurrentUser] = useState(() => getCachedUser());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [reviewToEdit, setReviewToEdit] = useState(null);
    const [editReviewRating, setEditReviewRating] = useState(0);
    const [editReviewComment, setEditReviewComment] = useState('');
    const [editReviewExistingImages, setEditReviewExistingImages] = useState([]);
    const [editReviewPhotos, setEditReviewPhotos] = useState([]);
    const [editForm, setEditForm] = useState(defaultEditForm);
    const [editImage, setEditImage] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [editDetailImages, setEditDetailImages] = useState([]);
    const [editNewDetailPhotos, setEditNewDetailPhotos] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingReview, setIsDeletingReview] = useState(false);
    const [isUpdatingReview, setIsUpdatingReview] = useState(false);
    const [manageNotice, setManageNotice] = useState(null);
    const [savedUmkmIds, setSavedUmkmIds] = useState([]);
    const [isSavingUmkm, setIsSavingUmkm] = useState(false);
    
    const editNewDetailPhotosRef = useRef([]);
    const reviewPhotosRef = useRef([]);
    const editReviewPhotosRef = useRef([]);

    const isLoggedIn = Boolean(localStorage.getItem('token'));

    const fetchDetail = useCallback(async ({ keepPrevious = false } = {}) => {
        try {
            const response = await apiClient.get(`/umkm/${id}`);
            setUmkm(response.data);
            return response.data;
        } catch (error) {
            if (!keepPrevious) setUmkm(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        let ignore = false;
        apiClient.get(`/umkm/${id}`).then((res) => { if (!ignore) setUmkm(res.data); }).catch(() => { if (!ignore) setUmkm(null); }).finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [id]);

    useEffect(() => {
        if (!isLoggedIn) return;
        let ignore = false;
        apiClient.get('/auth/profile').then(({ data }) => {
            if (!ignore) { setCurrentUser(data.user); localStorage.setItem('user', JSON.stringify(data.user)); }
        }).catch(() => {});
        return () => { ignore = true; };
    }, [isLoggedIn]);

    // 🌟 PERBAIKAN: Fungsi Mengambil Daftar UMKM Favorit (Memanggil route favorit/me)
    useEffect(() => {
        if (!isLoggedIn) return;
        let ignore = false;
        const loadSavedUmkm = async () => {
            try {
                const { data } = await apiClient.get('/favorit/me');
                if (!ignore) {
                    setSavedUmkmIds(Array.isArray(data) ? data.map((item) => String(item.umkm_id)) : []);
                }
            } catch {
                if (!ignore) setSavedUmkmIds([]);
            }
        };
        loadSavedUmkm();
        window.addEventListener('saved-umkm-updated', loadSavedUmkm);
        return () => { ignore = true; window.removeEventListener('saved-umkm-updated', loadSavedUmkm); };
    }, [isLoggedIn]);

    useEffect(() => (() => { if (editPreview) URL.revokeObjectURL(editPreview); }), [editPreview]);
    useEffect(() => { editNewDetailPhotosRef.current = editNewDetailPhotos; }, [editNewDetailPhotos]);
    useEffect(() => { reviewPhotosRef.current = reviewPhotos; }, [reviewPhotos]);
    useEffect(() => { editReviewPhotosRef.current = editReviewPhotos; }, [editReviewPhotos]);
    useEffect(() => (() => { revokePhotoPreviews(editNewDetailPhotosRef.current); revokePhotoPreviews(reviewPhotosRef.current); revokePhotoPreviews(editReviewPhotosRef.current); }), []);

    useEffect(() => {
        if (!pageNotice) return;
        const timeout = setTimeout(() => setPageNotice(null), 4000);
        return () => clearTimeout(timeout);
    }, [pageNotice]);

    const allImages = useMemo(() => {
        if (!umkm) return [];
        const galleryImages = normalizeImageList(umkm.images);
        return [umkm.image, ...galleryImages].map(resolveImageUrl).filter(Boolean);
    }, [umkm]);
    
    const rawDetailImages = useMemo(() => normalizeImageList(umkm?.images), [umkm]);
    const isEditDetailGalleryFull = editDetailImages.length + editNewDetailPhotos.length >= MAX_DETAIL_PHOTOS;
    const reviews = useMemo(() => getReviews(umkm), [umkm]);
    const sortedReviews = useMemo(() => [...reviews].sort((a, b) => new Date(b.createdAt || b.waktu || 0).getTime() - new Date(a.createdAt || a.waktu || 0).getTime()), [reviews]);
    const displayedReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 3);
    const averageRating = useMemo(() => getAverageRating(reviews), [reviews]);
    const ratingLabel = formatRating(averageRating);
    const totalReviews = reviews.length;

    const latitude = Number(umkm?.latitude);
    const longitude = Number(umkm?.longitude);
    const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);
    const mapPosition = hasLocation ? [latitude, longitude] : null;
    const category = umkm?.jenis_makanan || 'Kuliner';
    const categoryType = getFoodCategoryType(category);
    const price = umkm?.harga_range || 'Harga belum diatur';
    const operationalHours = umkm?.jam_operasional || 'Jam operasional belum diatur';
    const description = umkm?.deskripsi || '';
    const address = umkm?.alamat_teks || 'Alamat belum ditambahkan';
    const primaryImage = allImages[0] || FALLBACK_IMAGE;
    const isAdmin = currentUser?.role === 'admin';
    const isSaved = isLoggedIn && savedUmkmIds.includes(String(id));
    const mapUrl = hasLocation ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : '';

    // HANDLERS
    const handleInvalidSession = () => {
        localStorage.removeItem('token'); localStorage.removeItem('user'); setCurrentUser(null); setSavedUmkmIds([]);
        window.dispatchEvent(new Event('profile-updated')); window.dispatchEvent(new Event('saved-umkm-updated'));
        setPageNotice({ type: 'warning', message: 'Sesi login tidak valid. Silakan login ulang.', actionLabel: 'Login', actionTarget: '/login' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenReview = () => {
        if (!isLoggedIn) return navigate('/login');
        setModalNotice(null); setIsReviewModalOpen(true);
    };

    const handleCloseReview = () => { setIsReviewModalOpen(false); setModalNotice(null); revokePhotoPreviews(reviewPhotos); setReviewPhotos([]); };

    const handleOpenEditReview = (review) => {
        setReviewToEdit(review); setEditReviewRating(Number(review.rating || 0)); setEditReviewComment(String(review.komentar || ''));
        setEditReviewExistingImages(normalizeImageList(review.images)); revokePhotoPreviews(editReviewPhotos); setEditReviewPhotos([]); setModalNotice(null);
    };
    const handleCloseEditReview = () => {
        setReviewToEdit(null); setEditReviewRating(0); setEditReviewComment(''); setEditReviewExistingImages([]); setModalNotice(null); revokePhotoPreviews(editReviewPhotos); setEditReviewPhotos([]);
    };

    const handleOpenLightbox = (index = 0) => { setLightboxStartIndex(index); setShowAllPhotos(true); };
    const handleOpenReviewPhotos = (photos, index = 0) => { setReviewLightboxPhotos(photos); setReviewLightboxStartIndex(index); };

    // Photo Handlers (Review)
    const handleReviewPhotoChange = (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (!files.length) { e.target.value = ''; return; }
        const remain = Math.max(MAX_REVIEW_PHOTOS - reviewPhotos.length, 0);
        if (remain === 0) { setModalNotice({ type: 'error', message: `Maksimal ${MAX_REVIEW_PHOTOS} foto.` }); e.target.value = ''; return; }
        const newPhotos = files.slice(0, remain).map(file => ({ id: Math.random().toString(), file, preview: URL.createObjectURL(file) }));
        setReviewPhotos((c) => [...c, ...newPhotos]);
        if (files.length > remain) setModalNotice({ type: 'error', message: `Hanya ${remain} foto ditambahkan.` }); else setModalNotice(null);
        e.target.value = '';
    };
    const handleRemoveReviewPhoto = (id) => {
        setReviewPhotos(c => { const p = c.find(x => x.id === id); if (p) URL.revokeObjectURL(p.preview); return c.filter(x => x.id !== id); });
    };

    // Photo Handlers (Edit Review)
    const handleEditReviewPhotoChange = (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (!files.length) { e.target.value = ''; return; }
        const count = editReviewExistingImages.length + editReviewPhotos.length;
        const remain = Math.max(MAX_REVIEW_PHOTOS - count, 0);
        if (remain === 0) { setModalNotice({ type: 'error', message: `Maksimal ${MAX_REVIEW_PHOTOS} foto.` }); e.target.value = ''; return; }
        const newPhotos = files.slice(0, remain).map(file => ({ id: Math.random().toString(), file, preview: URL.createObjectURL(file) }));
        setEditReviewPhotos(c => [...c, ...newPhotos]);
        if (files.length > remain) setModalNotice({ type: 'error', message: `Hanya ${remain} foto ditambahkan.` }); else setModalNotice(null);
        e.target.value = '';
    };
    const handleRemoveEditReviewPhoto = (id) => {
        setEditReviewPhotos(c => { const p = c.find(x => x.id === id); if (p) URL.revokeObjectURL(p.preview); return c.filter(x => x.id !== id); });
    };
    const handleRemoveExistingReviewImage = (img) => { setEditReviewExistingImages(c => c.filter(x => x !== img)); setModalNotice(null); };

    // Submit Review
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) return setModalNotice({ type: 'error', message: 'Pilih rating bintang!' });
        setIsSubmitting(true); setModalNotice(null);
        try {
            const fd = new FormData(); fd.append('rating', rating); fd.append('komentar', komentar.trim());
            reviewPhotos.forEach(p => fd.append('review_images', p.file));
            await apiClient.post(`/umkm/${id}/reviews`, fd);
            handleCloseReview(); setRating(0); setKomentar(''); setPageNotice({ type: 'success', message: 'Review berhasil ditambahkan.' });
            setShowAllReviews(false); window.dispatchEvent(new Event('activity-updated')); await fetchDetail();
        } catch (err) {
            if (isAuthSessionError(err)) { handleCloseReview(); handleInvalidSession(); return; }
            setModalNotice({ type: 'error', message: err.response?.data?.message || 'Gagal mengirim review.' });
        } finally { setIsSubmitting(false); }
    };

    const handleConfirmDeleteReview = async () => {
        if (!reviewToDelete?.id || isDeletingReview) return;
        setIsDeletingReview(true);
        try {
            const { data } = await apiClient.delete(`/umkm/${id}/reviews/${reviewToDelete.id}`);
            setUmkm(c => ({ ...(c || {}), reviews: getReviews(c).filter(r => Number(r.id) !== Number(reviewToDelete.id)) }));
            setReviewToDelete(null); setPageNotice({ type: 'success', message: data.message || 'Review dihapus.' });
            window.dispatchEvent(new Event('activity-updated'));
        } catch (err) {
            if (isAuthSessionError(err)) { setReviewToDelete(null); handleInvalidSession(); return; }
            setPageNotice({ type: 'error', message: err.response?.data?.message || 'Gagal menghapus review.' });
        } finally { setIsDeletingReview(false); }
    };

    const handleSubmitEditReview = async (e) => {
        e.preventDefault();
        if (!reviewToEdit?.id || isUpdatingReview) return;
        if (editReviewRating === 0) return setModalNotice({ type: 'error', message: 'Pilih rating bintang!' });
        if (!editReviewComment.trim()) return setModalNotice({ type: 'error', message: 'Komentar wajib diisi.' });
        setIsUpdatingReview(true); setModalNotice(null);
        try {
            const fd = new FormData(); fd.append('rating', editReviewRating); fd.append('komentar', editReviewComment.trim());
            fd.append('existing_review_images', JSON.stringify(editReviewExistingImages));
            editReviewPhotos.forEach(p => fd.append('review_images', p.file));
            const { data } = await apiClient.put(`/umkm/${id}/reviews/${reviewToEdit.id}`, fd);
            handleCloseEditReview(); setPageNotice({ type: 'success', message: data.message || 'Review diperbarui.' });
            window.dispatchEvent(new Event('activity-updated')); await fetchDetail({ keepPrevious: true });
        } catch (err) {
            if (isAuthSessionError(err)) { handleCloseEditReview(); handleInvalidSession(); return; }
            setModalNotice({ type: 'error', message: err.response?.data?.message || 'Gagal memperbarui review.' });
        } finally { setIsUpdatingReview(false); }
    };

    // UMKM Edit
    const handleOpenEdit = () => {
        setManageNotice(null); setEditImage(null); if (editPreview) URL.revokeObjectURL(editPreview); setEditPreview(null);
        revokePhotoPreviews(editNewDetailPhotos); setEditNewDetailPhotos([]); setEditDetailImages(rawDetailImages);
        setEditForm({ nama_umkm: umkm.nama_umkm || '', jenis_makanan: umkm.jenis_makanan || '', harga_range: umkm.harga_range || '', jam_operasional: umkm.jam_operasional || '', deskripsi: umkm.deskripsi || '', alamat_teks: umkm.alamat_teks || '' });
        setIsEditModalOpen(true);
    };
    const handleCloseEdit = () => { setIsEditModalOpen(false); setManageNotice(null); setEditImage(null); if (editPreview) URL.revokeObjectURL(editPreview); setEditPreview(null); revokePhotoPreviews(editNewDetailPhotos); setEditNewDetailPhotos([]); };
    const handleEditChange = (f) => (e) => setEditForm((c) => ({ ...c, [f]: e.target.value }));
    const handleEditImageChange = (e) => { const file = e.target.files[0]; if (!file) return; if (editPreview) URL.revokeObjectURL(editPreview); setEditImage(file); setEditPreview(URL.createObjectURL(file)); };
    
    const handleEditDetailPhotoChange = (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (!files.length) { e.target.value = ''; return; }
        const count = editDetailImages.length + editNewDetailPhotos.length;
        const remain = Math.max(MAX_DETAIL_PHOTOS - count, 0);
        if (remain === 0) return setManageNotice({ type: 'error', message: `Maksimal ${MAX_DETAIL_PHOTOS} foto.` });
        const newPhotos = files.slice(0, remain).map((f, i) => ({ id: Math.random().toString(), file: f, preview: URL.createObjectURL(f) }));
        setEditNewDetailPhotos((c) => [...c, ...newPhotos]);
        if (files.length > remain) setManageNotice({ type: 'error', message: `Hanya ${remain} foto ditambahkan.` }); else setManageNotice(null);
        e.target.value = '';
    };
    const handleRemoveExistingDetailImage = (img) => setEditDetailImages(c => c.filter(x => x !== img));
    const handleRemoveNewDetailPhoto = (id) => setEditNewDetailPhotos(c => { const p = c.find(x => x.id === id); if (p) URL.revokeObjectURL(p.preview); return c.filter(x => x.id !== id); });

    const handleUpdateUmkm = async (e) => {
        e.preventDefault();
        if (!editForm.nama_umkm.trim()) return setManageNotice({ type: 'error', message: 'Nama wajib diisi.' });
        setIsUpdating(true); setManageNotice(null);
        try {
            const fd = new FormData();
            Object.keys(editForm).forEach(k => fd.append(k, editForm[k].trim()));
            fd.append('latitude', umkm.latitude || 0); fd.append('longitude', umkm.longitude || 0);
            fd.append('existing_detail_images', JSON.stringify(editDetailImages));
            if (editImage) fd.append('image', editImage);
            editNewDetailPhotos.forEach(p => { if (p?.file) fd.append('detail_images', p.file); });
            const { data } = await apiClient.put(`/umkm/${id}`, fd);
            setUmkm(c => mergeUpdatedUmkm(c, data.umkm));
            window.dispatchEvent(new Event('umkm-updated')); handleCloseEdit();
            setPageNotice({ type: 'success', message: 'UMKM berhasil diperbarui.' }); void fetchDetail({ keepPrevious: true });
        } catch (err) { setManageNotice({ type: 'error', message: err.response?.data?.message || 'Gagal update UMKM.' }); } finally { setIsUpdating(false); }
    };

    const handleDeleteUmkm = async () => {
        setIsDeleting(true); setManageNotice(null);
        try { await apiClient.delete(`/umkm/${id}`); window.dispatchEvent(new Event('umkm-updated')); navigate('/#feed'); }
        catch (err) { setManageNotice({ type: 'error', message: err.response?.data?.message || 'Gagal hapus UMKM.' }); }
        finally { setIsDeleting(false); }
    };

    // 🌟 PERBAIKAN: Fungsi Toggle Favorit Memanggil Route /favorit/toggle
    const handleToggleSaved = async () => {
        if (!isLoggedIn) return navigate('/login');
        if (isSavingUmkm) return;
        const currentId = String(id);
        setIsSavingUmkm(true);

        try {
            await apiClient.post('/favorit/toggle', { umkm_id: currentId });
            
            if (isSaved) {
                setSavedUmkmIds((current) => current.filter((savedId) => savedId !== currentId));
                setPageNotice({ type: 'success', message: 'UMKM dihapus dari daftar simpanan.' });
            } else {
                setSavedUmkmIds((current) => [...new Set([...current, currentId])]);
                setPageNotice({ type: 'success', message: 'UMKM disimpan ke daftar simpanan.', actionLabel: 'Lihat', actionTarget: '/favorit' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.dispatchEvent(new Event('saved-umkm-updated'));
        } catch (error) {
            if (isAuthSessionError(error)) { handleInvalidSession(); return; }
            setPageNotice({ type: 'error', message: error.response?.data?.message || 'Gagal memperbarui simpanan. Coba lagi beberapa saat.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSavingUmkm(false);
        }
    };

    if (loading) return <DetailState title="Memuat detail" description="Sebentar, data sedang disiapkan." />;
    if (!umkm) return <DetailState title="UMKM tidak ditemukan" description="Data ini belum tersedia atau sudah dihapus." />;

    return (
        <main className="detail-page-wrapper">
            <style dangerouslySetInnerHTML={{ __html: detailCSS }} />
            <InlineNavbar />
            
            <div className="detail-container">
                {pageNotice && (
                    <div className={`toast-notice type-${pageNotice.type}`}>
                        <span>{pageNotice.message}</span>
                        {pageNotice.actionLabel && <button onClick={() => navigate(pageNotice.actionTarget)}>{pageNotice.actionLabel}</button>}
                    </div>
                )}

                {/* ── BAGIAN ATAS: JUDUL & GALERI SIMETRIS ── */}
                <header className="hero-head">
                    <div className="hero-title-area">
                        <h1>{umkm.nama_umkm}</h1>
                        <div className="hero-meta">
                            <span className="badge-cat">{renderFoodCategoryIcon(categoryType)} {category}</span>
                            <span className="badge-rate"><Star /> {ratingLabel} <small>({totalReviews})</small></span>
                            <span className="badge-price"><DollarSign /> {price}</span>
                        </div>
                    </div>

                    <div className={`hero-gallery ${allImages.length <= 1 ? 'single-img' : ''}`}>
                        <div className="main-img" onClick={() => handleOpenLightbox(0)}>
                            <img src={primaryImage} alt={umkm.nama_umkm} />
                        </div>
                        {allImages.length > 1 && (
                            <div className="side-imgs">
                                {allImages.slice(1, 5).map((img, i) => (
                                    <div className="side-img-box" key={i} onClick={() => handleOpenLightbox(i + 1)}>
                                        <img src={img} alt={`Galeri ${i+1}`} />
                                        {i === 3 && allImages.length > 5 && (
                                            <div className="more-overlay">+{allImages.length - 5}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                {/* ── ACTION BAR ── */}
                <div className="action-bar-unified">
                    <button className="btn-primary" onClick={handleOpenReview}><MessageCircle /> Tulis Review</button>
                    <button className={`btn-outline ${isSaved ? 'saved' : ''}`} onClick={handleToggleSaved} disabled={isSavingUmkm}>
                        <Bookmark /> {isSavingUmkm ? 'Wait...' : isSaved ? 'Tersimpan' : 'Simpan'}
                    </button>
                    {hasLocation && (
                        <a className="btn-outline" href={mapUrl} target="_blank" rel="noreferrer"><Navigation /> Rute Map</a>
                    )}
                    {/* HANYA MUNCUL JIKA USER ADALAH ADMIN */}
{isAdmin && (
    <>
        <div className="divider" />
        <button className="btn-outline owner" onClick={handleOpenEdit}><PencilLine /> Edit UMKM</button>
        <button className="btn-outline danger" onClick={() => setIsDeleteModalOpen(true)}><Trash2 /> Hapus UMKM</button>
    </>
)}
                </div>

                {/* ── SPLIT LAYOUT ── */}
                <div className="split-layout-50-50">
                    <div className="split-col">
                        <section className="info-box">
                            <h2>Tentang UMKM</h2>
                            <div className="info-grid">
                                <InfoItem iconNode={renderFoodCategoryIcon(categoryType)} label="Kategori" value={category} />
                                <InfoItem icon={DollarSign} label="Harga" value={price} />
                                <InfoItem icon={Clock} label="Jam Buka" value={operationalHours} />
                            </div>
                            {description && (
                                <div className="desc-box">
                                    <strong>Deskripsi</strong>
                                    <p>{description}</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="split-col">
                        <section className="info-box map-box-section">
                            <h2>Lokasi & Alamat</h2>
                            <div className="map-frame">
                                {hasLocation ? (
                                    <MapContainer center={mapPosition} zoom={16} zoomControl={false} scrollWheelZoom={false} style={{width:'100%', height:'100%'}}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={mapPosition}><Popup>{umkm.nama_umkm}</Popup></Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="no-map-overlay"><MapPin /> Lokasi GPS belum diatur</div>
                                )}
                            </div>
                            <p className="address-text"><MapPin /> {address}</p>
                        </section>
                    </div>
                </div>

                {/* ── ULASAN PELANGGAN ── */}
                <section className="reviews-section-wide">
                    <div className="reviews-head">
                        <h2>Ulasan Pelanggan</h2>
                        <span>{totalReviews} ulasan</span>
                    </div>
                    
                    <div className="reviews-list-wide">
                        {displayedReviews.length > 0 ? displayedReviews.map((review) => (
                            <ReviewBubble
                                key={review.id || `${getReviewName(review)}-${review.createdAt}`}
                                review={review}
                                canManage={Boolean(review.id && currentUser?.id && Number(getReviewUserId(review)) === Number(currentUser.id))}
                                isDeleting={isDeletingReview && Number(reviewToDelete?.id) === Number(review.id)}
                                isUpdating={isUpdatingReview && Number(reviewToEdit?.id) === Number(review.id)}
                                onEdit={() => handleOpenEditReview(review)}
                                onDelete={() => setReviewToDelete(review)}
                                onOpenPhotos={handleOpenReviewPhotos}
                            />
                        )) : (
                            <div className="empty-reviews-state">
                                <MessageCircle />
                                <strong>Belum ada ulasan</strong>
                                <p>Jadilah yang pertama menceritakan pengalamanmu di sini.</p>
                            </div>
                        )}
                    </div>
                    {sortedReviews.length > 3 && (
                        <button className="btn-show-all-reviews" onClick={() => setShowAllReviews(!showAllReviews)}>
                            {showAllReviews ? 'Tutup sebagian' : `Lihat semua ${sortedReviews.length} ulasan`}
                        </button>
                    )}
                </section>
            </div>

            {/* ── MODALS KELOLA & REVIEW ── */}
            {isEditModalOpen && (
                <div className="modal-backdrop" onClick={handleCloseEdit}>
                    <div className="modal-content wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit UMKM</h2>
                            <button className="btn-close-modal" onClick={handleCloseEdit}><X/></button>
                        </div>
                        {manageNotice && <div className={`form-notice type-${manageNotice.type}`}>{manageNotice.message}</div>}
                        <form className="edit-form-grid" onSubmit={handleUpdateUmkm}>
                            {/* Sampul Utama */}
                            <label className="edit-cover-wrap">
                                <img src={editPreview || primaryImage} alt="Sampul" />
                                <div className="edit-cover-overlay"><ImagePlus/> Ganti Sampul</div>
                                <input type="file" accept="image/*" hidden onChange={handleEditImageChange} />
                            </label>
                            {/* Galeri Detail */}
                            <div className="edit-gallery-wrap">
                                <div className="edit-gallery-head">
                                    <span>Galeri ({editDetailImages.length + editNewDetailPhotos.length}/{MAX_DETAIL_PHOTOS})</span>
                                    <label className="btn-add-gallery">
                                        <ImagePlus/> Tambah <input type="file" accept="image/*" multiple hidden disabled={isEditDetailGalleryFull} onChange={handleEditDetailPhotoChange} />
                                    </label>
                                </div>
                                <div className="edit-gallery-list">
                                    {editDetailImages.map(img => (
                                        <div className="gallery-edit-card" key={img}>
                                            <img src={resolveImageUrl(img)} alt="galeri" />
                                            <button type="button" onClick={() => handleRemoveExistingDetailImage(img)}>Hapus</button>
                                        </div>
                                    ))}
                                    {editNewDetailPhotos.map(photo => (
                                        <div className="gallery-edit-card new" key={photo.id}>
                                            <img src={photo.preview} alt="baru" />
                                            <button type="button" onClick={() => handleRemoveNewDetailPhoto(photo.id)}>Batal</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <ManageField label="Nama UMKM" required><input value={editForm.nama_umkm} onChange={handleEditChange('nama_umkm')} required /></ManageField>
                            <ManageField label="Kategori"><DetailCategoryDropdown value={editForm.jenis_makanan} options={FOOD_TYPE_OPTIONS} placeholder="Pilih Kategori" onChange={v => setEditForm(c => ({...c, jenis_makanan:v}))} /></ManageField>
                            <ManageField label="Harga"><input list="price-opts" value={editForm.harga_range} onChange={handleEditChange('harga_range')} /><datalist id="price-opts">{PRICE_OPTIONS.map(o => <option key={o} value={o}/>)}</datalist></ManageField>
                            <ManageField label="Jam Buka"><input list="hour-opts" value={editForm.jam_operasional} onChange={handleEditChange('jam_operasional')} /><datalist id="hour-opts">{OPERATING_HOUR_OPTIONS.map(o => <option key={o} value={o}/>)}</datalist></ManageField>
                            <ManageField label="Alamat" wide><input value={editForm.alamat_teks} onChange={handleEditChange('alamat_teks')} /></ManageField>
                            <ManageField label="Deskripsi" wide><textarea rows={3} value={editForm.deskripsi} onChange={handleEditChange('deskripsi')} /></ManageField>
                            <div className="modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={handleCloseEdit}>Batal</button>
                                <button type="submit" className="btn-modal-save" disabled={isUpdating}>{isUpdating ? 'Wait...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="modal-content narrow center" onClick={e => e.stopPropagation()}>
                        <div className="icon-danger"><Trash2/></div>
                        <h2>Hapus UMKM?</h2>
                        <p>Data ini tidak dapat dikembalikan lagi setelah dihapus.</p>
                        {manageNotice && <div className={`form-notice type-${manageNotice.type}`}>{manageNotice.message}</div>}
                        <div className="modal-footer-center">
                            <button className="btn-modal-cancel" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
                            <button className="btn-modal-danger" onClick={handleDeleteUmkm} disabled={isDeleting}>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</button>
                        </div>
                    </div>
                </div>
            )}

            {isReviewModalOpen && (
                <div className="modal-backdrop" onClick={handleCloseReview}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Tulis Review</h2>
                            <button className="btn-close-modal" onClick={handleCloseReview}><X/></button>
                        </div>
                        {modalNotice && <div className={`form-notice type-${modalNotice.type}`}>{modalNotice.message}</div>}
                        <form onSubmit={handleSubmitReview}>
                            <div className="form-group">
                                <label>Beri Rating</label>
                                <RatingStars value={rating} interactive onChange={setRating} />
                            </div>
                            <div className="form-group">
                                <label>Komentar</label>
                                <textarea rows={4} value={komentar} onChange={e => setKomentar(e.target.value)} required placeholder="Ceritakan pengalamanmu..." />
                            </div>
                            <div className="form-group">
                                <div className="upload-header">
                                    <label>Foto Review ({reviewPhotos.length}/4)</label>
                                    <label className={`btn-upload-small ${reviewPhotos.length>=4?'disabled':''}`}>
                                        <Camera/> Tambah <input type="file" hidden multiple accept="image/*" disabled={reviewPhotos.length>=4} onChange={handleReviewPhotoChange} />
                                    </label>
                                </div>
                                <div className="upload-preview-grid">
                                    {reviewPhotos.map(p => (
                                        <div key={p.id} className="preview-card"><img src={p.preview} alt="preview" /><button type="button" onClick={()=>handleRemoveReviewPhoto(p.id)}><X/></button></div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={handleCloseReview}>Batal</button>
                                <button type="submit" className="btn-modal-save" disabled={isSubmitting}>{isSubmitting ? 'Wait...' : 'Kirim'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {reviewToEdit && (
                <div className="modal-backdrop" onClick={handleCloseEditReview}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Review</h2>
                            <button className="btn-close-modal" onClick={handleCloseEditReview}><X/></button>
                        </div>
                        {modalNotice && <div className={`form-notice type-${modalNotice.type}`}>{modalNotice.message}</div>}
                        <form onSubmit={handleSubmitEditReview}>
                            <div className="form-group">
                                <label>Beri Rating</label>
                                <RatingStars value={editReviewRating} interactive onChange={setEditReviewRating} />
                            </div>
                            <div className="form-group">
                                <label>Komentar</label>
                                <textarea rows={4} value={editReviewComment} onChange={e => setEditReviewComment(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <div className="upload-header">
                                    <label>Foto Review ({editReviewExistingImages.length + editReviewPhotos.length}/4)</label>
                                    <label className={`btn-upload-small ${(editReviewExistingImages.length + editReviewPhotos.length)>=4?'disabled':''}`}>
                                        <Camera/> Tambah <input type="file" hidden multiple accept="image/*" disabled={(editReviewExistingImages.length + editReviewPhotos.length)>=4} onChange={handleEditReviewPhotoChange} />
                                    </label>
                                </div>
                                <div className="upload-preview-grid">
                                    {editReviewExistingImages.map(img => (
                                        <div key={img} className="preview-card"><img src={resolveImageUrl(img)} alt="old" /><button type="button" onClick={()=>handleRemoveExistingReviewImage(img)}><X/></button></div>
                                    ))}
                                    {editReviewPhotos.map(p => (
                                        <div key={p.id} className="preview-card"><img src={p.preview} alt="new" /><button type="button" onClick={()=>handleRemoveEditReviewPhoto(p.id)}><X/></button></div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={handleCloseEditReview}>Batal</button>
                                <button type="submit" className="btn-modal-save" disabled={isUpdatingReview}>{isUpdatingReview ? 'Wait...' : 'Update'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {reviewToDelete && (
                <div className="modal-backdrop" onClick={() => setReviewToDelete(null)}>
                    <div className="modal-content narrow center" onClick={e => e.stopPropagation()}>
                        <div className="icon-danger"><Trash2/></div>
                        <h2>Hapus Review?</h2>
                        <p>Review ini akan dihapus secara permanen.</p>
                        <div className="modal-footer-center">
                            <button className="btn-modal-cancel" onClick={() => setReviewToDelete(null)}>Batal</button>
                            <button className="btn-modal-danger" onClick={handleConfirmDeleteReview} disabled={isDeletingReview}>{isDeletingReview ? 'Wait...' : 'Hapus'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showAllPhotos && (
                <Lightbox photos={allImages.length ? allImages : [primaryImage]} title={umkm.nama_umkm} initialIndex={lightboxStartIndex} onClose={() => setShowAllPhotos(false)} />
            )}

            {reviewLightboxPhotos.length > 0 && (
                <Lightbox photos={reviewLightboxPhotos} title={`Review ${umkm.nama_umkm}`} initialIndex={reviewLightboxStartIndex} onClose={() => setReviewLightboxPhotos([])} />
            )}
        </main>
    );
};

/* ─────────────────────────────────────────────
   CSS INJECTION: DESAIN BARU
───────────────────────────────────────────── */
const detailCSS = `
    :root {
        --green: #1f3f2f;
        --green-2: #2f6047;
        --green-dark: #102417;
        --cream: #fbfaf6;
        --cream-soft: #fffaf0;
        --cream-2: #f5efe4;
        --gold: #efb84f;
        --gold-soft: #fff4d8;
        --danger: #b42318;
        --danger-soft: #fff0ed;
        --text: #181714;
        --muted: #756f64;
        --line: rgba(24, 23, 20, 0.1);
        --shadow-sm: 0 8px 22px rgba(24, 23, 20, 0.07);
        --shadow-md: 0 16px 38px rgba(24, 23, 20, 0.11);
        --shadow-lg: 0 28px 70px rgba(24, 23, 20, 0.18);
        --radius-xl: 30px;
        --radius-lg: 24px;
        --radius-md: 18px;
        --radius-sm: 13px;
    }

    * {
        box-sizing: border-box;
    }

    html,
    body {
        margin: 0;
        overflow-x: hidden;
        background: var(--cream);
        color-scheme: light;
    }

    button,
    input,
    textarea {
        font: inherit;
    }

    button {
        -webkit-tap-highlight-color: transparent;
    }

    @keyframes detailFadeUp {
        from {
            opacity: 0;
            transform: translateY(16px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes detailSlideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes modalPop {
        from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    /* =========================
       PAGE BASE
    ========================= */

    .detail-page-wrapper,
    .detail-page {
        min-height: 100vh;
        overflow-x: hidden;
        background:
            radial-gradient(circle at 8% 0%, rgba(239, 184, 79, 0.14), transparent 24%),
            radial-gradient(circle at 92% 14%, rgba(31, 63, 47, 0.1), transparent 28%),
            linear-gradient(180deg, var(--cream-soft) 0%, var(--cream) 42%, #f6efe5 100%);
        color: var(--text);
        font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        padding-bottom: 70px;
    }

    .detail-container {
        width: min(1160px, calc(100% - 40px));
        margin: 0 auto;
        padding: clamp(28px, 4vw, 46px) 0 0;
    }

    /* =========================
       NAVBAR
    ========================= */

    .inline-navbar {
        position: sticky;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        min-height: 74px;
        border-bottom: 1px solid rgba(24, 23, 20, 0.06);
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 8px 24px rgba(35, 34, 29, 0.06);
        padding: 0 clamp(18px, 5vw, 70px);
    }

    .btn-nav-back {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 40px;
        border: 1px solid rgba(31, 63, 47, 0.14);
        border-radius: 999px;
        background: #fff;
        color: var(--green);
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
        padding: 9px 15px;
        box-shadow: 0 8px 18px rgba(24, 23, 20, 0.05);
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .btn-nav-back:hover {
        transform: translateY(-2px);
        background: var(--gold-soft);
    }

    .btn-nav-back svg {
        width: 17px;
        height: 17px;
    }

    .nav-logo {
        position: relative;
        color: var(--text);
        cursor: pointer;
        font-size: 22px;
        font-weight: 950;
        letter-spacing: -0.04em;
        white-space: nowrap;
    }

    .nav-logo span {
        color: var(--gold);
    }

    .nav-logo::after {
        content: "";
        position: absolute;
        right: 0;
        bottom: -7px;
        width: 42px;
        height: 4px;
        border-radius: 999px;
        background: linear-gradient(90deg, transparent, var(--gold));
    }

    /* =========================
       STATE CARD
    ========================= */

    .state-card {
        width: min(520px, calc(100% - 32px));
        margin: 90px auto 0;
        display: grid;
        justify-items: center;
        gap: 10px;
        border: 1px solid rgba(31, 63, 47, 0.12);
        border-radius: var(--radius-xl);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: var(--shadow-md);
        padding: 34px 24px;
        text-align: center;
        animation: detailFadeUp 0.45s ease both;
    }

    .state-card svg {
        width: 42px;
        height: 42px;
        color: var(--green);
    }

    .state-card strong {
        color: var(--text);
        font-size: 22px;
        font-weight: 950;
    }

    .state-card span {
        color: var(--muted);
        font-size: 14px;
        font-weight: 650;
        line-height: 1.55;
    }

    /* =========================
       TOAST
    ========================= */

    .toast-notice {
        position: fixed;
        top: 92px;
        right: clamp(14px, 3vw, 34px);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: min(520px, calc(100% - 28px));
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 18px;
        background: var(--green);
        color: #fff;
        box-shadow: var(--shadow-md);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.45;
        padding: 13px 15px;
        animation: detailSlideDown 0.25s ease both;
    }

    .toast-notice.type-error {
        background: var(--danger);
    }

    .toast-notice.type-warning {
        background: #8a5a00;
    }

    .toast-notice.type-success {
        background: var(--green);
    }

    .toast-notice button {
        flex: 0 0 auto;
        border: 0;
        border-radius: 999px;
        background: #fff;
        color: var(--green);
        cursor: pointer;
        font-size: 12px;
        font-weight: 950;
        padding: 7px 11px;
    }

    /* =========================
       HERO TITLE + META
    ========================= */

    .hero-head {
        position: relative;
        animation: detailFadeUp 0.5s ease both;
    }

    .hero-title-area {
        max-width: 950px;
        margin-bottom: 22px;
    }

    .hero-title-area h1 {
        margin: 0;
        color: var(--text);
        font-size: clamp(34px, 5vw, 58px);
        font-weight: 950;
        letter-spacing: -0.06em;
        line-height: 0.98;
    }

    .hero-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
    }

    .hero-meta span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 36px;
        border-radius: 999px;
        font-size: 12.5px;
        font-weight: 900;
        padding: 8px 12px;
    }

    .hero-meta svg {
        width: 16px;
        height: 16px;
    }

    .badge-cat {
        border: 1px solid rgba(239, 184, 79, 0.3);
        background: var(--gold-soft);
        color: #8a5a00;
    }

    .badge-rate,
    .badge-price {
        border: 1px solid rgba(31, 63, 47, 0.1);
        background: #fff;
        color: var(--green);
        box-shadow: 0 8px 18px rgba(24, 23, 20, 0.04);
    }

    .badge-rate svg {
        color: var(--gold);
        fill: currentColor;
    }

    .badge-rate small {
        color: var(--muted);
        font-weight: 800;
    }

    /* =========================
       GALLERY
    ========================= */

    .hero-gallery {
        display: grid;
        grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.9fr);
        gap: 14px;
        height: clamp(330px, 52vh, 500px);
        overflow: hidden;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 32px;
        background: #eee7da;
        box-shadow: var(--shadow-md);
    }

    .hero-gallery.single-img {
        grid-template-columns: 1fr;
    }

    .main-img,
    .side-img-box {
        position: relative;
        overflow: hidden;
        cursor: pointer;
        background: #eee7da;
    }

    .main-img::after,
    .side-img-box::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(180deg, transparent 45%, rgba(0, 0, 0, 0.32) 100%);
        opacity: 0.65;
        transition: opacity 0.2s ease;
    }

    .main-img:hover::after,
    .side-img-box:hover::after {
        opacity: 0.88;
    }

    .main-img img,
    .side-img-box img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        object-position: center;
        transition: transform 0.26s ease;
    }

    .main-img:hover img,
    .side-img-box:hover img {
        transform: scale(1.045);
    }

    .side-imgs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 14px;
    }

    .more-overlay {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: grid;
        place-items: center;
        background: rgba(13, 31, 22, 0.68);
        color: #fff;
        font-size: 28px;
        font-weight: 950;
        letter-spacing: -0.03em;
    }

    /* =========================
       ACTION BAR
    ========================= */

    .action-bar-unified {
        position: sticky;
        top: 86px;
        z-index: 60;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin: 24px 0 0;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 14px 34px rgba(24, 23, 20, 0.08);
        padding: 12px;
    }

    .action-bar-unified button,
    .action-bar-unified a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 950;
        text-decoration: none;
        padding: 10px 16px;
        transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
    }

    .action-bar-unified svg {
        width: 17px;
        height: 17px;
    }

    .btn-primary {
        border: 0;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
        box-shadow: 0 10px 22px rgba(31, 63, 47, 0.18);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        background: var(--green-2);
    }

    .btn-outline {
        border: 1px solid rgba(31, 63, 47, 0.14);
        background: #fff;
        color: var(--green);
    }

    .btn-outline:hover {
        transform: translateY(-2px);
        background: var(--gold-soft);
    }

    .btn-outline.saved {
        border-color: rgba(239, 184, 79, 0.38);
        background: var(--gold-soft);
        color: #8a5a00;
    }

    .btn-outline.owner {
        border-color: rgba(31, 63, 47, 0.18);
        background: #f7f2e8;
    }

    .btn-outline.danger {
        border-color: rgba(180, 35, 24, 0.24);
        background: var(--danger-soft);
        color: var(--danger);
    }

    .divider {
        width: 1px;
        height: 26px;
        background: rgba(24, 23, 20, 0.12);
        margin: 0 2px;
    }

    /* =========================
       INFO + MAP
    ========================= */

    .split-layout-50-50 {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 24px;
        margin-top: 30px;
        align-items: stretch;
    }

    .split-col {
        min-width: 0;
        display: flex;
    }

    .info-box {
        width: 100%;
        min-height: 100%;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 14px 32px rgba(24, 23, 20, 0.07);
        padding: clamp(20px, 3vw, 26px);
        animation: detailFadeUp 0.5s ease both;
    }

    .info-box h2 {
        margin: 0 0 18px;
        color: var(--text);
        font-size: 22px;
        font-weight: 950;
        letter-spacing: -0.035em;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 20px;
    }

    .info-item {
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(31, 63, 47, 0.08);
        border-radius: 18px;
        background: #fbfaf6;
        padding: 12px;
    }

    .info-icon {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 16px;
        background: var(--gold-soft);
        color: var(--green);
    }

    .info-icon svg {
        width: 21px;
        height: 21px;
    }

    .info-text {
        min-width: 0;
    }

    .info-text small,
    .info-text strong {
        display: block;
    }

    .info-text small {
        color: var(--muted);
        font-size: 11.5px;
        font-weight: 850;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .info-text strong {
        margin-top: 4px;
        color: var(--text);
        font-size: 14.5px;
        font-weight: 900;
        line-height: 1.35;
    }

    .desc-box {
        border-top: 1px solid rgba(31, 63, 47, 0.1);
        padding-top: 18px;
    }

    .desc-box strong {
        display: block;
        color: var(--text);
        font-size: 14px;
        font-weight: 950;
        margin-bottom: 8px;
    }

    .desc-box p {
        margin: 0;
        color: #555044;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.72;
    }

    .map-box-section {
        overflow: hidden;
    }

    .map-frame {
        width: 100%;
        height: 260px;
        overflow: hidden;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 22px;
        background: #eee7da;
        margin-bottom: 14px;
    }

    .leaflet-container {
        font-family: inherit;
    }

    .no-map-overlay {
        height: 100%;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 8px;
        color: var(--muted);
        font-size: 13px;
        font-weight: 850;
    }

    .no-map-overlay svg {
        width: 34px;
        height: 34px;
        color: var(--green);
    }

    .address-text {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0;
        color: #555044;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.6;
    }

    .address-text svg {
        flex: 0 0 auto;
        width: 17px;
        height: 17px;
        color: var(--green);
        margin-top: 3px;
    }

    /* =========================
       REVIEWS
    ========================= */

    .reviews-section-wide {
        margin-top: 38px;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 14px 34px rgba(24, 23, 20, 0.07);
        padding: clamp(20px, 3vw, 28px);
        animation: detailFadeUp 0.5s ease both;
    }

    .reviews-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid rgba(31, 63, 47, 0.1);
        padding-bottom: 16px;
        margin-bottom: 18px;
    }

    .reviews-head h2 {
        margin: 0;
        color: var(--text);
        font-size: clamp(24px, 3vw, 32px);
        font-weight: 950;
        letter-spacing: -0.04em;
        line-height: 1.08;
    }

    .reviews-head span {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        border-radius: 999px;
        background: var(--gold-soft);
        color: #8a5a00;
        font-size: 12px;
        font-weight: 950;
        padding: 8px 12px;
        white-space: nowrap;
    }

    .reviews-list-wide {
        display: grid;
        gap: 16px;
    }

    .review-item {
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr);
        gap: 14px;
        align-items: flex-start;
    }

    .detail-avatar {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border: 3px solid #fff;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--green), var(--gold));
        color: #fff;
        font-size: 16px;
        font-weight: 950;
        box-shadow: 0 10px 24px rgba(31, 63, 47, 0.16);
    }

    .review-bubble {
        min-width: 0;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 0 22px 22px 22px;
        background: #fff;
        box-shadow: 0 10px 24px rgba(24, 23, 20, 0.05);
        padding: 16px;
    }

    .review-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
    }

    .review-meta-text strong,
    .review-meta-text span {
        display: block;
    }

    .review-meta-text strong {
        color: var(--text);
        font-size: 14.5px;
        font-weight: 950;
    }

    .review-meta-text span {
        margin-top: 3px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
    }

    .review-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
    }

    .review-actions button {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        min-height: 30px;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        font-size: 11.5px;
        font-weight: 900;
        padding: 6px 10px;
        transition: transform 0.18s ease;
    }

    .review-actions button:hover {
        transform: translateY(-2px);
    }

    .review-actions svg {
        width: 13px;
        height: 13px;
    }

    .btn-review-edit {
        background: var(--gold-soft);
        color: #8a5a00;
    }

    .btn-review-delete {
        background: var(--danger-soft);
        color: var(--danger);
    }

    .review-bubble p {
        display: -webkit-box;
        margin: 8px 0 0;
        overflow: hidden;
        color: #555044;
        font-size: 14px;
        font-weight: 650;
        line-height: 1.65;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 4;
    }

    .review-bubble p.is-expanded {
        display: block;
    }

    .btn-review-more {
        margin-top: 8px;
        border: 0;
        background: transparent;
        color: var(--green);
        cursor: pointer;
        font-size: 12.5px;
        font-weight: 950;
        padding: 0;
    }

    .detail-stars {
        display: flex;
        align-items: center;
        gap: 3px;
        color: #d3c6a8;
    }

    .detail-star {
        width: 18px;
        height: 18px;
        color: #d3c6a8;
    }

    .detail-star.is-active {
        color: var(--gold);
        fill: currentColor;
    }

    .detail-stars.is-interactive {
        gap: 6px;
    }

    .detail-stars.is-interactive .detail-star {
        width: 24px;
        height: 24px;
    }

    .detail-stars.is-interactive button {
        display: grid;
        place-items: center;
        border: 0;
        background: transparent;
        color: #d3c6a8;
        cursor: pointer;
        padding: 0;
        transition: transform 0.16s ease, color 0.16s ease;
    }

    .detail-stars.is-interactive button:hover {
        transform: translateY(-2px) scale(1.08);
        color: var(--gold);
    }

    .review-photos-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
    }

    .review-photos-grid button {
        overflow: hidden;
        border: 0;
        border-radius: 14px;
        background: #eee7da;
        cursor: pointer;
        padding: 0;
        aspect-ratio: 1;
    }

    .review-photos-grid img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.2s ease;
    }

    .review-photos-grid button:hover img {
        transform: scale(1.05);
    }

    .empty-reviews-state {
        display: grid;
        justify-items: center;
        gap: 8px;
        border: 1px dashed rgba(31, 63, 47, 0.22);
        border-radius: 24px;
        background: #fbfaf6;
        color: var(--muted);
        text-align: center;
        padding: 34px 20px;
    }

    .empty-reviews-state svg {
        width: 38px;
        height: 38px;
        color: var(--green);
    }

    .empty-reviews-state strong {
        color: var(--text);
        font-size: 17px;
        font-weight: 950;
    }

    .empty-reviews-state p {
        max-width: 420px;
        margin: 0;
        font-size: 13.5px;
        font-weight: 650;
        line-height: 1.55;
    }

    .btn-show-all-reviews {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        margin-top: 18px;
        border: 1px solid rgba(31, 63, 47, 0.14);
        border-radius: 999px;
        background: #fff;
        color: var(--green);
        cursor: pointer;
        font-size: 13px;
        font-weight: 950;
        padding: 10px 16px;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .btn-show-all-reviews:hover {
        transform: translateY(-2px);
        background: var(--gold-soft);
    }

    /* =========================
       MODAL
    ========================= */

    .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: grid;
        place-items: center;
        overflow-y: auto;
        background: rgba(13, 17, 14, 0.58);
        padding: 22px;
    }

    .modal-content {
        width: min(620px, 100%);
        max-height: calc(100vh - 44px);
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 28px;
        background: #fff;
        box-shadow: var(--shadow-lg);
        padding: 22px;
        animation: modalPop 0.22s ease both;
    }

    .modal-content.wide {
        width: min(900px, 100%);
    }

    .modal-content.narrow {
        width: min(440px, 100%);
    }

    .modal-content.center {
        text-align: center;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid rgba(31, 63, 47, 0.1);
        padding-bottom: 14px;
        margin-bottom: 18px;
    }

    .modal-header h2 {
        margin: 0;
        color: var(--text);
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.035em;
    }

    .btn-close-modal {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: #f2eee5;
        color: var(--text);
        cursor: pointer;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .btn-close-modal:hover {
        transform: rotate(90deg);
        background: var(--gold-soft);
    }

    .btn-close-modal svg {
        width: 18px;
        height: 18px;
    }

    .form-notice {
        border-radius: 16px;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.45;
        padding: 12px 14px;
        margin-bottom: 14px;
    }

    .form-notice.type-error {
        background: var(--danger-soft);
        color: var(--danger);
    }

    .form-notice.type-success {
        background: #eaf7ef;
        color: var(--green);
    }

    .form-notice.type-warning {
        background: var(--gold-soft);
        color: #8a5a00;
    }

    .form-group {
        display: grid;
        gap: 8px;
        margin-bottom: 16px;
    }

    .form-group label,
    .manage-field > span {
        color: var(--text);
        font-size: 13px;
        font-weight: 950;
    }

    .form-group textarea,
    .manage-field input,
    .manage-field textarea,
    .dropdown-trigger {
        width: 100%;
        border: 1px solid rgba(31, 63, 47, 0.12);
        border-radius: 16px;
        background: #fbfaf6;
        color: var(--text);
        outline: 0;
        font-size: 13.5px;
        font-weight: 650;
        padding: 12px 13px;
        transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
    }

    .form-group textarea:focus,
    .manage-field input:focus,
    .manage-field textarea:focus,
    .dropdown-trigger:focus {
        border-color: rgba(31, 63, 47, 0.35);
        background: #fff;
        box-shadow: 0 0 0 4px rgba(31, 63, 47, 0.08);
    }

    textarea {
        resize: vertical;
    }

    .modal-footer,
    .modal-footer-center {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
    }

    .modal-footer-center {
        justify-content: center;
    }

    .btn-modal-cancel,
    .btn-modal-save,
    .btn-modal-danger {
        min-height: 42px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 950;
        padding: 10px 18px;
        transition: transform 0.18s ease, background 0.18s ease;
    }

    .btn-modal-cancel {
        border: 1px solid rgba(31, 63, 47, 0.14);
        background: #fff;
        color: var(--green);
    }

    .btn-modal-save {
        border: 0;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        color: #fff;
    }

    .btn-modal-danger {
        border: 0;
        background: var(--danger);
        color: #fff;
    }

    .btn-modal-cancel:hover,
    .btn-modal-save:hover,
    .btn-modal-danger:hover {
        transform: translateY(-2px);
    }

    .icon-danger {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        margin: 0 auto 12px;
        border-radius: 22px;
        background: var(--danger-soft);
        color: var(--danger);
    }

    .icon-danger svg {
        width: 30px;
        height: 30px;
    }

    .modal-content.center h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 950;
        color: var(--text);
    }

    .modal-content.center p {
        margin: 10px auto 0;
        max-width: 320px;
        color: var(--muted);
        font-size: 14px;
        font-weight: 650;
        line-height: 1.55;
    }

    /* =========================
       EDIT FORM
    ========================= */

    .edit-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
    }

    .edit-cover-wrap {
        position: relative;
        grid-column: 1 / -1;
        height: 230px;
        overflow: hidden;
        border-radius: 24px;
        background: #eee7da;
        cursor: pointer;
    }

    .edit-cover-wrap img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .edit-cover-overlay {
        position: absolute;
        inset: auto 14px 14px 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: var(--green);
        font-size: 13px;
        font-weight: 950;
    }

    .edit-cover-overlay svg {
        width: 18px;
        height: 18px;
    }

    .edit-gallery-wrap {
        grid-column: 1 / -1;
        border: 1px solid rgba(31, 63, 47, 0.1);
        border-radius: 22px;
        background: #fbfaf6;
        padding: 14px;
    }

    .edit-gallery-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
    }

    .edit-gallery-head span {
        color: var(--text);
        font-size: 13px;
        font-weight: 950;
    }

    .btn-add-gallery {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        border-radius: 999px;
        background: var(--green);
        color: #fff;
        cursor: pointer;
        font-size: 12px;
        font-weight: 950;
        padding: 8px 12px;
    }

    .btn-add-gallery svg {
        width: 15px;
        height: 15px;
    }

    .edit-gallery-list {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
    }

    .gallery-edit-card {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        background: #eee7da;
        aspect-ratio: 1;
    }

    .gallery-edit-card img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .gallery-edit-card button {
        position: absolute;
        inset: auto 8px 8px 8px;
        min-height: 28px;
        border: 0;
        border-radius: 999px;
        background: rgba(180, 35, 24, 0.92);
        color: #fff;
        cursor: pointer;
        font-size: 11px;
        font-weight: 950;
    }

    .manage-field {
        display: grid;
        gap: 7px;
    }

    .manage-field.wide {
        grid-column: 1 / -1;
    }

    .manage-field small {
        color: var(--danger);
    }

    .custom-dropdown {
        position: relative;
    }

    .dropdown-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        text-align: left;
    }

    .dropdown-trigger .placeholder {
        color: #9b9283;
    }

    .dropdown-trigger i {
        width: 9px;
        height: 9px;
        border-right: 2px solid var(--green);
        border-bottom: 2px solid var(--green);
        transform: rotate(45deg) translateY(-2px);
    }

    .custom-dropdown .dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        z-index: 10;
        overflow: hidden;
        border: 1px solid rgba(31, 63, 47, 0.12);
        border-radius: 18px;
        background: #fff;
        box-shadow: var(--shadow-md);
        padding: 6px;
    }

    .custom-dropdown .dropdown-item {
        display: block;
        width: 100%;
        border: 0;
        border-radius: 13px;
        background: transparent;
        color: var(--text);
        cursor: pointer;
        font-size: 13px;
        font-weight: 800;
        padding: 10px 12px;
        text-align: left;
    }

    .custom-dropdown .dropdown-item:hover,
    .custom-dropdown .dropdown-item.selected {
        background: var(--gold-soft);
        color: var(--green);
    }

    /* =========================
       REVIEW PHOTO UPLOAD
    ========================= */

    .upload-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .btn-upload-small {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 34px;
        border-radius: 999px;
        background: var(--gold-soft);
        color: #8a5a00;
        cursor: pointer;
        font-size: 12px;
        font-weight: 950;
        padding: 8px 12px;
    }

    .btn-upload-small.disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    .btn-upload-small svg {
        width: 15px;
        height: 15px;
    }

    .upload-preview-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 10px;
    }

    .preview-card {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        background: #eee7da;
        aspect-ratio: 1;
    }

    .preview-card img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .preview-card button {
        position: absolute;
        top: 7px;
        right: 7px;
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border: 0;
        border-radius: 50%;
        background: rgba(180, 35, 24, 0.92);
        color: #fff;
        cursor: pointer;
    }

    .preview-card button svg {
        width: 14px;
        height: 14px;
    }

    /* =========================
       LIGHTBOX
    ========================= */

    .lightbox-overlay {
        position: fixed;
        inset: 0;
        z-index: 3000;
        display: grid;
        place-items: center;
        background: rgba(13, 17, 14, 0.78);
        padding: 22px;
    }

    .lightbox-panel {
        width: min(980px, 100%);
        max-height: calc(100vh - 44px);
        display: grid;
        gap: 14px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 28px;
        background: #fff;
        box-shadow: var(--shadow-lg);
        padding: 16px;
        animation: modalPop 0.22s ease both;
    }

    .lightbox-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .lightbox-header span,
    .lightbox-header strong {
        display: block;
    }

    .lightbox-header span {
        color: #8a5a00;
        font-size: 11.5px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .lightbox-header strong {
        margin-top: 4px;
        color: var(--text);
        font-size: 18px;
        font-weight: 950;
    }

    .lightbox-header button {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: #f2eee5;
        color: var(--text);
        cursor: pointer;
    }

    .lightbox-hero {
        position: relative;
        overflow: hidden;
        height: min(62vh, 560px);
        margin: 0;
        border-radius: 22px;
        background: #eee7da;
    }

    .lightbox-hero > img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        background: #181714;
    }

    .lightbox-nav {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        pointer-events: none;
        padding: 0 12px;
    }

    .lightbox-nav button {
        pointer-events: auto;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        color: var(--green);
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
    }

    .lightbox-nav svg {
        width: 20px;
        height: 20px;
    }

    .lightbox-hero figcaption {
        position: absolute;
        left: 14px;
        bottom: 14px;
        border-radius: 999px;
        background: rgba(24, 23, 20, 0.7);
        color: #fff;
        font-size: 12px;
        font-weight: 900;
        padding: 8px 12px;
    }

    .lightbox-thumbs {
        display: flex;
        gap: 9px;
        overflow-x: auto;
        padding-bottom: 2px;
        scrollbar-width: none;
    }

    .lightbox-thumbs::-webkit-scrollbar {
        display: none;
    }

    .lightbox-thumbs button {
        flex: 0 0 76px;
        width: 76px;
        height: 62px;
        overflow: hidden;
        border: 2px solid transparent;
        border-radius: 14px;
        background: #eee7da;
        cursor: pointer;
        padding: 0;
    }

    .lightbox-thumbs button.active {
        border-color: var(--gold);
    }

    .lightbox-thumbs img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    /* =========================
       RESPONSIVE
    ========================= */

    @media (max-width: 980px) {
        .hero-gallery {
            grid-template-columns: 1fr;
            height: auto;
        }

        .main-img {
            height: clamp(280px, 48vw, 420px);
        }

        .side-imgs {
            height: 180px;
        }

        .split-layout-50-50 {
            grid-template-columns: 1fr;
        }

        .action-bar-unified {
            position: static;
        }
    }

    @media (max-width: 720px) {
        .detail-container {
            width: min(100% - 28px, 1160px);
        }

        .inline-navbar {
            min-height: auto;
            padding-block: 14px;
        }

        .hero-title-area h1 {
            font-size: clamp(32px, 11vw, 46px);
        }

        .hero-meta {
            gap: 8px;
        }

        .hero-meta span {
            min-height: 34px;
            font-size: 12px;
        }

        .side-imgs {
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: 1fr;
            height: 92px;
            gap: 8px;
        }

        .hero-gallery {
            border-radius: 26px;
        }

        .action-bar-unified {
            align-items: stretch;
        }

        .action-bar-unified button,
        .action-bar-unified a {
            flex: 1 1 auto;
        }

        .divider {
            display: none;
        }

        .reviews-head {
            align-items: flex-start;
            flex-direction: column;
        }

        .review-item {
            grid-template-columns: 40px minmax(0, 1fr);
            gap: 10px;
        }

        .detail-avatar {
            width: 40px;
            height: 40px;
        }

        .review-head {
            flex-direction: column;
        }

        .review-photos-grid,
        .upload-preview-grid,
        .edit-gallery-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .edit-form-grid {
            grid-template-columns: 1fr;
        }

        .modal-backdrop,
        .lightbox-overlay {
            padding: 12px;
        }

        .modal-content,
        .lightbox-panel {
            border-radius: 24px;
        }

        .toast-notice {
            left: 14px;
            right: 14px;
            max-width: none;
        }
    }

    @media (max-width: 480px) {
        .detail-container {
            width: min(100% - 22px, 1160px);
        }

        .btn-nav-back {
            padding-inline: 12px;
        }

        .nav-logo {
            font-size: 20px;
        }

        .main-img {
            height: 300px;
        }

        .side-imgs {
            height: 76px;
        }

        .action-bar-unified button,
        .action-bar-unified a {
            width: 100%;
            flex: 1 1 100%;
        }

        .info-box,
        .reviews-section-wide {
            border-radius: 24px;
            padding: 18px;
        }

        .map-frame {
            height: 230px;
        }

        .review-bubble {
            padding: 14px;
        }

        .modal-footer,
        .modal-footer-center {
            flex-direction: column;
        }

        .btn-modal-cancel,
        .btn-modal-save,
        .btn-modal-danger {
            width: 100%;
        }

        .lightbox-hero {
            height: 54vh;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }
    }
`;

export default UMKMDetail;