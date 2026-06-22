import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apiClient from '../api/apiClient';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Konfigurasi Icon Leaflet
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/* ─────────────────────────────────────────────
   IKON SVG MURNI
───────────────────────────────────────────── */
const IconChevronLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
const IconCamera = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const IconImagePlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="16" y1="10" x2="22" y2="10" /><line x1="19" y1="7" x2="19" y2="13" /><circle cx="9" cy="9" r="2" /><polyline points="21 15 16 10 5 21" /></svg>;
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconMapPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;

/* ─────────────────────────────────────────────
   KONSTANTA & OPSI
───────────────────────────────────────────── */
const FOOD_TYPE_OPTIONS = ['Makanan berat', 'Snacks & Dessert', 'Minuman', 'Cepat Saji', 'Mie'];
const PRICE_OPTIONS = ['Rp5.000 - Rp10.000', 'Rp10.000 - Rp20.000', 'Rp20.000 - Rp35.000', 'Rp35.000+'];
const OPERATING_HOUR_OPTIONS = ['07.00 - 15.00', '08.00 - 17.00', '09.00 - 21.00', '10.00 - 22.00', '24 jam'];
const MAX_DETAIL_PHOTOS = 7;

/* ─────────────────────────────────────────────
   KOMPONEN KECIL & UI
───────────────────────────────────────────── */
const InlineNavbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="add-navbar glass-effect">
            <button type="button" onClick={() => navigate(-1)} className="add-btn-back">
                <IconChevronLeft /> Kembali
            </button>
            <div className="add-logo" onClick={() => navigate('/')}>
                Plus<span>Review</span>
            </div>
        </nav>
    );
};

const CustomDropdown = ({ value, options, placeholder, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`add-dropdown ${isOpen ? 'open' : ''}`} ref={ref}>
            <button type="button" className="add-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span className={!value ? 'placeholder' : ''}>{value || placeholder}</span>
                <i />
            </button>
            {isOpen && (
                <div className="add-dropdown-menu">
                    {options.map((opt) => (
                        <button key={opt} type="button" className={`add-dropdown-item ${value === opt ? 'selected' : ''}`} onClick={() => { onChange(opt); setIsOpen(false); }}>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const StepIndicator = ({ num, label, done, active }) => (
    <div className={`step-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
        <div className="step-num">{done ? '✓' : num}</div>
        <span className="step-label">{label}</span>
    </div>
);

const Card = ({ title, sub, children }) => (
    <div className="add-card">
        <div className="add-card-header">
            <h3>{title}</h3>
            <p>{sub}</p>
        </div>
        <div className="add-card-body">{children}</div>
    </div>
);

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA
───────────────────────────────────────────── */
const AddUMKM = () => {
    const navigate = useNavigate();
    
    // States
    const [position, setPosition] = useState([-4.0125, 119.6263]); // Default Parepare
    const [addrConfirmed, setAddrConfirmed] = useState(false);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [detailPhotos, setDetailPhotos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    
    const [formData, setFormData] = useState({
        nama_umkm: '',
        jenis_makanan: '',
        harga_range: '',
        jam_operasional: '',
        alamat_teks: '',
        deskripsi: '',
        latitude: -4.0125,
        longitude: 119.6263,
    });

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (coverPhoto?.preview) URL.revokeObjectURL(coverPhoto.preview);
            detailPhotos.forEach(p => URL.revokeObjectURL(p.preview));
        };
    }, [coverPhoto, detailPhotos]);

    // Toast Timer
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const showToast = (msg, type = 'error') => setToast({ message: msg, type });

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target?.value ?? e }));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (coverPhoto?.preview) URL.revokeObjectURL(coverPhoto.preview);
        setCoverPhoto({ file, preview: URL.createObjectURL(file) });
    };

    const handleDetailPhotoChange = (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (!files.length) return;
        
        const remaining = Math.max(MAX_DETAIL_PHOTOS - detailPhotos.length, 0);
        if (remaining === 0) return showToast(`Maksimal galeri ${MAX_DETAIL_PHOTOS} foto.`);
        
        const newPhotos = files.slice(0, remaining).map(f => ({
            id: Math.random().toString(), file: f, preview: URL.createObjectURL(f)
        }));
        
        setDetailPhotos(prev => [...prev, ...newPhotos]);
        if (files.length > remaining) showToast(`Hanya ${remaining} foto yang ditambahkan.`);
        e.target.value = ''; // reset input
    };

    const removeDetailPhoto = (id) => {
        setDetailPhotos(prev => {
            const target = prev.find(p => p.id === id);
            if (target) URL.revokeObjectURL(target.preview);
            return prev.filter(p => p.id !== id);
        });
    };

    const LocationMarker = () => {
        useMapEvents({
            async click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                setAddrConfirmed(false);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
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
        if (!coverPhoto) return showToast('Foto sampul wajib diunggah!');
        if (!formData.nama_umkm.trim()) return showToast('Nama UMKM wajib diisi!');
        if (!formData.jenis_makanan) return showToast('Kategori wajib dipilih!');
        if (!addrConfirmed) return showToast('Harap konfirmasi alamat di peta terlebih dahulu!');

        setIsSubmitting(true);
        const payload = new FormData();
        payload.append('image', coverPhoto.file);
        detailPhotos.forEach(p => payload.append('detail_images', p.file));
        
        Object.keys(formData).forEach(key => {
            payload.append(key, formData[key]);
        });

        try {
            await apiClient.post('/umkm', payload);
            navigate('/', { state: { successMsg: 'UMKM berhasil ditambahkan!' } });
        } catch (err) {
            showToast(err.response?.data?.message || 'Gagal menambahkan UMKM');
            setIsSubmitting(false);
        }
    };

    // Kalkulasi Step Indicator
    const hasPhoto = !!coverPhoto;
    const hasInfo = formData.nama_umkm.trim() !== '' && formData.jenis_makanan !== '';
    const hasLokasi = addrConfirmed;

    return (
        <div className="add-page-wrapper">
            <style dangerouslySetInnerHTML={{ __html: addCSS }} />
            <InlineNavbar />

            {toast && (
                <div className={`toast-notice type-${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="add-container">
                <header className="add-header">
                    <h1>Tambahkan UMKM Baru</h1>
                    <p>Bantu mahasiswa lain menemukan warung favoritmu di Parepare.</p>
                </header>

                <div className="step-container">
                    <StepIndicator num={1} label="Foto" done={hasPhoto} active={!hasPhoto} />
                    <StepIndicator num={2} label="Informasi" done={hasInfo} active={hasPhoto && !hasInfo} />
                    <StepIndicator num={3} label="Lokasi" done={hasLokasi} active={hasInfo && !hasLokasi} />
                </div>

                {/* LAYOUT SIMETRIS 50/50 */}
                <div className="add-grid-split">
                    
                    {/* KOLOM KIRI: Foto & Info */}
                    <div className="add-col">
                        <Card title="Foto UMKM" sub="Unggah foto sampul dan galeri agar lebih menarik.">
                            
                            {/* Sampul Utama */}
                            <label className="cover-upload-zone">
                                {coverPhoto ? (
                                    <>
                                        <img src={coverPhoto.preview} alt="Sampul" className="cover-preview-img" />
                                        <div className="cover-overlay"><IconImagePlus /> Ganti Sampul</div>
                                    </>
                                ) : (
                                    <div className="cover-empty">
                                        <span className="icon-large"><IconCamera /></span>
                                        <strong>Pilih Foto Sampul *</strong>
                                        <span>PNG, JPG maks 5MB</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" hidden onChange={handleCoverChange} />
                            </label>

                            {/* Galeri Multi-Foto */}
                            <div className="gallery-upload-section">
                                <div className="gallery-head">
                                    <span>Galeri Tambahan ({detailPhotos.length}/{MAX_DETAIL_PHOTOS})</span>
                                    <label className={`btn-add-gallery ${detailPhotos.length >= MAX_DETAIL_PHOTOS ? 'disabled' : ''}`}>
                                        <IconImagePlus /> Tambah <input type="file" accept="image/*" hidden multiple disabled={detailPhotos.length >= MAX_DETAIL_PHOTOS} onChange={handleDetailPhotoChange} />
                                    </label>
                                </div>
                                
                                {detailPhotos.length > 0 ? (
                                    <div className="gallery-grid">
                                        {detailPhotos.map(photo => (
                                            <div className="gallery-item" key={photo.id}>
                                                <img src={photo.preview} alt="Galeri" />
                                                <button type="button" onClick={() => removeDetailPhoto(photo.id)}><IconX /></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="gallery-empty">
                                        Tambahkan foto menu, tempat, atau makanan pendukung lainnya (Opsional).
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="Informasi Detail" sub="Isi detail warung dengan lengkap dan jelas.">
                            <div className="form-group">
                                <label>Nama Warung <span className="req">*</span></label>
                                <input type="text" placeholder="cth. Warung Bu Haji Siti" value={formData.nama_umkm} onChange={handleChange('nama_umkm')} />
                            </div>
                            
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Kategori <span className="req">*</span></label>
                                    <CustomDropdown value={formData.jenis_makanan} options={FOOD_TYPE_OPTIONS} placeholder="Pilih Kategori" onChange={handleChange('jenis_makanan')} />
                                </div>
                                <div className="form-group">
                                    <label>Jam Operasional</label>
                                    <input list="hour-opts" placeholder="cth. 08.00 - 21.00" value={formData.jam_operasional} onChange={handleChange('jam_operasional')} />
                                    <datalist id="hour-opts">{OPERATING_HOUR_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Rentang Harga</label>
                                <input list="price-opts" placeholder="cth. Rp 10.000 - Rp 25.000" value={formData.harga_range} onChange={handleChange('harga_range')} />
                                <datalist id="price-opts">{PRICE_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Deskripsi Singkat</label>
                                <textarea rows={4} placeholder="Ceritakan keunikan warung ini, menu andalan, suasana, dll." value={formData.deskripsi} onChange={handleChange('deskripsi')} />
                            </div>
                        </Card>
                    </div>

                    {/* KOLOM KANAN: Peta & Aksi */}
                    <div className="add-col">
                        <Card title="Lokasi Warung" sub="Tandai posisi di peta agar mudah ditemukan.">
                            <div className="map-frame">
                                <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationMarker />
                                </MapContainer>
                            </div>

                            <div className="form-group">
                                <label>Alamat Terdeteksi</label>
                                <div className="address-input-row">
                                    <input type="text" placeholder="Klik peta untuk mengisi otomatis..." value={formData.alamat_teks} onChange={handleChange('alamat_teks')} />
                                    <button 
                                        type="button" 
                                        className={`btn-confirm ${addrConfirmed ? 'confirmed' : ''}`}
                                        onClick={() => setAddrConfirmed(true)}
                                    >
                                        {addrConfirmed ? '✓ Terkonfirmasi' : 'Konfirmasi'}
                                    </button>
                                </div>
                                <span className="coord-hint"><IconMapPin /> {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°</span>
                            </div>
                        </Card>

                        {/* Area Tombol */}
                        <div className="action-area">
                            <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Batal</button>
                            <button type="button" className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Memproses...' : '+ Tambahkan UMKM'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   CSS INJECTION (Desain Premium, Simetris & Rapih)
───────────────────────────────────────────── */
const addCSS = `
    .add-page-wrapper { font-family: Inter, "Segoe UI", system-ui, sans-serif; background: #fbfaf6; min-height: 100vh; color: #181714; padding-bottom: 60px; }
    
    /* Navbar */
    .add-navbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(20px, 5vw, 60px); height: 72px; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .glass-effect { background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    .add-btn-back { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 30px; padding: 8px 16px; font-weight: 700; font-size: 13px; color: #181714; cursor: pointer; transition: 0.2s; }
    .add-btn-back:hover { background: #f5f5f5; }
    .add-logo { font-size: 20px; font-weight: 900; color: #181714; cursor: pointer; letter-spacing: -0.5px; }
    .add-logo span { color: #efb84f; }

    /* Layout Utama */
    .add-container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
    .add-header { margin-bottom: 32px; text-align: center; }
    .add-header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 900; color: #181714; letter-spacing: -0.5px; }
    .add-header p { margin: 0; color: #756f64; font-size: 15px; }

    /* Steps */
    .step-container { display: flex; max-width: 700px; margin: 0 auto 40px; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; background: #fafafa; }
    .step-item { flex: 1; padding: 14px 16px; display: flex; align-items: center; justify-content: center; gap: 10px; border-right: 1px solid rgba(0,0,0,0.06); transition: 0.3s; }
    .step-item:last-child { border-right: none; }
    .step-item.active { background: #fff; }
    .step-item.done { background: #fff; }
    .step-num { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; background: #e8e8e8; color: #888; transition: 0.3s; }
    .step-item.active .step-num { background: #1f3f2f; color: #fff; }
    .step-item.done .step-num { background: #efb84f; color: #fff; }
    .step-label { font-size: 13px; font-weight: 700; color: #aaa; transition: 0.3s; }
    .step-item.active .step-label { color: #181714; }
    .step-item.done .step-label { color: #8a5a00; }

    /* Split Grid Symmetrical */
    .add-grid-split { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
    .add-col { display: flex; flex-direction: column; gap: 24px; }

    /* Card */
    .add-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
    .add-card-header { padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); background: #fcfcfc; }
    .add-card-header h3 { margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #181714; }
    .add-card-header p { margin: 0; font-size: 13px; color: #756f64; }
    .add-card-body { padding: 24px; }

    /* Forms */
    .form-group { margin-bottom: 20px; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 800; color: #444; margin-bottom: 8px; }
    .form-group label .req { color: #b42318; margin-left: 4px; }
    .form-group input, .form-group textarea, .add-dropdown-trigger { width: 100%; border: 1px solid #ddd; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-family: inherit; background: #fff; outline: none; transition: 0.2s; color: #181714; }
    .form-group input:focus, .form-group textarea:focus { border-color: #1f3f2f; box-shadow: 0 0 0 3px rgba(31,63,47,0.1); }
    .form-group textarea { resize: vertical; min-height: 100px; line-height: 1.5; }

    /* Custom Dropdown */
    .add-dropdown { position: relative; }
    .add-dropdown-trigger { display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left; }
    .add-dropdown-trigger span.placeholder { color: #888; font-weight: 500; }
    .add-dropdown-trigger i { border: solid #888; border-width: 0 2px 2px 0; display: inline-block; padding: 3px; transform: rotate(45deg); transition: 0.2s; }
    .add-dropdown.open .add-dropdown-trigger i { transform: rotate(225deg); }
    .add-dropdown-menu { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 10px 24px rgba(0,0,0,0.1); z-index: 100; overflow: hidden; }
    .add-dropdown-item { display: block; width: 100%; text-align: left; border: none; background: #fff; padding: 12px 16px; font-size: 14px; font-weight: 600; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
    .add-dropdown-item:hover, .add-dropdown-item.selected { background: #f4fbf6; color: #1f3f2f; }

    /* Upload Photo Area */
    .cover-upload-zone { display: block; width: 100%; height: 220px; border: 2px dashed rgba(31,63,47,0.2); border-radius: 12px; background: #fafafa; cursor: pointer; overflow: hidden; position: relative; transition: 0.2s; }
    .cover-upload-zone:hover { border-color: #1f3f2f; background: #f4fbf6; }
    .cover-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; gap: 8px; }
    .cover-empty .icon-large svg { width: 36px; height: 36px; color: #1f3f2f; opacity: 0.6; }
    .cover-empty strong { color: #181714; font-size: 15px; }
    .cover-empty span { font-size: 12px; }
    .cover-preview-img { width: 100%; height: 100%; object-fit: cover; }
    .cover-overlay { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); color: #fff; padding: 8px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(4px); }

    /* Gallery Area */
    .gallery-upload-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.06); }
    .gallery-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .gallery-head span { font-size: 13px; font-weight: 800; color: #444; }
    .btn-add-gallery { display: flex; align-items: center; gap: 6px; background: #1f3f2f; color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .btn-add-gallery.disabled { background: #ccc; cursor: not-allowed; pointer-events: none; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .gallery-item { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #eee; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-item button { position: absolute; top: 4px; right: 4px; background: rgba(180,35,24,0.8); border: none; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .gallery-empty { font-size: 12.5px; color: #888; font-style: italic; background: #fbfaf6; padding: 12px; border-radius: 8px; text-align: center; border: 1px dashed #ddd; }

    /* Map Area */
    .map-frame { width: 100%; height: 320px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 20px; background: #eee; position: relative; z-index: 10; }
    .address-input-row { display: flex; gap: 10px; }
    .address-input-row input { flex: 1; }
    .btn-confirm { background: #f4f4f4; color: #181714; border: 1px solid #ddd; padding: 0 16px; border-radius: 10px; font-weight: 800; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-confirm.confirmed { background: #fff4d8; color: #8a5a00; border-color: #efb84f; }
    .coord-hint { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #888; margin-top: 8px; font-weight: 600; }
    .coord-hint svg { width: 14px; height: 14px; }

    /* Action Buttons */
    .action-area { display: flex; gap: 12px; justify-content: flex-end; align-items: center; margin-top: 8px; }
    .btn-cancel { background: #fff; color: #555; border: 1px solid #ddd; padding: 12px 24px; border-radius: 30px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-cancel:hover { background: #f5f5f5; }
    .btn-submit { background: #1f3f2f; color: #fff; border: none; padding: 12px 32px; border-radius: 30px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 20px rgba(31,63,47,0.2); transition: 0.2s; }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); background: #152c21; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Toast */
    .toast-notice { position: fixed; top: 90px; right: 24px; z-index: 1100; padding: 14px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #fff; display: flex; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-notice.type-success { background: #1f3f2f; }
    .toast-notice.type-error { background: #b42318; }
    @keyframes slideIn { from{ transform: translateX(100%); opacity: 0; } to{ transform: translateX(0); opacity: 1; } }

    /* Responsive */
    @media (max-width: 900px) {
        .add-grid-split { grid-template-columns: 1fr; gap: 24px; }
        .step-container { display: none; /* Sembunyikan steps di mobile agar tidak sempit */ }
        .add-header { margin-bottom: 24px; }
    }
    @media (max-width: 600px) {
        .add-container { padding: 24px 16px; }
        .add-navbar { padding: 0 16px; }
        .form-row-2 { grid-template-columns: 1fr; }
        .address-input-row { flex-direction: column; }
        .btn-confirm { padding: 12px; }
        .action-area { flex-direction: column-reverse; }
        .btn-cancel, .btn-submit { width: 100%; justify-content: center; }
        .map-frame { height: 260px; }
    }
`;

export default AddUMKM;