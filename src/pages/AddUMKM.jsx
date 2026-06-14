import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apiClient from '../api/apiClient';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const KATEGORI_OPTIONS = ['Makanan Berat', 'Cepat Saji', 'Minuman', 'Snack', 'Mie'];

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const AddUMKM = () => {
    const navigate = useNavigate();
    const [image, setImage]     = useState(null);
    const [preview, setPreview] = useState(null);
    const [addrConfirmed, setAddrConfirmed] = useState(false);
    const [position, setPosition] = useState([-4.01, 119.62]);
    const [formData, setFormData] = useState({
        nama_umkm:    '',
        jenis_makanan: '',
        harga_range:  '',
        alamat_teks:  '',
        deskripsi:    '',
        latitude:     -4.01,
        longitude:    119.62,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const LocationMarker = () => {
        useMapEvents({
            async click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                setAddrConfirmed(false);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                try {
                    const res  = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    );
                    const data = await res.json();
                    setFormData(prev => ({ ...prev, alamat_teks: data.display_name || '' }));
                } catch (err) {
                    console.error('Gagal ambil alamat', err);
                }
            },
        });
        return <Marker position={position} />;
    };

    const handleSubmit = async () => {
        if (!image) return alert('Gambar wajib diisi!');
        if (!formData.nama_umkm.trim()) return alert('Nama UMKM wajib diisi!');

        const data = new FormData();
        data.append('image',        image);
        data.append('nama_umkm',    formData.nama_umkm);
        data.append('jenis_makanan', formData.jenis_makanan);
        data.append('harga_range',  formData.harga_range);
        data.append('alamat_teks',  formData.alamat_teks);
        data.append('deskripsi',    formData.deskripsi);
        data.append('latitude',     formData.latitude);
        data.append('longitude',    formData.longitude);

        try {
            await apiClient.post('/umkm', data);
            alert('UMKM berhasil ditambahkan!');
            navigate('/');
        } catch (err) {
            console.error('Error submit:', err);
            alert(err.response?.data?.message || 'Gagal menambahkan UMKM');
        }
    };

    /* step indicator */
    const hasPhoto = !!preview;
    const hasInfo  = formData.nama_umkm.trim() !== '';
    const hasLokasi = addrConfirmed;

    return (
        <div style={s.page}>

            {/* ── NAVBAR ── */}
            <nav style={s.navbar}>
                <div style={s.logo} onClick={() => navigate('/')}>
                    Plus<span style={{ color: '#E24B4A' }}>Review</span>
                </div>
                <div style={s.navLinks}>
                    <NavBtn onClick={() => navigate('/')}>Beranda</NavBtn>
                    <NavBtn onClick={() => navigate('/feed')}>Feed</NavBtn>
                    <NavBtn active>Tambah UMKM</NavBtn>
                </div>
                <div style={{ width: 120 }} />
            </nav>

            {/* ── BODY ── */}
            <div style={s.body}>

                {/* Header */}
                <div style={s.pageHeader}>
                    <h1 style={s.pageTitle}>Tambahkan UMKM</h1>
                    <p style={s.pageSub}>Bantu mahasiswa lain menemukan warung favoritmu di Parepare.</p>
                </div>

                {/* Step Indicator */}
                <div style={s.steps}>
                    <Step num={1} label="Foto"       done={hasPhoto}  active={!hasPhoto} />
                    <Step num={2} label="Informasi"  done={hasInfo}   active={hasPhoto && !hasInfo} />
                    <Step num={3} label="Lokasi"     done={hasLokasi} active={hasInfo && !hasLokasi} />
                </div>

                {/* ── CARD: FOTO ── */}
                <Card
                    icon="📷"
                    title="Foto warung"
                    sub="Unggah foto terbaik agar terlihat menarik"
                >
                    {preview ? (
                        <div style={s.previewWrap}>
                            <img src={preview} alt="preview" style={s.previewImg} />
                            <label style={s.previewChange}>
                                Ganti foto
                                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                            </label>
                        </div>
                    ) : (
                        <label style={s.uploadZone}>
                            <span style={{ fontSize: 32, color: '#ccc' }}>☁️</span>
                            <span style={s.uploadLabel}>Tarik & lepas foto di sini</span>
                            <span style={s.uploadHint}>PNG, JPG, WEBP · maks. 5MB</span>
                            <span style={s.uploadBtn}>Pilih dari galeri</span>
                            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                        </label>
                    )}
                </Card>

                {/* ── CARD: INFORMASI ── */}
                <Card
                    icon="ℹ️"
                    title="Informasi UMKM"
                    sub="Isi detail warung dengan lengkap"
                >
                    <div style={s.field}>
                        <label style={s.label}>Nama warung <span style={{ color: '#E24B4A' }}>*</span></label>
                        <input
                            style={s.input}
                            type="text"
                            placeholder="cth. Warung Bu Haji Siti"
                            value={formData.nama_umkm}
                            onChange={handleChange('nama_umkm')}
                        />
                    </div>
                    <div style={s.row2}>
                        <div style={s.field}>
                            <label style={s.label}>Kategori <span style={{ color: '#E24B4A' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    style={s.select}
                                    value={formData.jenis_makanan}
                                    onChange={handleChange('jenis_makanan')}
                                >
                                    <option value="">Pilih kategori</option>
                                    {KATEGORI_OPTIONS.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                                <span style={s.selectArrow}>▾</span>
                            </div>
                        </div>
                        <div style={s.field}>
                            <label style={s.label}>Rentang harga</label>
                            <input
                                style={s.input}
                                type="text"
                                placeholder="cth. Rp 10.000–25.000"
                                value={formData.harga_range}
                                onChange={handleChange('harga_range')}
                            />
                        </div>
                    </div>
                    <div style={{ ...s.field, marginBottom: 0 }}>
                        <label style={s.label}>Deskripsi singkat</label>
                        <textarea
                            style={s.textarea}
                            placeholder="Ceritakan keunikan warung ini, menu andalan, suasana, dll."
                            value={formData.deskripsi}
                            onChange={handleChange('deskripsi')}
                        />
                    </div>
                </Card>

                {/* ── CARD: LOKASI ── */}
                <Card
                    icon="📍"
                    title="Lokasi warung"
                    sub="Klik pada peta untuk menandai posisi"
                >
                    {/* Peta Leaflet */}
                    <div style={s.mapWrap}>
                        <MapContainer
                            center={position}
                            zoom={14}
                            style={{ height: '100%', width: '100%', borderRadius: '10px' }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker />
                        </MapContainer>
                    </div>

                    {/* Alamat + Konfirmasi */}
                    <div style={s.addrRow}>
                        <div style={{ flex: 1 }}>
                            <label style={{ ...s.label, marginBottom: 6 }}>Alamat terdeteksi</label>
                            <input
                                style={s.input}
                                type="text"
                                placeholder="Klik peta untuk mengisi otomatis..."
                                value={formData.alamat_teks}
                                onChange={handleChange('alamat_teks')}
                            />
                        </div>
                        <button
                            style={{
                                ...s.confirmAddrBtn,
                                ...(addrConfirmed ? s.confirmAddrBtnDone : {}),
                            }}
                            onClick={() => setAddrConfirmed(true)}
                        >
                            {addrConfirmed ? '✓ Terkonfirmasi' : 'Konfirmasi'}
                        </button>
                    </div>

                    {/* Koordinat kecil */}
                    <p style={s.coordHint}>
                        Koordinat: {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°
                    </p>
                </Card>

                {/* ── TOMBOL AKSI ── */}
                <div style={s.actions}>
                    <button style={s.cancelBtn} onClick={() => navigate('/')}>Batal</button>
                    <button style={s.submitBtn} onClick={handleSubmit}>
                        + Tambahkan UMKM
                    </button>
                </div>

            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   KOMPONEN KECIL
───────────────────────────────────────────── */
const NavBtn = ({ children, onClick, active }) => (
    <button
        onClick={onClick}
        style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '8px 14px',
            borderRadius: '20px',
            color: active ? '#111' : '#888',
            backgroundColor: active ? '#f4f4f4' : 'transparent',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f4f4f4'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
        {children}
    </button>
);

const Step = ({ num, label, done, active }) => (
    <div style={{
        ...s.step,
        ...(done  ? s.stepDone   : {}),
        ...(active ? s.stepActive : {}),
    }}>
        <div style={{
            ...s.stepNum,
            ...(done  ? s.stepNumDone   : {}),
            ...(active ? s.stepNumActive : {}),
        }}>
            {done ? '✓' : num}
        </div>
        <span style={{
            ...s.stepLabel,
            ...(done  ? s.stepLabelDone   : {}),
            ...(active ? s.stepLabelActive : {}),
        }}>
            {label}
        </span>
    </div>
);

const Card = ({ icon, title, sub, children }) => (
    <div style={s.card}>
        <div style={s.cardHead}>
            <div style={s.cardHeadIcon}>{icon}</div>
            <div>
                <p style={s.cardHeadTitle}>{title}</p>
                <p style={s.cardHeadSub}>{sub}</p>
            </div>
        </div>
        <div style={s.cardBody}>{children}</div>
    </div>
);

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = {
    page: {
        backgroundColor: '#fff',
        minHeight: '100vh',
        color: '#111',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        paddingBottom: 80,
    },

    /* Navbar */
    navbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 68,
        borderBottom: '0.5px solid #eee',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    logo: {
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        cursor: 'pointer',
    },
    navLinks: {
        display: 'flex',
        gap: 4,
    },

    /* Body */
    body: {
        maxWidth: 760,
        margin: '0 auto',
        padding: '48px 24px 0',
    },
    pageHeader: {
        marginBottom: 36,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: 700,
        marginBottom: 6,
    },
    pageSub: {
        fontSize: 14,
        color: '#666',
        lineHeight: 1.5,
    },

    /* Steps */
    steps: {
        display: 'flex',
        gap: 0,
        marginBottom: 32,
        border: '0.5px solid #eee',
        borderRadius: 12,
        overflow: 'hidden',
    },
    step: {
        flex: 1,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fafafa',
        borderRight: '0.5px solid #eee',
    },
    stepDone: { backgroundColor: '#fff' },
    stepActive: { backgroundColor: '#fff' },
    stepNum: {
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        backgroundColor: '#e8e8e8', color: '#999',
    },
    stepNumActive: { backgroundColor: '#E24B4A', color: '#fff' },
    stepNumDone: { backgroundColor: '#639922', color: '#fff' },
    stepLabel: { fontSize: 13, fontWeight: 500, color: '#aaa' },
    stepLabelActive: { color: '#111' },
    stepLabelDone: { color: '#3B6D11' },

    /* Card */
    card: {
        backgroundColor: '#fff',
        border: '0.5px solid #eee',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 20,
    },
    cardHead: {
        padding: '18px 24px',
        borderBottom: '0.5px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    cardHeadIcon: {
        width: 36, height: 36, borderRadius: 9,
        backgroundColor: '#FCEBEB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
    },
    cardHeadTitle: {
        fontSize: 15, fontWeight: 600, margin: 0, color: '#111',
    },
    cardHeadSub: {
        fontSize: 12, color: '#888', margin: '2px 0 0',
    },
    cardBody: {
        padding: 24,
    },

    /* Upload */
    uploadZone: {
        border: '1.5px dashed #ddd',
        borderRadius: 12,
        padding: '40px 24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 10, cursor: 'pointer', textAlign: 'center',
        backgroundColor: '#fafafa',
        transition: 'border-color 0.15s',
    },
    uploadLabel: {
        fontSize: 14, fontWeight: 600, color: '#333',
    },
    uploadHint: {
        fontSize: 12, color: '#aaa',
    },
    uploadBtn: {
        backgroundColor: '#E24B4A', color: '#fff',
        padding: '9px 20px', borderRadius: 20,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        marginTop: 4,
    },
    previewWrap: {
        position: 'relative', borderRadius: 12, overflow: 'hidden',
    },
    previewImg: {
        width: '100%', height: 220, objectFit: 'cover', display: 'block',
    },
    previewChange: {
        position: 'absolute', bottom: 12, right: 12,
        backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff',
        padding: '7px 14px', borderRadius: 20,
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
    },

    /* Fields */
    field: {
        marginBottom: 20,
    },
    label: {
        display: 'block', fontSize: 13, fontWeight: 600,
        color: '#555', marginBottom: 6,
    },
    input: {
        width: '100%', padding: '11px 14px',
        border: '0.5px solid #ddd', borderRadius: 8,
        fontSize: 14, color: '#111', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 0.15s',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%', padding: '11px 14px',
        border: '0.5px solid #ddd', borderRadius: 8,
        fontSize: 14, color: '#111', outline: 'none',
        fontFamily: 'inherit', resize: 'vertical',
        minHeight: 90, lineHeight: 1.5,
        boxSizing: 'border-box',
    },
    select: {
        width: '100%', padding: '11px 36px 11px 14px',
        border: '0.5px solid #ddd', borderRadius: 8,
        fontSize: 14, color: '#111', outline: 'none',
        fontFamily: 'inherit', appearance: 'none',
        backgroundColor: '#fff', cursor: 'pointer',
        boxSizing: 'border-box',
    },
    selectArrow: {
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        color: '#aaa', pointerEvents: 'none', fontSize: 13,
    },
    row2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
    },

    /* Map */
    mapWrap: {
        height: 240, width: '100%',
        border: '0.5px solid #eee',
        borderRadius: 10, overflow: 'hidden',
        marginBottom: 14,
    },
    addrRow: {
        display: 'flex', gap: 10, alignItems: 'flex-end',
    },
    confirmAddrBtn: {
        backgroundColor: '#f4f4f4', color: '#333',
        border: '0.5px solid #ddd', borderRadius: 8,
        padding: '11px 16px', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'all 0.15s',
    },
    confirmAddrBtnDone: {
        backgroundColor: '#EAF3DE', color: '#3B6D11',
        border: '0.5px solid #C0DD97',
    },
    coordHint: {
        fontSize: 11, color: '#aaa', marginTop: 8,
    },

    /* Actions */
    actions: {
        display: 'flex', gap: 12, justifyContent: 'flex-end',
        alignItems: 'center', marginTop: 8,
    },
    cancelBtn: {
        background: 'none', color: '#666',
        border: '0.5px solid #ddd', borderRadius: 22,
        padding: '11px 26px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
    },
    submitBtn: {
        backgroundColor: '#E24B4A', color: '#fff', border: 'none',
        padding: '11px 32px', borderRadius: 22,
        fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
    },
};

export default AddUMKM;