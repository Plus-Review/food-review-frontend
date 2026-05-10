import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";

const Home = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [umkmList, setUmkmList] = useState([]);

    useEffect(() => {
        const fetchUMKM = async () => {
            try {
                const response = await apiClient.get('/umkm');
                setUmkmList(response.data);
            } catch (err) {
                console.error("Gagal mengambil data UMKM", err);
            }
        };
        fetchUMKM();
    }, []);
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: '#000' }}>
            <nav style={styles.navbar}>
                <div style={styles.navLinks}>
                    <button onClick={() => navigate('/')} style={styles.activeNavLink}>BERANDA</button>
                    <button onClick={() => navigate('/feed')} style={styles.navLink}>FEED</button>
                    <button onClick={() => navigate('/tambah')} style={styles.navLink}>TAMBAHKAN UMKM</button>
                </div>
                <div style={styles.profileContainer}>
                    <div 
                        style={styles.profileCircle} 
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        F
                    </div>
                    {showDropdown && (
                        <div style={styles.dropdownMenu}>
                            <div style={styles.dropdownItem} onClick={() => navigate('/profil')}>Profil Saya</div>
                            <div style={styles.dropdownItem} onClick={() => navigate('/favorit')}>Favorit</div>
                            <div style={{ ...styles.dropdownItem, color: 'red' }} onClick={handleLogout}>Logout</div>
                        </div>
                    )}
                </div>
            </nav>
            <div style={styles.hero}>
                <div style={styles.searchContainer}>
                    <input type="text" placeholder="TEMUKAN WARUNG" style={styles.searchInput} />
                    <span style={styles.searchIcon}>🔍</span>
                </div>
                <h1 style={styles.heroTitle}>SELAMAT DATANG</h1>
            </div>
            <div style={styles.container}>
                <header style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>TERPOPULER</h2>
                    <div style={styles.arrowIcon}>→</div>
                </header>

                <div style={styles.grid}>
                    {umkmList.length > 0 ? (
                        umkmList.map((item) => (
                            <UMKMCard key={item.id} item={item} navigate={navigate} />
                        ))
                    ) : (
                        <p style={{ color: '#999' }}>Belum ada UMKM yang ditambahkan.</p>
                    )}
                </div>
                <header style={{ ...styles.sectionHeader, marginTop: '50px' }}>
                    <h2 style={styles.sectionTitle}>REVIEW TERBARU</h2>
                    <div style={styles.arrowIcon}>→</div>
                </header>

                <div style={styles.grid}>
                    {[...umkmList].reverse().map((item) => (
                        <UMKMCard key={item.id + '-rev'} item={item} navigate={navigate} />
                    ))}
                </div>

            </div>
        </div>
    );
};

    const UMKMCard = ({ item, navigate }) => {
    const imagePath = item.image 
        ? `${BASE_URL}/uploads/${item.image}` 
        : "https://via.placeholder.com/300x200?text=No+Image";

    return (
        <div style={styles.card} onClick={() => navigate(`/umkm/${item.id}`)}>
            <img src={imagePath} alt={item.nama_umkm} style={styles.cardImg} />
            <h3 style={styles.cardTitle}>{item.nama_umkm}</h3>
            <p style={styles.cardPrice}>{item.harga_range || 'Harga belum tersedia'}</p>
            <p style={styles.cardRating}>★ {item.avg_rating || '0.0'}</p>
        </div>
    );
};

const styles = {
    navbar: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '20px', borderBottom: '1px solid #eee', position: 'relative', backgroundColor: '#fff'
    },
    navLinks: { display: 'flex', gap: '35px' },
    navLink: { background: 'none', border: 'none', color: '#666', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    activeNavLink: { background: 'none', border: 'none', color: '#000', fontSize: '14px', fontWeight: '700', borderBottom: '2px solid #000', paddingBottom: '5px' },
    
    profileContainer: { position: 'absolute', right: '50px' },
    profileCircle: {
        backgroundColor: '#333', color: '#fff', width: '38px', height: '38px', 
        borderRadius: '50%', display: 'flex', justifyContent: 'center', 
        alignItems: 'center', fontWeight: 'bold', cursor: 'pointer'
    },
    dropdownMenu: {
        position: 'absolute', top: '45px', right: '0', backgroundColor: '#fff',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: '10px',
        width: '160px', zIndex: 100, border: '1px solid #f0f0f0', overflow: 'hidden'
    },
    dropdownItem: {
        padding: '12px 15px', fontSize: '13px', cursor: 'pointer', textAlign: 'left',
        borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s'
    },

    hero: {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000")',
        height: '420px', backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
    },
    searchContainer: { position: 'relative', width: '90%', maxWidth: '500px', marginBottom: '20px' },
    searchInput: {
        width: '100%', padding: '15px 25px', borderRadius: '30px', border: 'none',
        fontSize: '14px', outline: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    },
    searchIcon: { position: 'absolute', right: '25px', top: '15px', color: '#999' },
    heroTitle: { color: '#fff', fontSize: '48px', fontWeight: '900', letterSpacing: '2px' },

    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
    sectionTitle: { fontSize: '24px', fontWeight: '800' },
    arrowIcon: { 
        backgroundColor: '#f0f0f0', borderRadius: '50%', width: '35px', height: '35px', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' 
    },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px'
    },
    card: { cursor: 'pointer', transition: 'transform 0.2s' },
    cardImg: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '15px', marginBottom: '12px' },
    cardTitle: { fontSize: '17px', fontWeight: '700', marginBottom: '4px' },
    cardPrice: { fontSize: '13px', color: '#666', marginBottom: '4px' },
    cardRating: { fontSize: '13px', fontWeight: '600' }
};

export default Home;