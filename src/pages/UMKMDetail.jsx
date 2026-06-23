import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Bookmark,
    Camera,
    ChevronLeft,
    ChevronRight,
    Clock,
    Cookie,
    CupSoda,
    DollarSign,
    Image as ImageIcon,
    Info,
    ImagePlus,
    MapPin,
    MessageCircle,
    Navigation,
    PencilLine,
    Save,
    Send,
    Star,
    Trash2,
    Utensils,
    X,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import { getUploadUrl } from '../config/api';
import { optimizeImageFile, optimizeImageFiles } from '../utils/imageUpload';
import './UMKMDetail.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1200&auto=format&fit=crop';

const defaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const resolveImageUrl = (image) => {
    if (!image) return '';
    return getUploadUrl(image);
};

const normalizeImageList = (images) => {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (!images) return [];

    try {
        const parsedImages = JSON.parse(images);
        return Array.isArray(parsedImages) ? parsedImages.filter(Boolean) : [];
    } catch {
        return [];
    }
};

const mergeUpdatedUmkm = (current, updated) => {
    if (!updated) return current;

    return {
        ...(current || {}),
        ...updated,
        reviews: Array.isArray(updated.reviews) ? updated.reviews : (current?.reviews || []),
    };
};

const getReviews = (item) => item?.reviews || [];

const getAverageRating = (reviews) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
};

const formatRating = (value) => Number(value || 0).toFixed(1);

const getInitial = (name) => (
    String(name || 'A').trim().charAt(0).toUpperCase() || 'A'
);

const getReviewName = (review) => (
    review?.User?.username
    || review?.User?.nama
    || review?.nama_user
    || review?.username
    || 'Anonim'
);

const getReviewUserId = (review) => (
    review?.userId
    || review?.User?.id
    || review?.UserId
    || null
);

const isAuthSessionError = (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || '').toLowerCase();

    return status === 401
        || (status === 400 && message.includes('token'))
        || message.includes('sesi login')
        || message.includes('login ulang');
};

const getFoodCategoryType = (value) => {
    const category = String(value || '').toLowerCase();

    if (
        category.includes('drink')
        || category.includes('minum')
        || category.includes('kopi')
        || category.includes('teh')
        || category.includes('jus')
    ) {
        return 'drink';
    }

    if (
        category.includes('snack')
        || category.includes('dessert')
        || category.includes('desert')
        || category.includes('camil')
        || category.includes('jajan')
        || category.includes('kue')
    ) {
        return 'dessert';
    }

    return 'meal';
};

const renderFoodCategoryIcon = (type) => {
    if (type === 'drink') return <CupSoda aria-hidden="true" />;
    if (type === 'dessert') return <Cookie aria-hidden="true" />;
    return <Utensils aria-hidden="true" />;
};

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Baru saja';

    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getCachedUser = () => {
    try {
        const cacheKey = localStorage.getItem('adminToken') ? 'adminUser' : 'user';
        return JSON.parse(localStorage.getItem(cacheKey) || 'null');
    } catch {
        return null;
    }
};

const revokePhotoPreviews = (photos = []) => {
    photos.forEach((photo) => {
        if (photo?.preview) URL.revokeObjectURL(photo.preview);
    });
};

const defaultEditForm = {
    nama_umkm: '',
    jenis_makanan: '',
    harga_range: '',
    jam_operasional: '',
    deskripsi: '',
    alamat_teks: '',
};

const FOOD_TYPE_OPTIONS = [
    'Makanan berat',
    'Snacks & Dessert',
    'Drinks',
];

const PRICE_OPTIONS = [
    'Rp5.000 - Rp10.000',
    'Rp10.000 - Rp20.000',
    'Rp20.000 - Rp35.000',
    'Rp35.000+',
];

const OPERATING_HOUR_OPTIONS = [
    '07.00 - 15.00',
    '08.00 - 17.00',
    '09.00 - 21.00',
    '10.00 - 22.00',
    '24 jam',
];
const MAX_DETAIL_PHOTOS = 7;
const MAX_REVIEW_PHOTOS = 4;
const REVIEW_PREVIEW_LENGTH = 180;

const RatingStars = ({ value = 0, interactive = false, onChange }) => {
    const activeValue = Math.round(Number(value) || 0);

    return (
        <div className={interactive ? 'detail-stars is-interactive' : 'detail-stars'} aria-label={`Rating ${activeValue} dari 5`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= activeValue;

                if (interactive) {
                    return (
                        <button
                            key={star}
                            className={isActive ? 'detail-star is-active' : 'detail-star'}
                            type="button"
                            aria-label={`Pilih rating ${star}`}
                            onClick={() => onChange(star)}
                        >
                            <Star aria-hidden="true" />
                        </button>
                    );
                }

                return (
                    <Star
                        key={star}
                        className={isActive ? 'detail-star is-active' : 'detail-star'}
                        aria-hidden="true"
                    />
                );
            })}
        </div>
    );
};

const Avatar = ({ name }) => (
    <span className="detail-avatar" aria-hidden="true">
        {getInitial(name)}
    </span>
);

const ReviewBubble = ({
    review,
    canManage = false,
    isDeleting = false,
    isUpdating = false,
    onDelete,
    onEdit,
    onOpenPhotos,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const reviewName = getReviewName(review);
    const comment = String(review.komentar || '').trim();
    const isLong = comment.length > REVIEW_PREVIEW_LENGTH;
    const reviewPhotos = normalizeImageList(review.images).map(resolveImageUrl).filter(Boolean);

    return (
        <article className="detail-review-item" key={review.id || `${reviewName}-${review.createdAt}`}>
            <Avatar name={reviewName} />
            <div className="detail-review-bubble">
                <div className="detail-review-head">
                    <div>
                        <strong>{reviewName}</strong>
                        <span>{formatDate(review.createdAt || review.waktu)}</span>
                    </div>
                    {canManage && (
                        <div className="detail-review-actions">
                            <button className="detail-review-edit-button" type="button" disabled={isUpdating} onClick={onEdit}>
                                <PencilLine aria-hidden="true" />
                                <span>{isUpdating ? 'Menyimpan...' : 'Edit'}</span>
                            </button>
                            <button className="detail-review-delete-button" type="button" disabled={isDeleting} onClick={onDelete}>
                                <Trash2 aria-hidden="true" />
                                <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                            </button>
                        </div>
                    )}
                </div>
                <RatingStars value={review.rating || 0} />
                <p className={isExpanded ? 'is-expanded' : undefined}>{comment}</p>
                {isLong && (
                    <button className="detail-review-more-text" type="button" onClick={() => setIsExpanded((value) => !value)}>
                        {isExpanded ? 'Tutup' : 'Lihat selengkapnya'}
                    </button>
                )}

                {reviewPhotos.length > 0 && (
                    <div className="detail-review-photos" aria-label="Foto review">
                        {reviewPhotos.map((photo, index) => (
                            <button
                                type="button"
                                key={`${photo}-${index}`}
                                onClick={() => onOpenPhotos(reviewPhotos, index)}
                            >
                                <img src={photo} alt={`Foto review ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
};

const DetailPhotoGallery = ({ photos, title, onOpen }) => {
    if (!photos.length) {
        return (
            <section className="detail-photo-panel detail-photo-empty" aria-label="Detail foto UMKM">
                <ImageIcon aria-hidden="true" />
                <div>
                    <span>Detail foto UMKM</span>
                    <strong>Foto tambahan belum tersedia</strong>
                    <p>Menu, suasana, atau detail makanan akan tampil di area ini setelah ditambahkan.</p>
                </div>
            </section>
        );
    }

    const previewPhotos = photos.slice(0, 6);
    const hiddenCount = Math.max(photos.length - previewPhotos.length, 0);

    return (
        <section className="detail-photo-panel" aria-label="Detail foto UMKM">
            <div className="detail-section-head is-row">
                <div>
                    <span>Detail foto UMKM</span>
                    <h2>Menu dan suasana</h2>
                </div>
                <button className="detail-mini-button" type="button" onClick={() => onOpen(0)}>
                    <Camera aria-hidden="true" />
                    <span>Lihat semua</span>
                </button>
            </div>

            <div className="detail-photo-grid">
                {previewPhotos.map((photo, index) => {
                    const showMore = index === previewPhotos.length - 1 && hiddenCount > 0;

                    return (
                        <button className="detail-photo-item" type="button" key={photo} onClick={() => onOpen(index + 1)}>
                            <img src={photo} alt={`${title} ${index + 1}`} />
                            {showMore && <span>+{hiddenCount}</span>}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

const Lightbox = ({ photos, title, initialIndex = 0, onClose }) => {
    const safeInitialIndex = Math.min(Math.max(Number(initialIndex) || 0, 0), Math.max(photos.length - 1, 0));
    const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
    const activePhoto = photos[activeIndex] || photos[0];

    const handlePrevious = () => {
        setActiveIndex((current) => (current === 0 ? photos.length - 1 : current - 1));
    };

    const handleNext = () => {
        setActiveIndex((current) => (current === photos.length - 1 ? 0 : current + 1));
    };

    return (
        <div className="detail-lightbox" role="dialog" aria-modal="true" aria-label="Semua foto UMKM" onClick={onClose}>
            <div className="detail-lightbox-panel" onClick={(event) => event.stopPropagation()}>
                <div className="detail-lightbox-head">
                    <div>
                        <span>Galeri UMKM</span>
                        <strong>{title}</strong>
                    </div>
                    <button type="button" aria-label="Tutup galeri" onClick={onClose}>
                        <X aria-hidden="true" />
                    </button>
                </div>

                <figure className="detail-lightbox-feature">
                    <img src={activePhoto} alt={`${title} foto ${activeIndex + 1}`} />
                    {photos.length > 1 && (
                        <div className="detail-lightbox-nav" aria-label="Navigasi foto galeri">
                            <button type="button" aria-label="Foto sebelumnya" onClick={handlePrevious}>
                                <ChevronLeft aria-hidden="true" />
                            </button>
                            <button type="button" aria-label="Foto berikutnya" onClick={handleNext}>
                                <ChevronRight aria-hidden="true" />
                            </button>
                        </div>
                    )}
                    <figcaption>
                        <span>Foto {activeIndex + 1}</span>
                        <strong>{photos.length} foto tersedia</strong>
                    </figcaption>
                </figure>

                {photos.length > 1 && (
                    <div className="detail-lightbox-thumbs" aria-label="Pilih foto galeri">
                        {photos.map((photo, index) => (
                            <button
                                className={index === activeIndex ? 'detail-lightbox-thumb is-active' : 'detail-lightbox-thumb'}
                                type="button"
                                key={`${photo}-${index}`}
                                aria-label={`Lihat foto ${index + 1}`}
                                onClick={() => setActiveIndex(index)}
                            >
                                <img src={photo} alt={`${title} thumbnail ${index + 1}`} />
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
        <AppNavbar active="feed" isLoggedIn={Boolean(localStorage.getItem('token'))} />
        <div className="detail-state-card">
            <Info aria-hidden="true" />
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    </main>
);

const DetailCategoryDropdown = ({ value, options, placeholder, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className={isOpen ? 'detail-category-dropdown is-open' : 'detail-category-dropdown'} ref={dropdownRef}>
            <button
                className="detail-category-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
            >
                <span className={value ? '' : 'is-placeholder'}>{value || placeholder}</span>
                <i aria-hidden="true" />
            </button>

            {isOpen && (
                <div className="detail-category-menu" role="listbox">
                    {options.map((option) => (
                        <button
                            className={value === option ? 'detail-category-option is-selected' : 'detail-category-option'}
                            type="button"
                            role="option"
                            aria-selected={value === option}
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

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
    const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);
    const editNewDetailPhotosRef = useRef([]);
    const reviewPhotosRef = useRef([]);
    const editReviewPhotosRef = useRef([]);

    const isLoggedIn = Boolean(
        localStorage.getItem('token') || localStorage.getItem('adminToken'),
    );

    const fetchDetail = useCallback(async ({ keepPrevious = false } = {}) => {
        try {
            const response = await apiClient.get(`/umkm/${id}`);
            setUmkm(response.data);
            return response.data;
        } catch (error) {
            console.error('Gagal mengambil detail UMKM', error);
            if (!keepPrevious) setUmkm(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        let ignore = false;

        apiClient.get(`/umkm/${id}`)
            .then((response) => {
                if (!ignore) setUmkm(response.data);
            })
            .catch((error) => {
                console.error('Gagal mengambil detail UMKM', error);
                if (!ignore) setUmkm(null);
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [id]);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        let ignore = false;

        apiClient.get('/auth/profile')
            .then(({ data }) => {
                if (!ignore) {
                    setCurrentUser(data.user);
                    const cacheKey = localStorage.getItem('adminToken') ? 'adminUser' : 'user';
                    localStorage.setItem(cacheKey, JSON.stringify(data.user));
                }
            })
            .catch(() => {
                // Data lokal tetap cukup untuk menentukan pemilik saat backend profile belum aktif.
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

        const loadSavedUmkm = async () => {
            try {
                const { data } = await apiClient.get('/umkm/saved');
                if (!ignore) {
                    setSavedUmkmIds(Array.isArray(data) ? data.map((item) => String(item.id)) : []);
                }
            } catch {
                if (!ignore) setSavedUmkmIds([]);
            }
        };

        loadSavedUmkm();
        window.addEventListener('saved-umkm-updated', loadSavedUmkm);

        return () => {
            ignore = true;
            window.removeEventListener('saved-umkm-updated', loadSavedUmkm);
        };
    }, [isLoggedIn]);

    useEffect(() => (
        () => {
            if (editPreview) URL.revokeObjectURL(editPreview);
        }
    ), [editPreview]);

    useEffect(() => {
        editNewDetailPhotosRef.current = editNewDetailPhotos;
    }, [editNewDetailPhotos]);

    useEffect(() => {
        reviewPhotosRef.current = reviewPhotos;
    }, [reviewPhotos]);

    useEffect(() => {
        editReviewPhotosRef.current = editReviewPhotos;
    }, [editReviewPhotos]);

    useEffect(() => (
        () => {
            revokePhotoPreviews(editNewDetailPhotosRef.current);
            revokePhotoPreviews(reviewPhotosRef.current);
            revokePhotoPreviews(editReviewPhotosRef.current);
        }
    ), []);

    useEffect(() => {
        if (!pageNotice) return undefined;

        const timeout = window.setTimeout(() => {
            setPageNotice(null);
        }, 4200);

        return () => window.clearTimeout(timeout);
    }, [pageNotice]);

    const allImages = useMemo(() => {
        if (!umkm) return [];
        const galleryImages = normalizeImageList(umkm.images);
        const rawImages = [umkm.image, ...galleryImages].filter(Boolean);
        return rawImages.map(resolveImageUrl).filter(Boolean);
    }, [umkm]);
    const rawDetailImages = useMemo(() => (
        normalizeImageList(umkm?.images)
    ), [umkm]);

    const reviews = useMemo(() => getReviews(umkm), [umkm]);
    const sortedReviews = useMemo(() => (
        [...reviews].sort((a, b) => {
            const timeA = new Date(a.createdAt || a.waktu || 0).getTime();
            const timeB = new Date(b.createdAt || b.waktu || 0).getTime();
            return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
        })
    ), [reviews]);
    const displayedReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 1);
    const averageRating = useMemo(() => getAverageRating(reviews), [reviews]);
    const ratingLabel = formatRating(averageRating);
    const totalReviews = reviews.length;

    const latitude = Number(umkm?.latitude);
    const longitude = Number(umkm?.longitude);
    const hasLocation = Number.isFinite(latitude)
        && Number.isFinite(longitude)
        && !(latitude === 0 && longitude === 0);
    const mapPosition = hasLocation ? [latitude, longitude] : null;
    const category = umkm?.jenis_makanan || 'Kuliner';
    const categoryType = getFoodCategoryType(category);
    const price = umkm?.harga_range || 'Harga belum diatur';
    const operationalHours = umkm?.jam_operasional || 'Jam operasional belum diatur';
    const description = umkm?.deskripsi || 'Deskripsi UMKM belum tersedia. Kamu tetap bisa melihat lokasi, harga, dan review yang sudah masuk.';
    const isDescriptionLong = description.trim().length > 170;
    const isDescriptionExpanded = expandedDescriptionId === String(id);
    const address = umkm?.alamat_teks || 'Alamat belum ditambahkan';
    const primaryImage = allImages[0] || FALLBACK_IMAGE;
    const detailImages = allImages.slice(1);
    const canManageUmkm = isLoggedIn && currentUser?.role === 'admin';
    const isSaved = isLoggedIn && savedUmkmIds.includes(String(id));
    const editDetailPhotoCount = editDetailImages.length + editNewDetailPhotos.length;
    const isEditDetailGalleryFull = editDetailPhotoCount >= MAX_DETAIL_PHOTOS;
    const editReviewPhotoCount = editReviewExistingImages.length + editReviewPhotos.length;
    const mapUrl = hasLocation
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : '';

    const handleInvalidSession = () => {
        const wasAdminSession = Boolean(localStorage.getItem('adminToken'));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setCurrentUser(null);
        setSavedUmkmIds([]);
        window.dispatchEvent(new Event('profile-updated'));
        window.dispatchEvent(new Event('saved-umkm-updated'));
        setPageNotice({
            type: 'warning',
            message: 'Sesi login kamu sudah tidak valid. Silakan login ulang agar bisa menyimpan UMKM atau mengelola review.',
            actionLabel: 'Login ulang',
            actionTarget: wasAdminSession ? '/admin' : '/login',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenReview = () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        setModalNotice(null);
        setIsReviewModalOpen(true);
    };

    const handleCloseReview = () => {
        setIsReviewModalOpen(false);
        setModalNotice(null);
        revokePhotoPreviews(reviewPhotos);
        setReviewPhotos([]);
    };

    const handleOpenEditReview = (review) => {
        setReviewToEdit(review);
        setEditReviewRating(Number(review.rating || 0));
        setEditReviewComment(String(review.komentar || ''));
        setEditReviewExistingImages(normalizeImageList(review.images));
        revokePhotoPreviews(editReviewPhotos);
        setEditReviewPhotos([]);
        setModalNotice(null);
    };

    const handleCloseEditReview = () => {
        setReviewToEdit(null);
        setEditReviewRating(0);
        setEditReviewComment('');
        setEditReviewExistingImages([]);
        setModalNotice(null);
        revokePhotoPreviews(editReviewPhotos);
        setEditReviewPhotos([]);
    };

    const handleOpenLightbox = (startIndex = 0) => {
        setLightboxStartIndex(startIndex);
        setShowAllPhotos(true);
    };

    const handleOpenReviewPhotos = (photos, startIndex = 0) => {
        setReviewLightboxPhotos(photos);
        setReviewLightboxStartIndex(startIndex);
    };

    const handleReviewPhotoChange = async (event) => {
        const selectedFiles = Array.from(event.target.files || [])
            .filter((file) => file.type.startsWith('image/'));

        if (selectedFiles.length === 0) {
            event.target.value = '';
            return;
        }

        const remainingSlots = Math.max(MAX_REVIEW_PHOTOS - reviewPhotos.length, 0);
        if (remainingSlots === 0) {
            setModalNotice({ type: 'error', message: `Foto review maksimal ${MAX_REVIEW_PHOTOS} gambar.` });
            event.target.value = '';
            return;
        }

        const acceptedFiles = await optimizeImageFiles(selectedFiles.slice(0, remainingSlots), { maxBytes: 320 * 1024 });
        const nextPhotos = acceptedFiles.map((file) => ({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
        }));

        setReviewPhotos((current) => [...current, ...nextPhotos]);
        if (selectedFiles.length > remainingSlots) {
            setModalNotice({ type: 'error', message: `Hanya ${remainingSlots} foto lagi yang bisa ditambahkan.` });
        } else {
            setModalNotice(null);
        }
        event.target.value = '';
    };

    const handleRemoveReviewPhoto = (photoId) => {
        setReviewPhotos((current) => {
            const targetPhoto = current.find((photo) => photo.id === photoId);
            if (targetPhoto?.preview) URL.revokeObjectURL(targetPhoto.preview);
            return current.filter((photo) => photo.id !== photoId);
        });
    };

    const handleEditReviewPhotoChange = async (event) => {
        const selectedFiles = Array.from(event.target.files || [])
            .filter((file) => file.type.startsWith('image/'));

        if (selectedFiles.length === 0) {
            event.target.value = '';
            return;
        }

        const remainingSlots = Math.max(MAX_REVIEW_PHOTOS - editReviewPhotoCount, 0);
        if (remainingSlots === 0) {
            setModalNotice({ type: 'error', message: `Foto review maksimal ${MAX_REVIEW_PHOTOS} gambar.` });
            event.target.value = '';
            return;
        }

        const acceptedFiles = await optimizeImageFiles(selectedFiles.slice(0, remainingSlots), { maxBytes: 320 * 1024 });
        const nextPhotos = acceptedFiles.map((file) => ({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
        }));

        setEditReviewPhotos((current) => [...current, ...nextPhotos]);
        if (selectedFiles.length > remainingSlots) {
            setModalNotice({ type: 'error', message: `Hanya ${remainingSlots} foto lagi yang bisa ditambahkan.` });
        } else {
            setModalNotice(null);
        }
        event.target.value = '';
    };

    const handleRemoveEditReviewPhoto = (photoId) => {
        setEditReviewPhotos((current) => {
            const targetPhoto = current.find((photo) => photo.id === photoId);
            if (targetPhoto?.preview) URL.revokeObjectURL(targetPhoto.preview);
            return current.filter((photo) => photo.id !== photoId);
        });
    };

    const handleRemoveExistingReviewImage = (imageToRemove) => {
        setEditReviewExistingImages((current) => current.filter((image) => image !== imageToRemove));
        setModalNotice(null);
    };

    const handleSubmitReview = async (event) => {
        event.preventDefault();

        if (rating === 0) {
            setModalNotice({ type: 'error', message: 'Pilih rating bintang terlebih dahulu.' });
            return;
        }

        setIsSubmitting(true);
        setModalNotice(null);

        try {
            const payload = new FormData();
            payload.append('rating', rating);
            payload.append('komentar', komentar.trim());
            reviewPhotos.forEach((photo) => {
                payload.append('review_images', photo.file);
            });

            await apiClient.post(`/umkm/${id}/reviews`, payload);
            handleCloseReview();
            setRating(0);
            setKomentar('');
            setPageNotice({ type: 'success', message: 'Review berhasil ditambahkan.' });
            setShowAllReviews(false);
            window.dispatchEvent(new Event('activity-updated'));
            await fetchDetail();
        } catch (error) {
            if (isAuthSessionError(error)) {
                handleCloseReview();
                handleInvalidSession();
                return;
            }

            setModalNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal mengirim review. Pastikan akun sudah login.',
            });
        } finally {
            setIsSavingUmkm(false);
        }
    };

    const handleConfirmDeleteReview = async () => {
        if (!reviewToDelete?.id || isDeletingReview) return;

        setIsDeletingReview(true);

        try {
            const { data } = await apiClient.delete(`/umkm/${id}/reviews/${reviewToDelete.id}`);
            setUmkm((current) => ({
                ...(current || {}),
                reviews: getReviews(current).filter((review) => Number(review.id) !== Number(reviewToDelete.id)),
            }));
            setReviewToDelete(null);
            setPageNotice({ type: 'success', message: data.message || 'Review berhasil dihapus.' });
            setShowAllReviews(false);
            window.dispatchEvent(new Event('activity-updated'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            void fetchDetail({ keepPrevious: true });
        } catch (error) {
            if (isAuthSessionError(error)) {
                setReviewToDelete(null);
                handleInvalidSession();
                return;
            }

            setPageNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal menghapus review.',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsDeletingReview(false);
        }
    };

    const handleSubmitEditReview = async (event) => {
        event.preventDefault();

        if (!reviewToEdit?.id || isUpdatingReview) return;

        if (editReviewRating === 0) {
            setModalNotice({ type: 'error', message: 'Pilih rating bintang terlebih dahulu.' });
            return;
        }

        if (!editReviewComment.trim()) {
            setModalNotice({ type: 'error', message: 'Komentar review wajib diisi.' });
            return;
        }

        setIsUpdatingReview(true);
        setModalNotice(null);

        try {
            const payload = new FormData();
            payload.append('rating', editReviewRating);
            payload.append('komentar', editReviewComment.trim());
            payload.append('existing_review_images', JSON.stringify(editReviewExistingImages));
            editReviewPhotos.forEach((photo) => {
                payload.append('review_images', photo.file);
            });

            const { data } = await apiClient.put(`/umkm/${id}/reviews/${reviewToEdit.id}`, payload);
            handleCloseEditReview();
            setPageNotice({ type: 'success', message: data.message || 'Review berhasil diperbarui.' });
            window.dispatchEvent(new Event('activity-updated'));
            await fetchDetail({ keepPrevious: true });
        } catch (error) {
            if (isAuthSessionError(error)) {
                handleCloseEditReview();
                handleInvalidSession();
                return;
            }

            setModalNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal memperbarui review.',
            });
        } finally {
            setIsUpdatingReview(false);
        }
    };

    const handleOpenEdit = () => {
        if (!canManageUmkm) {
            setPageNotice({ type: 'error', message: 'Hanya admin yang dapat mengedit UMKM.' });
            return;
        }

        setManageNotice(null);
        setEditImage(null);
        if (editPreview) URL.revokeObjectURL(editPreview);
        setEditPreview(null);
        revokePhotoPreviews(editNewDetailPhotos);
        setEditNewDetailPhotos([]);
        setEditDetailImages(rawDetailImages);
        setEditForm({
            nama_umkm: umkm.nama_umkm || '',
            jenis_makanan: umkm.jenis_makanan || '',
            harga_range: umkm.harga_range || '',
            jam_operasional: umkm.jam_operasional || '',
            deskripsi: umkm.deskripsi || '',
            alamat_teks: umkm.alamat_teks || '',
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setManageNotice(null);
        setEditImage(null);
        if (editPreview) URL.revokeObjectURL(editPreview);
        setEditPreview(null);
        revokePhotoPreviews(editNewDetailPhotos);
        setEditNewDetailPhotos([]);
    };

    const handleEditChange = (field) => (event) => {
        setEditForm((current) => ({ ...current, [field]: event.target.value }));
    };

    const handleEditImageChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const optimizedFile = await optimizeImageFile(file, { maxBytes: 420 * 1024 });
            if (editPreview) URL.revokeObjectURL(editPreview);
            setEditImage(optimizedFile);
            setEditPreview(URL.createObjectURL(optimizedFile));
        } catch {
            setManageNotice({ type: 'error', message: 'Foto utama tidak dapat diproses.' });
        }
    };

    const handleEditDetailPhotoChange = async (event) => {
        const selectedFiles = Array.from(event.target.files || [])
            .filter((file) => file.type.startsWith('image/'));

        if (selectedFiles.length === 0) {
            event.target.value = '';
            return;
        }

        const remainingSlots = Math.max(MAX_DETAIL_PHOTOS - editDetailPhotoCount, 0);
        if (remainingSlots === 0) {
            setManageNotice({ type: 'error', message: 'Foto detail maksimal 7 gambar.' });
            event.target.value = '';
            return;
        }

        const optimizedFiles = await optimizeImageFiles(selectedFiles.slice(0, remainingSlots), { maxBytes: 320 * 1024 });
        const nextPhotos = optimizedFiles.map((file, index) => ({
            id: `${Date.now()}-${index}-${file.name}`,
            file,
            preview: URL.createObjectURL(file),
        }));

        setEditNewDetailPhotos((current) => [...current, ...nextPhotos]);
        if (selectedFiles.length > remainingSlots) {
            setManageNotice({ type: 'error', message: `Hanya ${remainingSlots} foto yang ditambahkan karena batas maksimal 7 gambar.` });
        } else {
            setManageNotice(null);
        }
        event.target.value = '';
    };

    const handleRemoveExistingDetailImage = (image) => {
        setEditDetailImages((current) => current.filter((item) => item !== image));
    };

    const handleRemoveNewDetailPhoto = (id) => {
        setEditNewDetailPhotos((current) => {
            const targetPhoto = current.find((photo) => photo.id === id);
            if (targetPhoto?.preview) URL.revokeObjectURL(targetPhoto.preview);
            return current.filter((photo) => photo.id !== id);
        });
    };

    const handleUpdateUmkm = async (event) => {
        event.preventDefault();

        if (!canManageUmkm) {
            setManageNotice({ type: 'error', message: 'Hanya admin yang dapat mengedit UMKM.' });
            return;
        }

        if (!editForm.nama_umkm.trim()) {
            setManageNotice({ type: 'error', message: 'Nama UMKM wajib diisi.' });
            return;
        }

        setIsUpdating(true);
        setManageNotice(null);

        const payload = new FormData();
        payload.append('nama_umkm', editForm.nama_umkm.trim());
        payload.append('jenis_makanan', editForm.jenis_makanan.trim());
        payload.append('harga_range', editForm.harga_range.trim());
        payload.append('jam_operasional', editForm.jam_operasional.trim());
        payload.append('deskripsi', editForm.deskripsi.trim());
        payload.append('alamat_teks', editForm.alamat_teks.trim());
        payload.append('latitude', umkm.latitude || 0);
        payload.append('longitude', umkm.longitude || 0);
        payload.append('existing_detail_images', JSON.stringify(editDetailImages));
        if (editImage) payload.append('image', editImage);
        editNewDetailPhotos.forEach((photo) => {
            if (photo?.file) payload.append('detail_images', photo.file);
        });

        try {
            const { data } = await apiClient.put(`/umkm/${id}`, payload);
            setUmkm((current) => mergeUpdatedUmkm(current, data.umkm));
            window.dispatchEvent(new Event('umkm-updated'));
            handleCloseEdit();
            setPageNotice({ type: 'success', message: data.message || 'Perubahan UMKM berhasil disimpan.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            void fetchDetail({ keepPrevious: true });
        } catch (error) {
            setManageNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal memperbarui UMKM.',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUmkm = async () => {
        if (!canManageUmkm) {
            setPageNotice({ type: 'error', message: 'Hanya admin yang dapat menghapus UMKM.' });
            setIsDeleteModalOpen(false);
            return;
        }

        setIsDeleting(true);
        setManageNotice(null);

        try {
            await apiClient.delete(`/umkm/${id}`);
            window.dispatchEvent(new Event('umkm-updated'));
            navigate('/#feed');
        } catch (error) {
            setManageNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal menghapus UMKM.',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleSaved = async () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (isSavingUmkm) return;

        const currentId = String(id);
        setIsSavingUmkm(true);

        try {
            if (isSaved) {
                await apiClient.delete(`/umkm/${id}/save`);
                setSavedUmkmIds((current) => current.filter((savedId) => savedId !== currentId));
                setPageNotice({ type: 'success', message: 'UMKM dihapus dari daftar simpanan.' });
            } else {
                await apiClient.post(`/umkm/${id}/save`);
                setSavedUmkmIds((current) => [...new Set([...current, currentId])]);

                const shouldShowHint = localStorage.getItem('savedUmkmHintSeen') !== '1';
                if (shouldShowHint) localStorage.setItem('savedUmkmHintSeen', '1');

                setPageNotice({
                    type: 'success',
                    message: shouldShowHint
                        ? 'UMKM disimpan. Tekan untuk melihat UMKM yang Anda simpan.'
                        : 'UMKM disimpan ke daftar simpanan.',
                    actionLabel: 'Lihat simpanan',
                    actionTarget: '/tersimpan',
                });
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.dispatchEvent(new Event('saved-umkm-updated'));
        } catch (error) {
            if (isAuthSessionError(error)) {
                handleInvalidSession();
                return;
            }

            setPageNotice({
                type: 'error',
                message: error.response?.data?.message || 'Gagal memperbarui simpanan. Coba lagi beberapa saat.',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSavingUmkm(false);
        }
    };

    if (loading) {
        return <DetailState title="Memuat detail UMKM" description="Sebentar, data sedang disiapkan." />;
    }

    if (!umkm) {
        return <DetailState title="UMKM tidak ditemukan" description="Data UMKM ini belum tersedia atau sudah dipindahkan." />;
    }

    return (
        <main className="detail-page">
            <AppNavbar
                active="feed"
                isLoggedIn={isLoggedIn}
                showWorkspaceLinks={isLoggedIn}
            />

            <div className="detail-shell">
                {pageNotice && (
                    <div className={`detail-notice detail-page-notice is-${pageNotice.type}`} role="status">
                        <span>{pageNotice.message}</span>
                        {pageNotice.actionLabel && (
                            <button type="button" onClick={() => navigate(pageNotice.actionTarget)}>
                                {pageNotice.actionLabel}
                            </button>
                        )}
                    </div>
                )}

                <section className={canManageUmkm ? 'detail-hero is-owner' : 'detail-hero'}>
                    <div className="detail-hero-copy">
                        <span className="detail-overline">Detail rekomendasi UMKM</span>
                        <h1>{umkm.nama_umkm}</h1>
                        <div className={`${isDescriptionExpanded ? 'detail-hero-description is-expanded' : 'detail-hero-description'}${description.length <= 110 ? ' is-short' : ''}`}>
                            <p>{description}</p>
                            {isDescriptionLong && (
                                <button
                                    className="detail-description-toggle"
                                    type="button"
                                    onClick={() => setExpandedDescriptionId((current) => (current === String(id) ? null : String(id)))}
                                >
                                    {isDescriptionExpanded ? 'Tutup deskripsi' : 'Lihat selengkapnya'}
                                </button>
                            )}
                        </div>

                        <div className="detail-hero-actions">
                            <span className="detail-kicker">
                                {renderFoodCategoryIcon(categoryType)}
                                <span>{category}</span>
                            </span>
                            <button className="detail-primary-button" type="button" onClick={handleOpenReview}>
                                <MessageCircle aria-hidden="true" />
                                <span>Tulis Review</span>
                            </button>
                            {hasLocation && (
                                <a
                                    className="detail-secondary-button"
                                    href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Navigation aria-hidden="true" />
                                    <span>Buka Map</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="detail-hero-media">
                        <section className="detail-cover-card" aria-label="Sampul UMKM">
                            <button className="detail-cover-image" type="button" onClick={() => handleOpenLightbox(0)}>
                                <img src={primaryImage} alt={umkm.nama_umkm} />
                                <span className="detail-gallery-chip">
                                    <Camera aria-hidden="true" />
                                    <span>Lihat foto</span>
                                </span>
                            </button>
                        </section>

                        <aside className="detail-score-panel" aria-label="Rating dan kelola UMKM">
                            <div className="detail-score-top">
                                <span>Rating</span>
                                <strong>{ratingLabel}</strong>
                                <RatingStars value={averageRating} />
                                <small>{totalReviews > 0 ? `${totalReviews} review pelanggan` : 'Belum ada review'}</small>
                            </div>

                            <div className="detail-score-facts">
                                <div>
                                    <MessageCircle aria-hidden="true" />
                                    <span>{totalReviews} review</span>
                                </div>
                                <div>
                                    <DollarSign aria-hidden="true" />
                                    <span>{price}</span>
                                </div>
                                <div>
                                    <Clock aria-hidden="true" />
                                    <span>{operationalHours}</span>
                                </div>
                            </div>

                            {canManageUmkm && (
                                <div className="detail-score-manage">
                                    <span>Kelola UMKM</span>
                                    <div>
                                        <button className="detail-owner-edit" type="button" onClick={handleOpenEdit}>
                                            <PencilLine aria-hidden="true" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            className="detail-owner-delete"
                                            type="button"
                                            onClick={() => {
                                                setManageNotice(null);
                                                setIsDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 aria-hidden="true" />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </aside>
                    </div>
                </section>

                <section className="detail-layout">
                    <div className="detail-main-column">
                        <section className="detail-panel detail-review-panel">
                            <div className="detail-section-head">
                                <span>Informasi utama</span>
                                <h2>Tentang UMKM</h2>
                            </div>

                            <div className="detail-info-grid">
                                <InfoItem iconNode={renderFoodCategoryIcon(categoryType)} label="Jenis" value={category} />
                                <InfoItem icon={DollarSign} label="Kisaran harga" value={price} />
                                <InfoItem icon={Clock} label="Jam operasional" value={operationalHours} />
                                <InfoItem icon={MapPin} label="Alamat" value={address} wide />
                            </div>
                        </section>

                        <section className="detail-panel detail-customer-review-panel">
                            <div className="detail-section-head is-row">
                                <div>
                                    <span>Review pelanggan</span>
                                    <h2>Apa kata mereka</h2>
                                </div>
                                <button className="detail-mini-button" type="button" onClick={handleOpenReview}>
                                    <MessageCircle aria-hidden="true" />
                                    <span>Tulis Review</span>
                                </button>
                            </div>

                            <div className="detail-review-list">
                                {displayedReviews.length > 0 ? displayedReviews.map((review) => (
                                    <ReviewBubble
                                        key={review.id || `${getReviewName(review)}-${review.createdAt}`}
                                        review={review}
                                        canManage={Boolean(
                                            review.id
                                            && currentUser?.id
                                            && Number(getReviewUserId(review)) === Number(currentUser.id)
                                        )}
                                        isDeleting={isDeletingReview && Number(reviewToDelete?.id) === Number(review.id)}
                                        isUpdating={isUpdatingReview && Number(reviewToEdit?.id) === Number(review.id)}
                                        onEdit={() => handleOpenEditReview(review)}
                                        onDelete={() => setReviewToDelete(review)}
                                        onOpenPhotos={handleOpenReviewPhotos}
                                    />
                                )) : (
                                    <div className="detail-empty-review">
                                        <MessageCircle aria-hidden="true" />
                                        <strong>Belum ada review</strong>
                                        <span>Jadilah orang pertama yang memberi ulasan untuk UMKM ini.</span>
                                    </div>
                                )}
                            </div>

                            {sortedReviews.length > 1 && (
                                <button className="detail-review-toggle" type="button" onClick={() => setShowAllReviews((value) => !value)}>
                                    {showAllReviews ? 'Tampilkan review terbaru saja' : `Lihat semua review (${sortedReviews.length})`}
                                </button>
                            )}
                        </section>
                    </div>

                    <aside className="detail-side-column">
                        <DetailPhotoGallery photos={detailImages} title={umkm.nama_umkm} onOpen={handleOpenLightbox} />

                        <section className="detail-quick-panel" aria-label="Aksi cepat detail UMKM">
                            <button
                                className={isSaved ? 'detail-save-button is-saved' : 'detail-save-button'}
                                type="button"
                                onClick={handleToggleSaved}
                                disabled={isSavingUmkm}
                            >
                                <Bookmark aria-hidden="true" />
                                <span>{isSavingUmkm ? 'Memproses...' : isSaved ? 'Tersimpan' : 'Simpan nanti'}</span>
                            </button>

                            {hasLocation ? (
                                <a className="detail-location-button" href={mapUrl} target="_blank" rel="noreferrer">
                                    <Navigation aria-hidden="true" />
                                    <span>Buka lokasi</span>
                                </a>
                            ) : (
                                <button className="detail-location-button" type="button" disabled>
                                    <MapPin aria-hidden="true" />
                                    <span>Lokasi belum ada</span>
                                </button>
                            )}
                        </section>

                        <section className="detail-panel detail-map-panel">
                            <div className="detail-section-head">
                                <span>Lokasi UMKM</span>
                                <h2>Peta lokasi</h2>
                            </div>

                            <div className="detail-map-box">
                                {hasLocation ? (
                                    <MapContainer center={mapPosition} zoom={16} zoomControl={false} scrollWheelZoom={false}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={mapPosition}>
                                            <Popup>{umkm.nama_umkm}</Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="detail-no-map">
                                        <MapPin aria-hidden="true" />
                                        <span>Koordinat lokasi belum tersedia</span>
                                    </div>
                                )}
                            </div>

                            <p className="detail-address">
                                <MapPin aria-hidden="true" />
                                <span>{address}</span>
                            </p>
                        </section>
                    </aside>
                </section>
            </div>

            {canManageUmkm && isEditModalOpen && (
                <div className="detail-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit UMKM" onClick={handleCloseEdit}>
                    <div className="detail-modal detail-manage-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-modal-head">
                            <div>
                                <span>Kelola UMKM</span>
                                <h2>Edit data {umkm.nama_umkm}</h2>
                            </div>
                            <button type="button" aria-label="Tutup modal" onClick={handleCloseEdit}>
                                <X aria-hidden="true" />
                            </button>
                        </div>

                        {manageNotice && (
                            <div className={`detail-notice is-${manageNotice.type}`}>
                                {manageNotice.message}
                            </div>
                        )}

                        <form className="detail-manage-form" onSubmit={handleUpdateUmkm}>
                            <label className="detail-edit-upload">
                                <span className="detail-edit-image">
                                    <img src={editPreview || primaryImage} alt="Preview UMKM" />
                                    <span>
                                        <ImagePlus aria-hidden="true" />
                                        <small>Ganti foto</small>
                                    </span>
                                </span>
                                <input type="file" accept="image/*" hidden onChange={handleEditImageChange} />
                            </label>

                            <section className="detail-edit-gallery-panel" aria-label="Kelola foto detail UMKM">
                                <div className="detail-edit-gallery-head">
                                    <div>
                                        <span>Foto detail UMKM</span>
                                        <strong>{editDetailPhotoCount}/{MAX_DETAIL_PHOTOS} foto</strong>
                                    </div>
                                    <label className={isEditDetailGalleryFull ? 'detail-edit-gallery-upload is-disabled' : 'detail-edit-gallery-upload'}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            hidden
                                            disabled={isEditDetailGalleryFull}
                                            onChange={handleEditDetailPhotoChange}
                                        />
                                        <ImagePlus aria-hidden="true" />
                                        <span>{isEditDetailGalleryFull ? 'Penuh' : 'Tambah foto'}</span>
                                    </label>
                                </div>

                                <div className={editDetailPhotoCount > 0 ? 'detail-edit-gallery-grid' : 'detail-edit-gallery-grid is-empty'}>
                                    {editDetailImages.map((image, index) => (
                                        <figure className="detail-edit-gallery-card" key={image}>
                                            <img src={resolveImageUrl(image)} alt={`Foto detail tersimpan ${index + 1}`} />
                                            <figcaption>
                                                <span>Foto {index + 1}</span>
                                                <button type="button" onClick={() => handleRemoveExistingDetailImage(image)}>
                                                    Hapus
                                                </button>
                                            </figcaption>
                                        </figure>
                                    ))}

                                    {editNewDetailPhotos.map((photo, index) => (
                                        <figure className="detail-edit-gallery-card is-new" key={photo.id}>
                                            <img src={photo.preview} alt={`Foto detail baru ${index + 1}`} />
                                            <figcaption>
                                                <span>Baru {index + 1}</span>
                                                <button type="button" onClick={() => handleRemoveNewDetailPhoto(photo.id)}>
                                                    Hapus
                                                </button>
                                            </figcaption>
                                        </figure>
                                    ))}

                                    {editDetailPhotoCount === 0 && (
                                        <div className="detail-edit-gallery-empty">
                                            <ImageIcon aria-hidden="true" />
                                            <span>Belum ada foto detail. Tambahkan menu, makanan, atau suasana UMKM.</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="detail-manage-grid">
                                <ManageField label="Nama UMKM" required>
                                    <input
                                        value={editForm.nama_umkm}
                                        onChange={handleEditChange('nama_umkm')}
                                        placeholder="Nama UMKM"
                                        required
                                    />
                                </ManageField>

                                <ManageField label="Jenis makanan">
                                    <DetailCategoryDropdown
                                        value={editForm.jenis_makanan}
                                        options={FOOD_TYPE_OPTIONS}
                                        placeholder="Pilih kategori"
                                        onChange={(value) => setEditForm((current) => ({ ...current, jenis_makanan: value }))}
                                    />
                                </ManageField>

                                <ManageField label="Kisaran harga">
                                    <input
                                        list="detail-price-options"
                                        value={editForm.harga_range}
                                        onChange={handleEditChange('harga_range')}
                                        placeholder="Pilih atau tulis harga"
                                    />
                                    <datalist id="detail-price-options">
                                        {PRICE_OPTIONS.map((option) => (
                                            <option key={option} value={option} />
                                        ))}
                                    </datalist>
                                </ManageField>

                                <ManageField label="Jam operasional">
                                    <input
                                        list="detail-hour-options"
                                        value={editForm.jam_operasional}
                                        onChange={handleEditChange('jam_operasional')}
                                        placeholder="Contoh: 08.00 - 21.00"
                                    />
                                    <datalist id="detail-hour-options">
                                        {OPERATING_HOUR_OPTIONS.map((option) => (
                                            <option key={option} value={option} />
                                        ))}
                                    </datalist>
                                </ManageField>

                                <ManageField label="Alamat" wide>
                                    <input
                                        value={editForm.alamat_teks}
                                        onChange={handleEditChange('alamat_teks')}
                                        placeholder="Alamat UMKM"
                                    />
                                </ManageField>

                                <ManageField label="Deskripsi" wide>
                                    <textarea
                                        value={editForm.deskripsi}
                                        onChange={handleEditChange('deskripsi')}
                                        placeholder="Ceritakan menu, suasana, atau info terbaru UMKM."
                                        rows="4"
                                    />
                                </ManageField>
                            </div>

                            <div className="detail-modal-actions">
                                <button className="detail-ghost-button" type="button" onClick={handleCloseEdit}>
                                    Batal
                                </button>
                                <button className="detail-primary-button" type="submit" disabled={isUpdating}>
                                    <Save aria-hidden="true" />
                                    <span>{isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {canManageUmkm && isDeleteModalOpen && (
                <div className="detail-modal-overlay" role="dialog" aria-modal="true" aria-label="Hapus UMKM" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="detail-modal detail-delete-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-delete-icon" aria-hidden="true">
                            <Trash2 />
                        </div>
                        <div className="detail-delete-copy">
                            <span>Konfirmasi hapus</span>
                            <h2>Hapus {umkm.nama_umkm}?</h2>
                            <p>
                                UMKM ini akan hilang dari feed dan halaman detail. Aksi ini tidak bisa dibatalkan.
                            </p>
                        </div>

                        {manageNotice && (
                            <div className={`detail-notice is-${manageNotice.type}`}>
                                {manageNotice.message}
                            </div>
                        )}

                        <div className="detail-modal-actions">
                            <button className="detail-ghost-button" type="button" onClick={() => setIsDeleteModalOpen(false)}>
                                Batal
                            </button>
                            <button className="detail-danger-button" type="button" disabled={isDeleting} onClick={handleDeleteUmkm}>
                                <Trash2 aria-hidden="true" />
                                <span>{isDeleting ? 'Menghapus...' : 'Hapus UMKM'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reviewToEdit && (
                <div className="detail-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit review" onClick={handleCloseEditReview}>
                    <div className="detail-modal detail-review-edit-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-modal-head">
                            <div>
                                <span>Edit review</span>
                                <h2>Perbarui ulasan kamu</h2>
                            </div>
                            <button type="button" aria-label="Tutup modal edit review" onClick={handleCloseEditReview}>
                                <X aria-hidden="true" />
                            </button>
                        </div>

                        {modalNotice && (
                            <div className={`detail-notice is-${modalNotice.type}`}>
                                {modalNotice.message}
                            </div>
                        )}

                        <form className="detail-review-form" onSubmit={handleSubmitEditReview}>
                            <label>
                                <span>Rating kamu</span>
                                <RatingStars value={editReviewRating} interactive onChange={setEditReviewRating} />
                            </label>

                            <label>
                                <span>Komentar</span>
                                <textarea
                                    rows="4"
                                    placeholder="Perbarui pengalamanmu tentang rasa, harga, tempat, atau pelayanan."
                                    value={editReviewComment}
                                    onChange={(event) => setEditReviewComment(event.target.value)}
                                    required
                                />
                            </label>

                            <section className="detail-review-upload-panel" aria-label="Edit foto review">
                                <div className="detail-review-upload-head">
                                    <div>
                                        <span>Foto review</span>
                                        <small>{editReviewPhotoCount}/{MAX_REVIEW_PHOTOS} foto</small>
                                    </div>
                                    <label className={editReviewPhotoCount >= MAX_REVIEW_PHOTOS ? 'detail-review-upload-button is-disabled' : 'detail-review-upload-button'}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            hidden
                                            disabled={editReviewPhotoCount >= MAX_REVIEW_PHOTOS}
                                            onChange={handleEditReviewPhotoChange}
                                        />
                                        <Camera aria-hidden="true" />
                                        <span>Tambah foto</span>
                                    </label>
                                </div>

                                {editReviewPhotoCount > 0 ? (
                                    <div className="detail-review-preview-grid">
                                        {editReviewExistingImages.map((image, index) => (
                                            <figure key={`existing-${image}-${index}`}>
                                                <img src={resolveImageUrl(image)} alt={`Foto review tersimpan ${index + 1}`} />
                                                <button type="button" onClick={() => handleRemoveExistingReviewImage(image)}>
                                                    Hapus
                                                </button>
                                            </figure>
                                        ))}

                                        {editReviewPhotos.map((photo, index) => (
                                            <figure key={photo.id}>
                                                <img src={photo.preview} alt={`Preview review baru ${index + 1}`} />
                                                <button type="button" onClick={() => handleRemoveEditReviewPhoto(photo.id)}>
                                                    Hapus
                                                </button>
                                            </figure>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Tambahkan foto baru kalau ingin review kamu lebih jelas.</p>
                                )}
                            </section>

                            <div className="detail-modal-actions">
                                <button className="detail-ghost-button" type="button" onClick={handleCloseEditReview}>
                                    Batal
                                </button>
                                <button className="detail-primary-button" type="submit" disabled={isUpdatingReview}>
                                    <Save aria-hidden="true" />
                                    <span>{isUpdatingReview ? 'Menyimpan...' : 'Simpan Review'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {reviewToDelete && (
                <div className="detail-modal-overlay" role="dialog" aria-modal="true" aria-label="Hapus review" onClick={() => setReviewToDelete(null)}>
                    <div className="detail-modal detail-delete-modal detail-review-delete-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-delete-icon" aria-hidden="true">
                            <Trash2 />
                        </div>
                        <div className="detail-delete-copy">
                            <span>Konfirmasi review</span>
                            <h2>Hapus review kamu?</h2>
                            <p>
                                Review dan foto yang kamu tambahkan akan dihapus dari UMKM ini. Review pengguna lain tetap aman.
                            </p>
                        </div>

                        <div className="detail-review-delete-preview">
                            <div className="detail-review-delete-preview-head">
                                <span>Review yang akan dihapus</span>
                                <small>{getReviewName(reviewToDelete)}</small>
                            </div>
                            <p>{String(reviewToDelete.komentar || '').trim() || 'Review tanpa komentar.'}</p>
                        </div>

                        <div className="detail-modal-actions">
                            <button className="detail-ghost-button" type="button" onClick={() => setReviewToDelete(null)}>
                                Batal
                            </button>
                            <button className="detail-danger-button" type="button" disabled={isDeletingReview} onClick={handleConfirmDeleteReview}>
                                <Trash2 aria-hidden="true" />
                                <span>{isDeletingReview ? 'Menghapus...' : 'Hapus Review'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isReviewModalOpen && (
                <div className="detail-modal-overlay" role="dialog" aria-modal="true" aria-label="Tulis review" onClick={handleCloseReview}>
                    <div className="detail-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="detail-modal-head">
                            <div>
                                <span>Review UMKM</span>
                                <h2>Beri nilai untuk {umkm.nama_umkm}</h2>
                            </div>
                            <button type="button" aria-label="Tutup modal" onClick={handleCloseReview}>
                                <X aria-hidden="true" />
                            </button>
                        </div>

                        {modalNotice && (
                            <div className={`detail-notice is-${modalNotice.type}`}>
                                {modalNotice.message}
                            </div>
                        )}

                        <form className="detail-review-form" onSubmit={handleSubmitReview}>
                            <label>
                                <span>Rating kamu</span>
                                <RatingStars value={rating} interactive onChange={setRating} />
                            </label>

                            <label>
                                <span>Komentar</span>
                                <textarea
                                    rows="4"
                                    placeholder="Tulis pengalamanmu: rasa, harga, tempat, atau pelayanan."
                                    value={komentar}
                                    onChange={(event) => setKomentar(event.target.value)}
                                    required
                                />
                            </label>

                            <section className="detail-review-upload-panel" aria-label="Foto review">
                                <div className="detail-review-upload-head">
                                    <div>
                                        <span>Foto review</span>
                                        <small>{reviewPhotos.length}/{MAX_REVIEW_PHOTOS} foto</small>
                                    </div>
                                    <label className={reviewPhotos.length >= MAX_REVIEW_PHOTOS ? 'detail-review-upload-button is-disabled' : 'detail-review-upload-button'}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            hidden
                                            disabled={reviewPhotos.length >= MAX_REVIEW_PHOTOS}
                                            onChange={handleReviewPhotoChange}
                                        />
                                        <Camera aria-hidden="true" />
                                        <span>Tambah foto</span>
                                    </label>
                                </div>

                                {reviewPhotos.length > 0 ? (
                                    <div className="detail-review-preview-grid">
                                        {reviewPhotos.map((photo, index) => (
                                            <figure key={photo.id}>
                                                <img src={photo.preview} alt={`Preview review ${index + 1}`} />
                                                <button type="button" onClick={() => handleRemoveReviewPhoto(photo.id)}>
                                                    Hapus
                                                </button>
                                            </figure>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Tambahkan foto makanan, menu, atau suasana agar review lebih jelas.</p>
                                )}
                            </section>

                            <div className="detail-modal-actions">
                                <button className="detail-ghost-button" type="button" onClick={handleCloseReview}>
                                    Batal
                                </button>
                                <button className="detail-primary-button" type="submit" disabled={isSubmitting}>
                                    <Send aria-hidden="true" />
                                    <span>{isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAllPhotos && (
                <Lightbox
                    key={`${lightboxStartIndex}-${allImages.length}`}
                    photos={allImages.length ? allImages : [primaryImage]}
                    title={umkm.nama_umkm}
                    initialIndex={lightboxStartIndex}
                    onClose={() => setShowAllPhotos(false)}
                />
            )}

            {reviewLightboxPhotos.length > 0 && (
                <Lightbox
                    key={`review-${reviewLightboxStartIndex}-${reviewLightboxPhotos.length}`}
                    photos={reviewLightboxPhotos}
                    title={`Review ${umkm.nama_umkm}`}
                    initialIndex={reviewLightboxStartIndex}
                    onClose={() => setReviewLightboxPhotos([])}
                />
            )}
        </main>
    );
};

const InfoItem = ({ icon: Icon, iconNode = null, label, value, wide = false }) => (
    <div className={wide ? 'detail-info-item is-wide' : 'detail-info-item'}>
        <span className="detail-info-icon">
            {iconNode || <Icon aria-hidden="true" />}
        </span>
        <div>
            <small>{label}</small>
            <strong>{value}</strong>
        </div>
    </div>
);

const ManageField = ({ label, children, required = false, wide = false }) => (
    <label className={wide ? 'detail-manage-field is-wide' : 'detail-manage-field'}>
        <span>
            {label}
            {required && <small>*</small>}
        </span>
        {children}
    </label>
);

export default UMKMDetail;
