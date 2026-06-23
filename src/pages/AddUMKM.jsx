import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import './AddUMKM.css';
import { optimizeImageFile, optimizeImageFiles } from '../utils/imageUpload';

const DEFAULT_POSITION = [-4.01, 119.62];

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

const defaultFormData = {
    nama_umkm: '',
    jenis_makanan: '',
    harga_range: '',
    jam_operasional: '',
    alamat_teks: '',
    deskripsi: '',
    latitude: DEFAULT_POSITION[0],
    longitude: DEFAULT_POSITION[1],
};

const defaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const AddUMKM = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [position, setPosition] = useState(DEFAULT_POSITION);
    const [addressStatus, setAddressStatus] = useState('Titik awal berada di area kampus.');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(defaultFormData);
    const [detailPhotos, setDetailPhotos] = useState([]);
    const [selectedDetailPhotoId, setSelectedDetailPhotoId] = useState(null);
    const [submitNotice, setSubmitNotice] = useState(null);
    const detailPhotosRef = useRef([]);

    useEffect(() => (
        () => {
            if (preview) URL.revokeObjectURL(preview);
        }
    ), [preview]);

    useEffect(() => {
        detailPhotosRef.current = detailPhotos;
    }, [detailPhotos]);

    useEffect(() => (
        () => {
            detailPhotosRef.current.forEach((photo) => {
                if (photo?.preview) URL.revokeObjectURL(photo.preview);
            });
        }
    ), []);

    const detailPhotoCount = detailPhotos.length;
    const selectedDetailPhotoIndex = detailPhotos.findIndex((photo) => photo.id === selectedDetailPhotoId);
    const selectedDetailPhoto = selectedDetailPhotoIndex >= 0 ? detailPhotos[selectedDetailPhotoIndex] : null;

    useEffect(() => {
        if (!selectedDetailPhotoId) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setSelectedDetailPhotoId(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedDetailPhotoId]);

    const completion = useMemo(() => {
        const values = [
            image,
            formData.nama_umkm,
            formData.jenis_makanan,
            formData.harga_range,
            formData.jam_operasional,
            formData.alamat_teks,
            formData.deskripsi,
            detailPhotoCount > 0,
        ];
        const filled = values.filter((value) => (
            typeof value === 'string' ? value.trim() : Boolean(value)
        )).length;

        return {
            filled,
            percentage: Math.round((filled / values.length) * 100),
            total: values.length,
        };
    }, [detailPhotoCount, formData, image]);

    const coordinateLabel = `${Number(formData.latitude).toFixed(5)}, ${Number(formData.longitude).toFixed(5)}`;

    useEffect(() => {
        if (!submitNotice || submitNotice.type === 'success') return undefined;

        const timeout = window.setTimeout(() => {
            setSubmitNotice(null);
        }, 5200);

        return () => window.clearTimeout(timeout);
    }, [submitNotice]);

    const showSubmitNotice = (nextNotice) => {
        setSubmitNotice(nextNotice);
        window.requestAnimationFrame(() => {
            document.querySelector('.add-submit-notice')?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        });
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            setImage(null);
            setPreview(null);
            return;
        }

        try {
            const optimizedFile = await optimizeImageFile(file, { maxBytes: 420 * 1024 });
            setImage(optimizedFile);
            setPreview(URL.createObjectURL(optimizedFile));
        } catch {
            showSubmitNotice({
                type: 'warning',
                title: 'Foto tidak dapat diproses',
                message: 'Gunakan foto JPG, PNG, atau WEBP lain lalu coba kembali.',
            });
        }
    };

    const handleDetailPhotoChange = async (event) => {
        const selectedFiles = Array.from(event.target.files || [])
            .filter((file) => file.type.startsWith('image/'));

        if (selectedFiles.length === 0) {
            event.target.value = '';
            return;
        }

        try {
            const optimizedFiles = await optimizeImageFiles(selectedFiles, { maxBytes: 320 * 1024 });
            setDetailPhotos((current) => {
            const remainingSlots = Math.max(MAX_DETAIL_PHOTOS - current.length, 0);
            const nextFiles = optimizedFiles.slice(0, remainingSlots).map((file, index) => ({
                id: `${Date.now()}-${index}-${file.name}`,
                file,
                preview: URL.createObjectURL(file),
            }));

            return [...current, ...nextFiles];
            });
        } catch {
            showSubmitNotice({
                type: 'warning',
                title: 'Foto detail tidak dapat diproses',
                message: 'Periksa format gambar lalu coba tambahkan kembali.',
            });
        }
        event.target.value = '';
    };

    const handleRemoveDetailPhoto = (id) => {
        if (id === selectedDetailPhotoId) setSelectedDetailPhotoId(null);

        setDetailPhotos((current) => {
            const photo = current.find((item) => item.id === id);
            if (photo?.preview) URL.revokeObjectURL(photo.preview);
            return current.filter((item) => item.id !== id);
        });
    };

    const handleChange = (field) => (event) => {
        setFormData((current) => ({ ...current, [field]: event.target.value }));
    };

    const handleLocationPick = async ({ lat, lng }) => {
        setPosition([lat, lng]);
        setAddressStatus('Mencari alamat dari titik yang dipilih...');
        setFormData((current) => ({
            ...current,
            latitude: lat,
            longitude: lng,
        }));

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (!response.ok) throw new Error('Reverse geocode gagal');

            const data = await response.json();
            setFormData((current) => ({
                ...current,
                alamat_teks: data.display_name || current.alamat_teks,
            }));
            setAddressStatus(data.display_name ? 'Alamat otomatis diperbarui.' : 'Titik dipilih, alamat bisa ditulis manual.');
        } catch {
            setAddressStatus('Titik dipilih, alamat bisa ditulis manual.');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!image) {
            showSubmitNotice({
                type: 'warning',
                title: 'Foto utama belum dipilih',
                message: 'Tambahkan foto utama UMKM dulu agar admin bisa memverifikasi tampilan tempat atau makanannya.',
            });
            return;
        }

        if (!formData.nama_umkm.trim()) {
            showSubmitNotice({
                type: 'warning',
                title: 'Nama UMKM belum diisi',
                message: 'Isi nama UMKM agar data yang masuk ke antrean admin mudah dikenali.',
            });
            return;
        }

        if (!formData.jenis_makanan.trim()) {
            showSubmitNotice({
                type: 'warning',
                title: 'Kategori belum dipilih',
                message: 'Pilih kategori Makanan berat, Snacks & Dessert, atau Drinks supaya UMKM masuk feed yang tepat.',
            });
            return;
        }

        const data = new FormData();
        data.append('image', image);
        data.append('nama_umkm', formData.nama_umkm.trim());
        data.append('jenis_makanan', formData.jenis_makanan.trim());
        data.append('harga_range', formData.harga_range.trim());
        data.append('jam_operasional', formData.jam_operasional.trim());
        data.append('alamat_teks', formData.alamat_teks.trim());
        data.append('deskripsi', formData.deskripsi.trim());
        data.append('latitude', formData.latitude);
        data.append('longitude', formData.longitude);
        detailPhotos.forEach((photo) => {
            if (photo?.file) data.append('detail_images', photo.file);
        });

        setIsSubmitting(true);
        setSubmitNotice(null);
        try {
            const response = await apiClient.post('/umkm', data);
            window.dispatchEvent(new Event('umkm-updated'));
            window.dispatchEvent(new Event('notifications-updated'));
            showSubmitNotice({
                type: 'success',
                title: 'UMKM masuk antrean admin',
                message: response.data?.message || 'UMKM berhasil dikirim. Admin akan memverifikasi data, foto, dan lokasi sebelum tampil di feed.',
                primaryAction: {
                    label: 'Lihat UMKM Saya',
                    onClick: () => navigate('/umkm-saya'),
                },
                secondaryAction: {
                    label: 'Tetap di sini',
                    onClick: () => setSubmitNotice(null),
                },
            });
        } catch (err) {
            showSubmitNotice({
                type: 'error',
                title: 'UMKM belum terkirim',
                message: err.response?.data?.message || 'Gagal menambahkan UMKM. Periksa koneksi dan data yang diisi, lalu coba lagi.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="add-page">
            <AppNavbar
                active="tambah"
                isLoggedIn={isLoggedIn}
                showWorkspaceLinks
            />

            <SubmitNotice notice={submitNotice} onClose={() => setSubmitNotice(null)} />

            <header className="add-hero">
                <div className="add-hero-copy">
                    <span className="add-kicker">Tambah rekomendasi baru</span>
                    <h1>Tambah UMKM</h1>
                    <p>
                        Lengkapi data tempat makan favorit supaya tampil jelas di feed rekomendasi kampus.
                    </p>
                </div>

                <div className="add-progress-card" aria-label="Kelengkapan data">
                    <span>Progress data</span>
                    <strong>{completion.percentage}% lengkap</strong>
                    <small>{completion.filled}/{completion.total} bagian sudah terisi</small>
                    <div className="add-progress-track">
                        <span style={{ width: `${completion.percentage}%` }} />
                    </div>
                </div>
            </header>

            <div className="add-step-row" aria-label="Urutan pengisian data">
                <StepCard number="01" title="Informasi" description="Nama, jenis, harga, jam buka" />
                <StepCard number="02" title="Foto" description="Foto utama, menu, tempat, makanan" />
                <StepCard number="03" title="Lokasi" description="Alamat dan titik peta UMKM" />
            </div>

            <form className="add-layout" onSubmit={handleSubmit}>
                <div className="add-main-column">
                    <section className="add-panel add-form-panel">
                        <SectionTitle
                            number="01"
                            title="Informasi UMKM"
                            description="Nama, kategori, kisaran harga, jam operasional, dan cerita singkat tempatnya."
                        />

                        <div className="add-field-grid">
                            <Field label="Nama UMKM" required>
                                <input
                                    value={formData.nama_umkm}
                                    onChange={handleChange('nama_umkm')}
                                    placeholder="Contoh: Warung Nasi Ibu Rina"
                                    required
                                />
                            </Field>

                            <Field label="Jenis makanan" required>
                                <CategoryDropdown
                                    value={formData.jenis_makanan}
                                    options={FOOD_TYPE_OPTIONS}
                                    placeholder="Pilih kategori"
                                    onChange={(value) => setFormData((current) => ({ ...current, jenis_makanan: value }))}
                                />
                            </Field>

                            <div className="add-chip-field">
                                <span>Pilihan cepat</span>
                                <div className="add-chip-list">
                                    {FOOD_TYPE_OPTIONS.map((option) => (
                                        <button
                                            key={option}
                                            className={formData.jenis_makanan === option ? 'is-selected' : ''}
                                            type="button"
                                            onClick={() => setFormData((current) => ({ ...current, jenis_makanan: option }))}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Field label="Kisaran harga">
                                <input
                                    list="price-range-options"
                                    value={formData.harga_range}
                                    onChange={handleChange('harga_range')}
                                    placeholder="Pilih atau tulis harga sendiri"
                                />
                                <datalist id="price-range-options">
                                    {PRICE_OPTIONS.map((option) => (
                                        <option key={option} value={option} />
                                    ))}
                                </datalist>
                            </Field>

                            <Field label="Jam operasional">
                                <input
                                    list="operating-hour-options"
                                    value={formData.jam_operasional}
                                    onChange={handleChange('jam_operasional')}
                                    placeholder="Contoh: 08.00 - 21.00"
                                />
                                <datalist id="operating-hour-options">
                                    {OPERATING_HOUR_OPTIONS.map((option) => (
                                        <option key={option} value={option} />
                                    ))}
                                </datalist>
                            </Field>

                            <Field label="Deskripsi singkat" wide>
                                <textarea
                                    value={formData.deskripsi}
                                    onChange={handleChange('deskripsi')}
                                    placeholder="Ceritakan menu andalan, suasana, atau alasan tempat ini direkomendasikan."
                                    rows="5"
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="add-panel add-location-panel">
                        <SectionTitle
                            number="03"
                            title="Lokasi UMKM"
                            description="Pilih titik di peta, lalu rapikan alamat jika perlu."
                        />

                        <div className="add-location-grid">
                            <Field label="Alamat lengkap" required>
                                <input
                                    value={formData.alamat_teks}
                                    onChange={handleChange('alamat_teks')}
                                    placeholder="Masukkan alamat atau pilih titik pada peta"
                                    required
                                />
                            </Field>

                            <div className="add-location-note">
                                <span>Titik peta</span>
                                <strong>{coordinateLabel}</strong>
                            </div>
                        </div>

                        <div className="add-map-shell">
                            <MapContainer center={position} zoom={13} className="add-map">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker position={position} onLocationPick={handleLocationPick} />
                            </MapContainer>
                        </div>

                        <div className="add-location-meta" aria-live="polite">
                            <span>{addressStatus}</span>
                            <strong>{coordinateLabel}</strong>
                        </div>
                    </section>

                    <div className="add-action-bar add-action-bar--desktop">
                        <button className="add-secondary-button" type="button" onClick={() => navigate('/')}>
                            <span className="add-cancel-icon" aria-hidden="true" />
                            <span>Batal</span>
                        </button>
                        <button className="add-primary-button" type="submit" disabled={isSubmitting}>
                            <span className="add-submit-icon" aria-hidden="true" />
                            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan UMKM'}</span>
                        </button>
                    </div>
                </div>

                <aside id="add-photo-sidebar" className="add-sidebar">
                    <section className="add-panel add-upload-panel">
                        <SectionTitle
                            number="02"
                            title="Foto utama"
                            description="Pakai foto makanan, etalase, atau tampilan depan UMKM."
                        />

                        <label className={preview ? 'add-upload is-filled' : 'add-upload'}>
                            {preview ? (
                                <>
                                    <img src={preview} alt="Preview UMKM" />
                                    <span className="add-upload-change">Ganti foto</span>
                                </>
                            ) : (
                                <span className="add-upload-empty">
                                    <span className="add-upload-icon" aria-hidden="true" />
                                    <strong>Pilih gambar</strong>
                                    <small>JPG atau PNG</small>
                                </span>
                            )}
                            <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                        </label>
                    </section>

                    <section className="add-panel add-detail-photo-panel">
                        <SectionTitle
                            number="02"
                            title="Foto detail"
                            description="Tambahkan menu, makanan, etalase, atau suasana tempat dari satu input."
                        />

                        <label className={detailPhotoCount >= MAX_DETAIL_PHOTOS ? 'add-detail-upload is-disabled' : 'add-detail-upload'}>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                disabled={detailPhotoCount >= MAX_DETAIL_PHOTOS}
                                onChange={handleDetailPhotoChange}
                            />
                            <span className="add-detail-upload-icon" aria-hidden="true" />
                            <span>
                                <strong>{detailPhotoCount >= MAX_DETAIL_PHOTOS ? 'Galeri sudah penuh' : 'Tambah foto detail'}</strong>
                                <small>Pilih beberapa gambar sekaligus atau tambahkan bertahap.</small>
                            </span>
                        </label>

                        <div className={detailPhotoCount > 0 ? 'add-detail-photo-grid' : 'add-detail-photo-grid is-empty'}>
                            {detailPhotoCount > 0 ? detailPhotos.map((photo, index) => (
                                <figure className="add-detail-photo-card" key={photo.id}>
                                    <button
                                        className="add-detail-photo-preview-button"
                                        type="button"
                                        aria-label={`Lihat foto detail ${index + 1}`}
                                        onClick={() => setSelectedDetailPhotoId(photo.id)}
                                    >
                                        <img src={photo.preview} alt={`Detail UMKM ${index + 1}`} />
                                        <span aria-hidden="true" />
                                    </button>
                                    <figcaption>
                                        <span>Foto {index + 1}</span>
                                        <button type="button" onClick={() => handleRemoveDetailPhoto(photo.id)}>
                                            Hapus
                                        </button>
                                    </figcaption>
                                </figure>
                            )) : (
                                <div className="add-detail-empty-card">
                                    <strong>Belum ada foto detail</strong>
                                    <span>Galeri kecil akan muncul di sini setelah gambar dipilih.</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="add-panel add-preview-panel" aria-label="Preview kartu UMKM">
                        <span className="add-preview-label">Preview kartu</span>
                        <div className="add-preview-image">
                            {preview ? <img src={preview} alt="" /> : <span />}
                        </div>
                        <div className="add-preview-copy">
                            <span>{formData.jenis_makanan || 'Kuliner'}</span>
                            <strong>{formData.nama_umkm || 'Nama UMKM'}</strong>
                            <div className="add-preview-meta">
                                <small>{formData.harga_range || 'Harga belum diatur'}</small>
                                <small>{formData.jam_operasional || 'Jam belum diatur'}</small>
                            </div>
                            <p>{formData.alamat_teks || formData.deskripsi || 'Alamat atau deskripsi akan tampil di sini.'}</p>
                        </div>
                    </section>
                </aside>

                <div className="add-action-bar add-action-bar--mobile">
                    <button className="add-secondary-button" type="button" onClick={() => navigate('/')}>
                        <span className="add-cancel-icon" aria-hidden="true" />
                        <span>Batal</span>
                    </button>
                    <button className="add-primary-button" type="submit" disabled={isSubmitting}>
                        <span className="add-submit-icon" aria-hidden="true" />
                        <span>{isSubmitting ? 'Menyimpan...' : 'Simpan UMKM'}</span>
                    </button>
                </div>
            </form>

            {selectedDetailPhoto && (
                <div
                    className="add-photo-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Preview foto detail ${selectedDetailPhotoIndex + 1}`}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSelectedDetailPhotoId(null);
                    }}
                >
                    <div className="add-photo-lightbox-card">
                        <button
                            className="add-photo-lightbox-close"
                            type="button"
                            aria-label="Tutup preview foto"
                            onClick={() => setSelectedDetailPhotoId(null)}
                        />
                        <img src={selectedDetailPhoto.preview} alt={`Preview foto detail ${selectedDetailPhotoIndex + 1}`} />
                        <div className="add-photo-lightbox-meta">
                            <span>Foto detail</span>
                            <strong>{selectedDetailPhotoIndex + 1} dari {detailPhotoCount}</strong>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

const SectionTitle = ({ number, title, description }) => (
    <div className="add-section-title">
        <span>{number}</span>
        <div>
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
    </div>
);

const StepCard = ({ number, title, description }) => (
    <div className="add-step-card">
        <span>{number}</span>
        <strong>{title}</strong>
        <small>{description}</small>
    </div>
);

const SubmitNotice = ({ notice, onClose }) => {
    if (!notice) return null;

    return (
        <div className={`add-submit-notice is-${notice.type}`} role="status" aria-live="polite">
            <span className="add-submit-notice-icon" aria-hidden="true" />
            <div className="add-submit-notice-copy">
                <strong>{notice.title}</strong>
                <p>{notice.message}</p>
                {(notice.primaryAction || notice.secondaryAction) && (
                    <div className="add-submit-notice-actions">
                        {notice.secondaryAction && (
                            <button type="button" onClick={notice.secondaryAction.onClick}>
                                {notice.secondaryAction.label}
                            </button>
                        )}
                        {notice.primaryAction && (
                            <button type="button" onClick={notice.primaryAction.onClick}>
                                {notice.primaryAction.label}
                            </button>
                        )}
                    </div>
                )}
            </div>
            <button className="add-submit-notice-close" type="button" onClick={onClose} aria-label="Tutup notifikasi" />
        </div>
    );
};

const Field = ({ label, children, required = false, wide = false }) => (
    <label className={wide ? 'add-field is-wide' : 'add-field'}>
        <span>
            {label}
            {required && <small>*</small>}
        </span>
        {children}
    </label>
);

const CategoryDropdown = ({ value, options, placeholder, onChange }) => {
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
        <div className={isOpen ? 'add-category-dropdown is-open' : 'add-category-dropdown'} ref={dropdownRef}>
            <button
                className="add-category-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
            >
                <span className={value ? '' : 'is-placeholder'}>{value || placeholder}</span>
                <i aria-hidden="true" />
            </button>

            {isOpen && (
                <div className="add-category-menu" role="listbox">
                    {options.map((option) => (
                        <button
                            className={value === option ? 'add-category-option is-selected' : 'add-category-option'}
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

const LocationMarker = ({ position, onLocationPick }) => {
    useMapEvents({
        click(event) {
            onLocationPick(event.latlng);
        },
    });

    return <Marker position={position} />;
};

export default AddUMKM;
