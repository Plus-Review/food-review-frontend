import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/apiClient';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const BASE_URL = "http://localhost:5000";

// --- SUB-KOMPONEN TETAP SAMA ---
const Avatar = ({ name }) => {
    const initial = name ? name[0].toUpperCase() : '?';
    return (
        <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#f0f0f0', border: '0.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, color: '#555', flexShrink: 0 }}>{initial}</div>
    );
};

const Stars = ({ rating = 5 }) => {
    const full = Math.round(Number(rating));
    return (
        <span style={{ color: '#E24B4A', fontSize: 13, letterSpacing: 1 }}>{'★'.repeat(full)}<span style={{ color: '#ddd' }}>{'★'.repeat(5 - full)}</span></span>
    );
};

const PhotoGrid = ({ photos, onShowAll }) => {
    const n = photos.length;
    if (n === 0) return <div style={s.photoPlaceholder}>🍽️</div>;
    const imgStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' };
    if (n === 1) return <div style={s.photoGrid1}><img src={photos[0]} alt="foto" style={imgStyle} onClick={onShowAll} /></div>;
    const extraCount = n > 3 ? n - 3 : 0;
    return (
        <div style={s.photoGrid}>
            <div style={{ ...s.photoCell, gridRow: 'span 2', overflow: 'hidden' }}><img src={photos[0]} alt="foto-0" style={imgStyle} onClick={onShowAll} /></div>
            <div style={{ ...s.photoCell, overflow: 'hidden' }}>{photos[1] && <img src={photos[1]} alt="foto-1" style={imgStyle} onClick={onShowAll} />}</div>
            <div style={{ ...s.photoCell, position: 'relative', overflow: 'hidden' }}>
                {photos[2] && (
                    <>
                        <img src={photos[2]} alt="foto-2" style={imgStyle} onClick={onShowAll} />
                        {extraCount > 0 && <div style={s.moreOverlay} onClick={onShowAll}><span style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>+{extraCount}</span></div>}
                    </>
                )}
            </div>
        </div>
    );
};

const Lightbox = ({ photos, onClose }) => (
    <div style={s.lightboxBackdrop} onClick={onClose}>
        <div style={s.lightboxInner} onClick={e => e.stopPropagation()}>
            <button style={s.lightboxClose} onClick={onClose}>✕</button>
            {photos.map((src, i) => <img key={i} src={src} alt={`foto-${i}`} style={s.lightboxImg} />)}
        </div>
    </div>
);

const ReviewModal = ({ onClose, onSubmit, rating, setRating, komentar, setKomentar, isSubmitting }) => (
    <div style={s.modalBackdrop} onClick={onClose}>
        <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Beri nilai & ulasan</h3>
            <label style={s.modalLabel}>Rating Anda</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(star => <span key={star} onClick={() => setRating(star)} style={{ fontSize: 30, cursor: 'pointer', transition: 'color 0.15s', color: star <= rating ? '#E24B4A' : '#ddd' }}>★</span>)}
            </div>
            <label style={s.modalLabel}>Komentar</label>
            <textarea rows={4} style={s.modalTextarea} placeholder="Bagaimana rasa makanannya? Tempatnya nyaman?" value={komentar} onChange={e => setKomentar(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={s.modalCancelBtn} onClick={onClose}>Batal</button>
                <button style={s.modalSubmitBtn} onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? 'Mengirim...' : 'Kirim ulasan'}</button>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
const UMKMDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [umkm, setUmkm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [komentar, setKomentar] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State Favorit API
    const [isFavorit, setIsFavorit] = useState(false);

    const fetchDetail = async () => {
        try {
            const res = await apiClient.get(`/umkm/${id}`);
            setUmkm(res.data);
        } catch (err) {
            console.error('Gagal mengambil detail UMKM', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchDetail(); 
        
        // Cek status favorit ke Backend
        const cekFavoritDatabase = async () => {
            if (!localStorage.getItem('token')) return;
            try {
                const res = await apiClient.get('/favorit/me');
                const favList = res.data;
                const sudahFavorit = favList.some(fav => String(fav.umkm_id) === String(id));
                setIsFavorit(sudahFavorit);
            } catch (err) {
                console.log("Gagal memuat status favorit");
            }
        };
        cekFavoritDatabase();
    }, [id]);

    const toggleFavorit = async () => {
        if (!localStorage.getItem('token')) return alert("Kamu harus login dulu!");
        
        // Animasi klik instan (Optimistic UI)
        setIsFavorit(!isFavorit);

        try {
            await apiClient.post('/favorit/toggle', { umkm_id: id });
        } catch (error) {
            setIsFavorit(!isFavorit); // Kembalikan ke semula jika gagal
            const pesanError = error.response?.data?.message || error.message;
            console.error("DETAIL ERROR FAVORIT:", error.response || error);
            alert("Gagal: " + pesanError);
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) return alert('Pilih rating bintang terlebih dahulu!');
        setIsSubmitting(true);
        try {
            await apiClient.post(`/umkm/${id}/reviews`, { rating, komentar });
            setIsReviewModalOpen(false);
            setRating(0);
            setKomentar('');
            fetchDetail();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengirim review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={s.center}>Memuat data...</div>;
    if (!umkm)   return <div style={s.center}>UMKM tidak ditemukan.</div>;

    const allImages = umkm.images?.length ? umkm.images.map(img => `${BASE_URL}/uploads/${img}`) : umkm.image ? [`${BASE_URL}/uploads/${umkm.image}`] : [];
    const reviews = umkm.reviews || [];
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1) : '0.0';
    const kategori = umkm.jenis_makanan || umkm.kategori || umkm.jenis || 'Umum';

    return (
        <div style={s.page}>
            <nav style={s.navbar}>
                <button style={s.backBtn} onClick={() => navigate(-1)}>← Kembali</button>
                <span style={s.breadcrumb}>Beranda › <span style={{ color: '#111' }}>{umkm.nama_umkm}</span></span>
            </nav>

            <div style={s.body}>
                <div style={s.topRow}>
                    <div>
                        <h1 style={s.pageTitle}>{umkm.nama_umkm}</h1>
                        <div style={s.metaRow}>
                            {kategori && <span style={s.badgeRed}>{kategori}</span>}
                            <div style={s.ratingChip}>
                                <span style={{ color: '#E24B4A', fontSize: 15 }}>★</span>
                                <strong style={{ fontSize: 13 }}>{avgRating}</strong>
                                <span style={{ fontSize: 12, color: '#aaa' }}>({totalReviews} ulasan)</span>
                            </div>
                            {umkm.harga_range && <span style={s.badge}>{umkm.harga_range}</span>}
                        </div>
                    </div>
                    <div style={s.topActions}>
                        <button 
                            style={{ ...s.actionBtn, backgroundColor: isFavorit ? '#FCEBEB' : 'transparent', borderColor: isFavorit ? '#E24B4A' : '#ddd', color: isFavorit ? '#E24B4A' : '#333' }} 
                            onClick={toggleFavorit}
                        >
                            {isFavorit ? '❤️ Tersimpan' : '🤍 Simpan Favorit'}
                        </button>
                        <button style={s.actionBtn}>↗ Bagikan</button>
                        <button style={s.actionBtnPrimary} onClick={() => setIsReviewModalOpen(true)}>★ Tulis ulasan</button>
                    </div>
                </div>

                <div style={{ position: 'relative', marginBottom: 40 }}>
                    <PhotoGrid photos={allImages} onShowAll={() => setShowAllPhotos(true)} />
                    {allImages.length > 0 && <button style={s.showAllBtn} onClick={() => setShowAllPhotos(true)}>🖼 Lihat semua foto</button>}
                </div>

                <div style={s.contentGrid}>
                    <div>
                        <p style={s.sectionLabel}>Informasi</p>
                        <div style={s.infoCard}>
                            <InfoRow icon="💰" label="Harga" value={umkm.harga_range || 'Belum diatur'} />
                            <InfoRow icon="⭐" label="Rating" value={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Stars rating={Number(avgRating)} />{avgRating}<span style={{ fontSize: 12, color: '#aaa' }}>{totalReviews > 0 ? `(${totalReviews})` : '(belum ada)'}</span></span>} />
                            <InfoRow icon="🏷️" label="Kategori" value={kategori.toUpperCase()} />
                        </div>

                        {umkm.deskripsi && (
                            <>
                                <p style={s.sectionLabel}>Tentang</p>
                                <div style={s.descCard}>{umkm.deskripsi}</div>
                            </>
                        )}

                        <div style={s.reviewHead}>
                            <h2 style={s.reviewHeadTitle}>Ulasan pelanggan</h2>
                            <span style={s.reviewCount}>{totalReviews} ulasan</span>
                        </div>
                        <div style={s.reviewList}>
                            {reviews.length > 0 ? reviews.map((rev, i) => (
                                <div key={i} style={{ ...s.reviewItem, borderBottom: i < reviews.length - 1 ? '0.5px solid #f0f0f0' : 'none' }}>
                                    <Avatar name={rev.User?.nama || rev.nama_user || rev.username || 'A'} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                            <span style={s.reviewName}>{rev.User?.nama || rev.nama_user || rev.username || 'Anonim'}</span>
                                            <Stars rating={rev.rating || 5} />
                                        </div>
                                        <span style={s.reviewTime}>{rev.waktu || 'Baru saja'}</span>
                                        <p style={s.reviewText}>{rev.komentar}</p>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ ...s.reviewItem, borderBottom: 'none' }}>
                                    <Avatar name="?" />
                                    <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: 14, margin: 0 }}>Belum ada ulasan. Jadilah yang pertama!</p>
                                </div>
                            )}
                        </div>

                        <button style={s.writeReviewBtn} onClick={() => setIsReviewModalOpen(true)}>✏️  Tulis ulasan Anda...</button>
                    </div>

                    <div>
                        <p style={s.sectionLabel}>Lokasi</p>
                        <div style={s.mapBox}>
                            {umkm.latitude && umkm.longitude ? (
                                <MapContainer center={[umkm.latitude, umkm.longitude]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[umkm.latitude, umkm.longitude]}><Popup>{umkm.nama_umkm}</Popup></Marker>
                                </MapContainer>
                            ) : (
                                <div style={s.noMap}>Koordinat lokasi tidak tersedia</div>
                            )}
                        </div>
                        {umkm.alamat_teks && <p style={s.addrText}>📍 {umkm.alamat_teks}</p>}
                        <button style={{ ...s.actionBtn, width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => window.open(`https://maps.google.com/?q=${umkm.latitude},${umkm.longitude}`, '_blank')}>🗺 Buka di Google Maps</button>
                    </div>
                </div>
            </div>

            {isReviewModalOpen && <ReviewModal onClose={() => setIsReviewModalOpen(false)} onSubmit={handleSubmitReview} rating={rating} setRating={setRating} komentar={komentar} setKomentar={setKomentar} isSubmitting={isSubmitting} />}
            {showAllPhotos && <Lightbox photos={allImages} onClose={() => setShowAllPhotos(false)} />}
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div style={s.infoRow}>
        <div style={s.infoIcon}>{icon}</div>
        <span style={s.infoKey}>{label}</span>
        <span style={s.infoVal}>{value}</span>
    </div>
);

// Objek Styles "s" milikmu biarkan utuh di bawah sini (tidak saya tulis ulang semua agar hemat tempat, karena kodenya sama persis dengan aslinya).
const s = {
    // ... PASTE SEMUA STYLES MILIKMU SEPERTI BIASA DI SINI ...
    page: { backgroundColor: '#fff', minHeight: '100vh', color: '#111', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", paddingBottom: 80 },
    center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18, color: '#888', fontFamily: "'Segoe UI', sans-serif" },
    navbar: { display: 'flex', alignItems: 'center', gap: 16, padding: '0 32px', height: 68, borderBottom: '0.5px solid #eee', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 },
    backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#f4f4f4', border: '0.5px solid #e0e0e0', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#333', fontFamily: 'inherit' },
    breadcrumb: { fontSize: 13, color: '#aaa' },
    body: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px 0' },
    topRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    pageTitle: { fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-0.5px', marginBottom: 8 },
    metaRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    badge: { fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 10, backgroundColor: '#f4f4f4', color: '#555' },
    badgeRed: { fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 10, backgroundColor: '#FCEBEB', color: '#A32D2D' },
    ratingChip: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#111' },
    topActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    actionBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '0.5px solid #ddd', borderRadius: 22, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#333', fontFamily: 'inherit', transition: 'all 0.2s ease' },
    actionBtnPrimary: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#E24B4A', color: '#fff', border: 'none', borderRadius: 22, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    photoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, height: 380, borderRadius: 14, overflow: 'hidden' },
    photoGrid1: { height: 380, borderRadius: 14, overflow: 'hidden' },
    photoCell: { borderRadius: 0, overflow: 'hidden' },
    photoPlaceholder: { height: 380, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 },
    moreOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    showAllBtn: { position: 'absolute', bottom: 14, right: 14, background: '#fff', border: '0.5px solid #ddd', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#333', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    contentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' },
    sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: '1px', color: '#aaa', textTransform: 'uppercase', marginBottom: 12 },
    infoCard: { border: '0.5px solid #eee', borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
    infoRow: { display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '0.5px solid #f0f0f0', gap: 12 },
    infoIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f8f8f8', border: '0.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
    infoKey: { fontSize: 12, color: '#888', width: 70, flexShrink: 0 },
    infoVal: { fontSize: 13, fontWeight: 500, color: '#111' },
    descCard: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: '16px 18px', fontSize: 13, color: '#555', lineHeight: 1.65, border: '0.5px solid #eee', marginBottom: 24 },
    reviewHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    reviewHeadTitle: { fontSize: 15, fontWeight: 600, margin: 0 },
    reviewCount: { fontSize: 13, color: '#aaa' },
    reviewList: { border: '0.5px solid #eee', borderRadius: 14, overflow: 'hidden' },
    reviewItem: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px' },
    reviewName: { fontSize: 13, fontWeight: 600, color: '#111' },
    reviewTime: { fontSize: 11, color: '#bbb', display: 'block', marginBottom: 4 },
    reviewText: { fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 },
    writeReviewBtn: { width: '100%', marginTop: 12, background: 'none', border: '0.5px solid #e0e0e0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#888', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' },
    mapBox: { height: 280, width: '100%', borderRadius: 14, overflow: 'hidden', border: '0.5px solid #eee', marginBottom: 12 },
    noMap: { height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8', color: '#aaa', fontSize: 14 },
    addrText: { fontSize: 13, color: '#666', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 },
    modalBackdrop: { position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalBox: { backgroundColor: '#fff', padding: 28, borderRadius: 16, width: '100%', maxWidth: 420, border: '0.5px solid #eee', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
    modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#111' },
    modalLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 },
    modalTextarea: { width: '100%', padding: '11px 14px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 90, lineHeight: 1.5, marginBottom: 20, boxSizing: 'border-box' },
    modalCancelBtn: { background: 'none', border: '0.5px solid #ddd', borderRadius: 22, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#666', fontFamily: 'inherit' },
    modalSubmitBtn: { backgroundColor: '#E24B4A', color: '#fff', border: 'none', borderRadius: 22, padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    lightboxBackdrop: { position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 },
    lightboxInner: { position: 'relative', maxWidth: 900, width: '100%', maxHeight: '80vh', overflowY: 'auto', backgroundColor: '#111', borderRadius: 16, padding: '48px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
    lightboxClose: { position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' },
    lightboxImg: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 },
};

export default UMKMDetail;