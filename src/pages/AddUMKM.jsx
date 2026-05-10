import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import apiClient from '../api/apiClient';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const AddUMKM = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [position, setPosition] = useState([-4.01, 119.62]);
    const [formData, setFormData] = useState({
        nama_umkm: '',
        jenis_makanan: '',
        harga_range: '',
        alamat_teks: '',
        deskripsi: '',
        latitude: -4.01,
        longitude: 119.62
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };
    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Komponen Klik Map
    const LocationMarker = () => {
        useMapEvents({
            async click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();

                    setFormData(prev => ({ ...prev, alamat_teks: data.display_name || '' }));
                } catch (err) {
                    console.error("Gagal ambil alamat", err);
                }
            },
        });
        return <Marker position={position} />;
    };

    const handleSubmit = async () => {

        console.log('=== SUBMIT DEBUG ===');
        console.log('formData:', formData);
        console.log('image:', image);

        if (!image) return alert("Gambar wajib diisi!");
        if (!formData.nama_umkm.trim()) return alert("Nama UMKM wajib diisi!");

        const data = new FormData();
        data.append('image', image);
        data.append('nama_umkm', formData.nama_umkm);
        data.append('jenis_makanan', formData.jenis_makanan);
        data.append('harga_range', formData.harga_range);
        data.append('alamat_teks', formData.alamat_teks);
        data.append('deskripsi', formData.deskripsi);
        data.append('latitude', formData.latitude);
        data.append('longitude', formData.longitude);

        console.log('=== FORM DATA ENTRIES ===');
        for (let [key, value] of data.entries()) {
            console.log(key, ':', value);
        }

        try {
            await apiClient.post('/umkm', data);
            alert('UMKM Berhasil Ditambahkan!');
            navigate('/');
        } catch (err) {
            console.error('Error submit:', err);
            alert(err.response?.data?.message || 'Gagal Menambahkan UMKM');
        }
    };

    return (
        <div style={ui.page}>
            <nav style={ui.navbar}>
                <div style={ui.navLinks}>
                    <button onClick={() => navigate('/')} style={ui.navBtn}>BERANDA</button>
                    <button style={ui.navBtn}>FEED</button>
                    <button style={ui.activeBtn}>TAMBAHKAN UMKM</button>
                </div>
            </nav>

            <div style={ui.container}>
                <h1 style={ui.mainTitle}>TAMBAHKAN UMKM</h1>

                {/* UPLOAD SECTION */}
                <div style={ui.uploadSection}>
                    <label style={ui.uploadBox}>
                        {preview
                            ? <img src={preview} style={ui.previewImg} alt="preview" />
                            : <p>UPLOAD GAMBAR</p>
                        }
                        <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    </label>
                </div>

                {/* FORM SECTION */}
                <div style={ui.formWrapper}>
                    <h2 style={ui.formTitle}>ISI INFORMASI UMKM</h2>
                    <div style={ui.formBorder}>
                        <div style={ui.inputGroup}>
                            <label>NAMA :</label>
                            <input
                                style={ui.input}
                                value={formData.nama_umkm}
                                onChange={handleChange('nama_umkm')}
                            />
                        </div>
                        <div style={ui.inputGroup}>
                            <label>JENIS :</label>
                            <input
                                style={ui.input}
                                value={formData.jenis_makanan}
                                onChange={handleChange('jenis_makanan')}
                            />
                        </div>
                        <div style={ui.inputGroup}>
                            <label>HARGA :</label>
                            <input
                                style={ui.input}
                                value={formData.harga_range}
                                onChange={handleChange('harga_range')}
                            />
                        </div>
                        <div style={ui.inputGroup}>
                            <label>DESKRIPSI :</label>
                            <input
                                style={ui.input}
                                value={formData.deskripsi}
                                onChange={handleChange('deskripsi')}
                            />
                        </div>
                        <div style={ui.inputGroup}>
                            <label>LOKASI UMKM :</label>
                            <input
                                style={ui.input}
                                value={formData.alamat_teks}
                                onChange={handleChange('alamat_teks')}
                            />
                        </div>

                        {/* MAP AREA */}
                        <div style={ui.mapContainer}>
                            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker />
                            </MapContainer>
                        </div>

                        <div style={ui.rowBtns}>
                            <button style={ui.smallGreen}>Konfirmasi alamat</button>
                            <button style={ui.smallRed} onClick={() => navigate('/')}>Batal</button>
                        </div>
                    </div>
                </div>

                {/* FINAL BUTTONS */}
                <div style={ui.finalRow}>
                    <button style={ui.bigGreen} onClick={handleSubmit}>Konfirmasi</button>
                    <button style={ui.bigRed} onClick={() => navigate('/')}>Batal</button>
                </div>
            </div>
        </div>
    );
};

const ui = {
    page: { backgroundColor: '#fff', minHeight: '100vh', color: '#000', paddingBottom: '50px' },
    navbar: { display: 'flex', justifyContent: 'center', padding: '20px', borderBottom: '1px solid #eee' },
    navLinks: { display: 'flex', gap: '30px' },
    navBtn: { background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', color: '#666' },
    activeBtn: { background: 'none', border: 'none', fontWeight: '700', borderBottom: '2px solid #000', cursor: 'pointer' },
    container: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px' },
    mainTitle: { fontSize: '42px', fontWeight: '900', marginBottom: '30px' },
    uploadSection: { border: '1px solid #ddd', padding: '50px', display: 'flex', justifyContent: 'center', marginBottom: '40px' },
    uploadBox: { width: '220px', height: '220px', border: '1px solid #ccc', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', textAlign: 'center', fontSize: '12px' },
    previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
    formWrapper: { marginTop: '20px' },
    formTitle: { fontSize: '20px', fontWeight: '800', marginBottom: '15px' },
    formBorder: { border: '1px solid #ddd', padding: '25px' },
    inputGroup: { display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '15px' },
    input: { flex: 1, padding: '8px', border: '1px solid #ccc', outline: 'none' },
    mapContainer: { height: '250px', width: '100%', marginTop: '15px', border: '1px solid #ddd' },
    rowBtns: { display: 'flex', gap: '10px', marginTop: '15px' },
    smallGreen: { backgroundColor: '#7CFC00', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    smallRed: { backgroundColor: '#FF0000', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    finalRow: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' },
    bigGreen: { backgroundColor: '#7CFC00', border: 'none', padding: '10px 50px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' },
    bigRed: { backgroundColor: '#FF0000', border: 'none', color: '#fff', padding: '10px 50px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }
};

export default AddUMKM;