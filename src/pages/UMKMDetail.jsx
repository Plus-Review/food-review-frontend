import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api/apiClient';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BASE_URL = "http://localhost:5000";

/* ─── Avatar ─── */
const Avatar = ({ name }) => {
    const initial = name ? name[0].toUpperCase() : '?';
    return (
        <div style={{
            width: 38, height: 38, borderRadius: '50%',
            backgroundColor: '#e0e0e0', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '14px', color: '#555',
            flexShrink: 0
        }}>{initial}</div>
    );
};

/* ─── Bintang ─── */
const Stars = ({ rating = 5 }) => {
    const full = Math.round(Number(rating));
    return (
        <span style={{ color: '#f5a623', fontSize: '13px', letterSpacing: '1px' }}>
            {'★'.repeat(full)}{'☆'.repeat(5 - full)}
        </span>
    );
};

/* ─────────────────────────────────────────
   ADAPTIVE PHOTO GRID
───────────────────────────────────────── */
const PhotoGrid = ({ photos, onShowAll }) => {
    const n = photos.length;
    if (n === 0) return null;

    const imgStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' };
    const cell = { borderRadius: '12px', overflow: 'hidden' };
    const wrapStyle = { marginBottom: 40 };

    if (n === 1) {
        return (
            <div style={{ height: 380, ...cell, ...wrapStyle }}>
                <img src={photos[0]} alt="foto" style={imgStyle} onClick={onShowAll} />
            </div>
        );
    }

    if (n === 2) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: 380, ...wrapStyle }}>
                {photos.map((src, i) => (
                    <div key={i} style={cell}><img src={src} alt={`foto-${i}`} style={imgStyle} onClick={onShowAll} /></div>
                ))}
            </div>
        );
    }

    if (n === 3) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: 380, ...wrapStyle }}>
                <div style={cell}><img src={photos[0]} alt="foto-0" style={imgStyle} onClick={onShowAll} /></div>
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                    {photos.slice(1).map((src, i) => (
                        <div key={i} style={cell}><img src={src} alt={`foto-${i + 1}`} style={imgStyle} onClick={onShowAll} /></div>
                    ))}
                </div>
            </div>
        );
    }

    if (n === 4) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: 380, ...wrapStyle }}>
                <div style={cell}><img src={photos[0]} alt="foto-0" style={imgStyle} onClick={onShowAll} /></div>
                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: 10 }}>
                    {photos.slice(1).map((src, i) => (
                        <div key={i} style={cell}><img src={src} alt={`foto-${i + 1}`} style={imgStyle} onClick={onShowAll} /></div>
                    ))}
                </div>
            </div>
        );
    }

    const extraCount = n > 5 ? n - 5 : 0;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: 380, ...wrapStyle }}>
            <div style={cell}><img src={photos[0]} alt="foto-0" style={imgStyle} onClick={onShowAll} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                {[1, 2, 3, 4].map(i => {
                    const src = photos[i] || null;
                    if (!src) return <div key={i} />;
                    const isLast = i === 4 && extraCount > 0;
                    return (
                        <div
                            key={i}
                            style={{ ...cell, position: 'relative', cursor: 'pointer' }}
                            onClick={onShowAll}
                        >
                            <img src={src} alt={`foto-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            {isLast && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '12px'
                                }}>
                                    <span style={{ color: '#fff', fontSize: '26px', fontWeight: '700' }}>+ {extraCount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Lightbox ─── */
const Lightbox = ({ photos, onClose }) => (
    <div
        style={{
            position: 'fixed', inset: 0, zIndex: 999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px'
        }}
        onClick={onClose}
    >
        <div
            style={{
                position: 'relative', maxWidth: 900, width: '100%',
                maxHeight: '80vh', overflowY: 'auto',
                backgroundColor: '#111', borderRadius: '16px',
                padding: '48px 20px 20px',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10
            }}
            onClick={e => e.stopPropagation()}
        >
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: 12, right: 16,
                    background: 'none', border: 'none', color: '#fff',
                    fontSize: '22px', cursor: 'pointer'
                }}
            >✕</button>
            {photos.map((src, i) => (
                <img
                    key={i} src={src} alt={`semua-foto-${i}`}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }}
                />
            ))}
        </div>
    </div>
);

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
const UMKMDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [umkm, setUmkm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    // STATE UNTUK MODAL REVIEW
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [komentar, setKomentar] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchDetail = async () => {
        try {
            const response = await apiClient.get(`/umkm/${id}`);
            setUmkm(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Gagal mengambil detail UMKM", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    // FUNGSI MENGIRIM REVIEW
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) return alert('Silakan pilih rating bintang terlebih dahulu!');
        
        setIsSubmitting(true);
        try {
            await apiClient.post(`/umkm/${id}/reviews`, { rating, komentar });
            alert('Review berhasil ditambahkan!');
            setIsReviewModalOpen(false);
            setRating(0);
            setKomentar('');
            fetchDetail(); // Refresh data untuk melihat review baru
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal mengirim review. Pastikan Anda sudah login.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={styles.center}>Memuat data...</div>;
    if (!umkm) return <div style={styles.center}>UMKM tidak ditemukan.</div>;

    const allImages = umkm.images && umkm.images.length > 0
        ? umkm.images.map(img => `${BASE_URL}/uploads/${img}`)
        : umkm.image
            ? [`${BASE_URL}/uploads/${umkm.image}`]
            : [];

    const reviews = umkm.reviews || [];

    // --- LOGIKA MENGHITUNG RATA-RATA RATING SECARA DINAMIS ---
    const totalReviews = reviews.length;
    const calculatedAvgRating = totalReviews > 0 
        ? (reviews.reduce((sum, rev) => sum + (rev.rating || 0), 0) / totalReviews).toFixed(1)
        : 0;
    // ---------------------------------------------------------

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* ── BACK BUTTON ── */}
            <div style={styles.backBar}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>← Kembali ke Beranda</button>
            </div>

            <div style={styles.container}>

                {/* ── JUDUL ── */}
                <h1 style={styles.pageTitle}>{umkm.nama_umkm}</h1>

                {/* ── ADAPTIVE PHOTO GRID ── */}
                <PhotoGrid
                    photos={allImages}
                    onShowAll={() => setShowAllPhotos(true)}
                />

                {/* ── KONTEN 2 KOLOM ── */}
                <div style={styles.contentGrid}>

                    {/* ─── KIRI ─── */}
                    <div>
                        <h2 style={styles.sectionLabel}>INFORMASI UMKM</h2>
                        <div style={styles.infoCard}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoKey}>HARGA</span>
                                    <span style={styles.infoSep}>:</span>
                                    <span style={styles.infoVal}>{umkm.harga_range || 'Belum diatur'}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoKey}>RATING</span>
                                    <span style={styles.infoSep}>:</span>
                                    <span style={{ ...styles.infoVal, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Stars rating={Number(calculatedAvgRating)} />
                                        {calculatedAvgRating}
                                        {totalReviews > 0 ? ` (Dari ${totalReviews} Review)` : ' (Belum ada review)'}
                                    </span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoKey}>JENIS</span>
                                    <span style={styles.infoSep}>:</span>
                                    <span style={styles.infoVal}>{(umkm.jenis_makanan || 'UMUM').toUpperCase()}</span>
                                </div>
                            </div>
                            <button style={styles.bookmarkBtn} title="Simpan">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </button>
                        </div>

                        {/* ─── REVIEW PELANGGAN ─── */}
                        <div style={{ marginTop: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <h2 style={{ ...styles.sectionLabel, margin: 0 }}>REVIEW PELANGGAN</h2>
                                <span style={{ fontSize: '18px', fontWeight: '700' }}>→</span>
                            </div>

                            <div style={styles.reviewList}>
                                {reviews.length > 0 ? reviews.map((rev, i) => (
                                    <div key={i} style={{
                                        ...styles.reviewItem,
                                        borderBottom: i < reviews.length - 1 ? '1px solid #f0f0f0' : 'none'
                                    }}>
                                        <Avatar name={rev.User?.nama || rev.nama_user || rev.username || 'A'} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={styles.reviewName}>
                                                    {(rev.User?.nama || rev.nama_user || rev.username || 'Anonim').toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#bbb' }}>{rev.waktu || 'Baru saja'}</span>
                                            </div>
                                            <Stars rating={rev.rating || 5} />
                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>{rev.komentar}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ ...styles.reviewItem, borderBottom: 'none' }}>
                                        <Avatar name="?" />
                                        <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '14px', margin: 0 }}>
                                            Belum ada review. Jadilah yang pertama!
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setIsReviewModalOpen(true)} style={styles.addReviewBtn}>+ Tulis Review</button>
                        </div>
                    </div>

                    {/* ─── KANAN: MAP ─── */}
                    <div>
                        <h2 style={styles.sectionLabel}>LOKASI UMKM</h2>
                        <div style={styles.mapBox}>
                            {umkm.latitude && umkm.longitude ? (
                                <MapContainer
                                    center={[umkm.latitude, umkm.longitude]}
                                    zoom={16}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[umkm.latitude, umkm.longitude]}>
                                        <Popup>{umkm.nama_umkm}</Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <div style={styles.noMap}>Koordinat lokasi tidak tersedia</div>
                            )}
                        </div>
                        {umkm.alamat_teks && (
                            <p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                                📍 {umkm.alamat_teks}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── MODAL TULIS REVIEW ─── */}
            {isReviewModalOpen && (
                <div style={styles.modalOverlay} onClick={() => setIsReviewModalOpen(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{marginTop: 0, marginBottom: '20px', fontSize: '20px'}}>Beri Nilai & Ulasan</h2>
                        <form onSubmit={handleSubmitReview}>
                            
                            {/* Input Bintang Interaktif */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Rating Anda:</p>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span 
                                            key={star} 
                                            onClick={() => setRating(star)}
                                            style={{ 
                                                fontSize: '32px', 
                                                cursor: 'pointer', 
                                                color: star <= rating ? '#f5a623' : '#e0e0e0',
                                                transition: 'color 0.2s'
                                            }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Input Komentar */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Komentar:</p>
                                <textarea 
                                    rows="4" 
                                    style={styles.textarea} 
                                    placeholder="Bagaimana rasa makanannya? Tempatnya nyaman?"
                                    value={komentar}
                                    onChange={(e) => setKomentar(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Tombol Aksi */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setIsReviewModalOpen(false)} style={styles.cancelBtn}>Batal</button>
                                <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX UNTUK SEMUA FOTO */}
            {showAllPhotos && (
                <Lightbox photos={allImages} onClose={() => setShowAllPhotos(false)} />
            )}
        </div>
    );
};

const styles = {
    center: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', fontSize: '20px', fontFamily: "'Segoe UI', sans-serif"
    },
    backBar: { padding: '20px 40px', borderBottom: '1px solid #eee' },
    backBtn: {
        background: 'none', border: 'none', fontSize: '15px',
        fontWeight: '600', cursor: 'pointer', color: '#111'
    },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '36px 20px 60px' },
    pageTitle: {
        fontSize: '36px', fontWeight: '800', color: '#111',
        margin: '0 0 28px 0', letterSpacing: '-0.5px'
    },
    contentGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '48px', alignItems: 'start'
    },
    sectionLabel: {
        fontSize: '13px', fontWeight: '700', letterSpacing: '1.2px',
        color: '#111', margin: '0 0 16px 0'
    },
    infoCard: {
        border: '1px solid #e8e8e8', borderRadius: '12px', padding: '20px',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '12px'
    },
    infoRow: { display: 'flex', gap: '12px', alignItems: 'center' },
    infoKey: { fontSize: '13px', color: '#888', width: '65px', fontWeight: '500' },
    infoSep: { fontSize: '13px', color: '#ccc' },
    infoVal: { fontSize: '13px', color: '#111', fontWeight: '500' },
    bookmarkBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', flexShrink: 0
    },
    reviewList: {
        border: '1px solid #e8e8e8', borderRadius: '12px', overflow: 'hidden'
    },
    reviewItem: {
        display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px'
    },
    reviewName: { fontSize: '13px', fontWeight: '700', letterSpacing: '0.3px', color: '#111' },
    addReviewBtn: {
        marginTop: '20px', backgroundColor: '#111', color: '#fff',
        border: 'none', borderRadius: '8px', padding: '10px 20px',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer'
    },
    mapBox: {
        height: '420px', width: '100%',
        borderRadius: '12px', overflow: 'hidden',
        border: '1px solid #e8e8e8'
    },
    noMap: {
        height: '100%', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#f5f5f5', color: '#aaa', fontSize: '14px'
    },

    /* GAYA MODAL REVIEW */
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff', padding: '30px', borderRadius: '12px',
        width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    },
    textarea: {
        width: '100%', padding: '12px', borderRadius: '8px',
        border: '1px solid #ccc', outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box', resize: 'vertical'
    },
    cancelBtn: {
        padding: '10px 15px', backgroundColor: '#eee', border: 'none',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#333'
    },
    submitBtn: {
        padding: '10px 15px', backgroundColor: '#111', color: '#fff',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
    }
};

export default UMKMDetail;