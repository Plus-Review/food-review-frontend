import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const BASE_URL = "http://localhost:5000";
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=600&auto=format&fit=crop';

/* ─────────────────────────────────────────────
   IKON SVG MURNI (Dioptimalkan)
───────────────────────────────────────────── */
const SvgIcon = memo(({ children, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
));
const CheckCircle = (props) => <SvgIcon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>;
const XCircle = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></SvgIcon>;
const Trash2 = (props) => <SvgIcon {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></SvgIcon>;
const ShieldCheck = (props) => <SvgIcon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></SvgIcon>;
const Clock = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
const Eye = (props) => <SvgIcon {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
const MapPin = (props) => <SvgIcon {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></SvgIcon>;
const Info = (props) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></SvgIcon>;
const Edit2 = (props) => <SvgIcon {...props}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></SvgIcon>;
const Save = (props) => <SvgIcon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></SvgIcon>;

/* Ikon Analitik */
const Users = (props) => <SvgIcon {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>;
const Store = (props) => <SvgIcon {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgIcon>;
const MessageSquare = (props) => <SvgIcon {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgIcon>;

/* ─────────────────────────────────────────────
   KOMPONEN KARTU UMKM
───────────────────────────────────────────── */
const UmkmCard = memo(({ item, isActive, onView, onDelete }) => (
    <div className="admin-card">
        <div className="card-image-box">
            <img src={item.image ? `${BASE_URL}/uploads/${item.image}` : FALLBACK_IMAGE} alt="UMKM" loading="lazy" />
            <div className="card-overlay"></div>
            <div className={`badge-status ${isActive ? 'active' : 'pending'}`}>
                {isActive ? 'Live' : 'Pending'}
            </div>
        </div>
        <div className="card-content">
            <div className="card-meta">
                <span className="meta-category">{item.kategori || 'Umum'}</span>
                <span className="meta-date">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
            <h3 className="card-title">{item.nama_umkm}</h3>
            <p className="card-text">{item.deskripsi || 'Tidak ada deskripsi'}</p>
        </div>
        <div className="card-actions">
            <button className="action-btn primary" onClick={() => onView(item)}>
                <Eye /> {isActive ? 'Detail & Edit' : 'Tinjau'}
            </button>
            {isActive && (
                <button className="action-btn danger-icon" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Hapus">
                    <Trash2 />
                </button>
            )}
        </div>
    </div>
));

/* ─────────────────────────────────────────────
   KOMPONEN UTAMA DASHBOARD
───────────────────────────────────────────── */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    
    const [pendingUmkms, setPendingUmkms] = useState([]);
    const [approvedUmkms, setApprovedUmkms] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalReviews: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState(null);
    
    const [selectedUmkm, setSelectedUmkm] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [pendingRes, approvedRes, statsRes] = await Promise.all([
                apiClient.get('/umkm/admin/pending'),
                apiClient.get('/umkm'),
                apiClient.get('/umkm/admin/stats').catch(() => ({ data: null })) // Mencegah error jika API stats belum siap
            ]);
            
            setPendingUmkms(pendingRes.data);
            setApprovedUmkms(approvedRes.data);
            
            if (statsRes.data) {
                setStats({ totalUsers: statsRes.data.totalUsers, totalReviews: statsRes.data.totalReviews });
            }
        } catch (error) {
            showNotice('error', 'Gagal memuat data dashboard.');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotice = (type, message) => {
        setNotice({ type, message });
        setTimeout(() => setNotice(null), 3000);
    };

    const handleVerify = async (id, actionStatus) => {
        if (!window.confirm(actionStatus === 'approved' ? 'Setujui dan tayangkan UMKM ini?' : 'Tolak dan buang UMKM ini?')) return;
        try {
            await apiClient.put(`/umkm/${id}/verify`, { status: actionStatus });
            showNotice('success', `UMKM berhasil di-${actionStatus}!`);
            setSelectedUmkm(null);
            fetchDashboardData();
        } catch (error) {
            showNotice('error', `Gagal mengubah status UMKM.`);
        }
    };

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Hapus UMKM ini secara permanen?')) return;
        try {
            await apiClient.delete(`/umkm/${id}`);
            showNotice('success', 'UMKM berhasil dihapus.');
            fetchDashboardData();
            setSelectedUmkm(null);
        } catch (error) {
            showNotice('error', 'Gagal menghapus UMKM.');
        }
    }, []);

    const handleOpenModal = useCallback((item) => {
        setSelectedUmkm(item);
        setIsEditing(false);
        setEditForm({
            nama_umkm: item.nama_umkm || '',
            kategori: item.kategori || '',
            deskripsi: item.deskripsi || '',
            alamat_teks: item.alamat_teks || '',
            harga_range: item.harga_range || ''
        });
    }, []);

    const handleSaveEdit = async () => {
        try {
            const formData = new FormData();
            formData.append('nama_umkm', editForm.nama_umkm);
            formData.append('kategori', editForm.kategori);
            formData.append('deskripsi', editForm.deskripsi);
            formData.append('alamat_teks', editForm.alamat_teks);
            formData.append('harga_range', editForm.harga_range);

            await apiClient.put(`/umkm/${selectedUmkm.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            showNotice('success', 'Data UMKM berhasil diperbarui!');
            setIsEditing(false);
            fetchDashboardData();
            setSelectedUmkm(prev => ({ ...prev, ...editForm }));
        } catch (error) {
            showNotice('error', 'Gagal menyimpan perubahan.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="dash-wrapper">
            <style dangerouslySetInnerHTML={{ __html: adminCSS }} />

            {/* Navbar */}
            <nav className="dash-nav glass-nav">
                <div className="dash-logo" onClick={() => navigate('/')}>
                    Plus<span>Review</span> <div className="tag-admin">KENDALI ADMIN</div>
                </div>
                <button className="btn-logout" onClick={handleLogout}>Keluar Sesi</button>
            </nav>

            {notice && (
                <div className={`notice-toast ${notice.type}`}>
                    <span>{notice.message}</span>
                </div>
            )}

            {/* Header Hero */}
            <header className="dash-hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>Pusat Moderasi Data</h1>
                        <p>Kelola direktori UMKM, tinjau pendaftaran baru, dan jaga kualitas platform.</p>
                    </div>
                </div>
            </header>

            <main className="dash-main">
                {/* 🌟 STATISTIK ANALITIK (NEW) */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="icon-wrap blue"><Users size={22}/></div>
                        <div className="stat-info">
                            <span className="stat-label">Pengguna Aktif</span>
                            <h2 className="stat-value">{stats.totalUsers || 0}</h2>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-wrap green"><Store size={22}/></div>
                        <div className="stat-info">
                            <span className="stat-label">UMKM Terdaftar</span>
                            <h2 className="stat-value">{approvedUmkms.length}</h2>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-wrap yellow"><Clock size={22}/></div>
                        <div className="stat-info">
                            <span className="stat-label">Antrean Validasi</span>
                            <h2 className="stat-value">{pendingUmkms.length}</h2>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon-wrap purple"><MessageSquare size={22}/></div>
                        <div className="stat-info">
                            <span className="stat-label">Total Ulasan</span>
                            <h2 className="stat-value">{stats.totalReviews || 0}</h2>
                        </div>
                    </div>
                </div>

                {/* Segmented Control Tabs */}
                <div className="dash-tabs-container">
                    <div className="dash-tabs">
                        <button className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                            <Clock /> Antrean Validasi <span className="tab-badge">{pendingUmkms.length}</span>
                        </button>
                        <button className={`tab-item ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
                            <CheckCircle /> UMKM Aktif <span className="tab-badge alt">{approvedUmkms.length}</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="state-box">
                        <div className="spinner"></div>
                        <p>Mensinkronkan data dari server...</p>
                    </div>
                ) : activeTab === 'pending' ? (
                    pendingUmkms.length > 0 ? (
                        <div className="dash-grid">
                            {pendingUmkms.map(item => (
                                <UmkmCard key={item.id} item={item} isActive={false} onView={handleOpenModal} onDelete={handleDelete} />
                            ))}
                        </div>
                    ) : (
                        <div className="state-box empty">
                            <ShieldCheck size={64} color="#d1d5db" />
                            <h3>Selesai! Tidak ada antrean.</h3>
                            <p>Semua UMKM baru telah divalidasi. Kerja bagus, Admin!</p>
                        </div>
                    )
                ) : (
                    approvedUmkms.length > 0 ? (
                        <div className="dash-grid">
                            {approvedUmkms.map(item => (
                                <UmkmCard key={item.id} item={item} isActive={true} onView={handleOpenModal} onDelete={handleDelete} />
                            ))}
                        </div>
                    ) : (
                        <div className="state-box empty">
                            <p>Belum ada UMKM yang aktif disetujui.</p>
                        </div>
                    )
                )}
            </main>

            {/* 🌟 MODAL DETAIL & EDIT */}
            {selectedUmkm && (
                <div className="modal-overlay" onClick={() => setSelectedUmkm(null)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        
                        <div className="modal-split">
                            <div className="modal-visual">
                                <button className="modal-close-abs" onClick={() => setSelectedUmkm(null)}><XCircle /></button>
                                <div className="visual-image">
                                    <img src={selectedUmkm.image ? `${BASE_URL}/uploads/${selectedUmkm.image}` : FALLBACK_IMAGE} alt="UMKM" />
                                    <div className="visual-overlay"></div>
                                </div>
                                <div className="visual-content">
                                    <span className="v-tag">{selectedUmkm.kategori || 'Kuliner'}</span>
                                    <h2 className="v-title">{selectedUmkm.nama_umkm}</h2>
                                    <div className="v-stats">
                                        <div className="v-stat-box">
                                            <span className="label">Status</span>
                                            <span className={`value ${selectedUmkm.status === 'approved' ? 'text-green' : 'text-gold'}`}>
                                                {selectedUmkm.status === 'approved' ? 'Aktif Tayang' : 'Antrean'}
                                            </span>
                                        </div>
                                        <div className="v-stat-box">
                                            <span className="label">Ulasan</span>
                                            <span className="value">{selectedUmkm.reviews?.length || 0} Review</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-data">
                                <div className="data-header">
                                    <h3>{isEditing ? 'Perbarui Data UMKM' : 'Informasi Detail UMKM'}</h3>
                                    {!isEditing && (
                                        <button className="btn-outline-small" onClick={() => setIsEditing(true)}>
                                            <Edit2 /> Edit Data
                                        </button>
                                    )}
                                </div>

                                <div className="data-body">
                                    {isEditing ? (
                                        <div className="form-grid">
                                            <div className="form-group full">
                                                <label>Nama Warung / UMKM</label>
                                                <input type="text" value={editForm.nama_umkm} onChange={e => setEditForm({...editForm, nama_umkm: e.target.value})} />
                                            </div>
                                            <div className="form-group">
                                                <label>Kategori Utama</label>
                                                <input type="text" value={editForm.kategori} onChange={e => setEditForm({...editForm, kategori: e.target.value})} />
                                            </div>
                                            <div className="form-group">
                                                <label>Rentang Harga</label>
                                                <input type="text" value={editForm.harga_range} placeholder="Cth: Rp 10.000 - Rp 25.000" onChange={e => setEditForm({...editForm, harga_range: e.target.value})} />
                                            </div>
                                            <div className="form-group full">
                                                <label>Alamat Lengkap</label>
                                                <textarea rows="2" value={editForm.alamat_teks} onChange={e => setEditForm({...editForm, alamat_teks: e.target.value})} />
                                            </div>
                                            <div className="form-group full">
                                                <label>Deskripsi & Fasilitas</label>
                                                <textarea rows="4" value={editForm.deskripsi} onChange={e => setEditForm({...editForm, deskripsi: e.target.value})} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="info-grid">
                                            <div className="info-row">
                                                <div className="icon-wrapper"><MapPin /></div>
                                                <div>
                                                    <span className="info-label">Alamat Lengkap</span>
                                                    <p className="info-value">{selectedUmkm.alamat_teks || 'Tidak ada data alamat.'}</p>
                                                </div>
                                            </div>
                                            <div className="info-row">
                                                <div className="icon-wrapper"><Info /></div>
                                                <div>
                                                    <span className="info-label">Deskripsi UMKM</span>
                                                    <p className="info-value box">{selectedUmkm.deskripsi || 'Belum ada deskripsi yang ditambahkan.'}</p>
                                                </div>
                                            </div>
                                            <div className="info-row">
                                                <div className="icon-wrapper" style={{background: '#e6f4ea', color: '#1e8e3e'}}><Clock /></div>
                                                <div>
                                                    <span className="info-label">Rentang Harga</span>
                                                    <p className="info-value price-badge">{selectedUmkm.harga_range || 'Harga belum diatur'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="data-footer">
                                    {isEditing ? (
                                        <>
                                            <button className="btn-text" onClick={() => setIsEditing(false)}>Batal</button>
                                            <button className="btn-solid dark" onClick={handleSaveEdit}><Save /> Simpan Data</button>
                                        </>
                                    ) : selectedUmkm.status !== 'approved' ? (
                                        <>
                                            <button className="btn-solid danger" onClick={() => handleVerify(selectedUmkm.id, 'rejected')}><XCircle /> Tolak Pendaftaran</button>
                                            <button className="btn-solid success" onClick={() => handleVerify(selectedUmkm.id, 'approved')}><CheckCircle /> Setujui & Tayangkan</button>
                                        </>
                                    ) : (
                                        <button className="btn-text" onClick={() => setSelectedUmkm(null)}>Tutup Tinjauan</button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   CSS INJECTION (Eye-Catching & Modern SaaS)
───────────────────────────────────────────── */
const adminCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    .dash-wrapper { font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; padding-bottom: 80px; }
    
    /* Navbar */
    .dash-nav { position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 0 clamp(24px, 5vw, 60px); height: 72px; border-bottom: 1px solid rgba(0,0,0,0.06); }
    .glass-nav { background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
    .dash-logo { font-size: 20px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #1f3f2f; letter-spacing: -0.5px; }
    .dash-logo span { color: #efb84f; }
    .tag-admin { background: linear-gradient(135deg, #1f3f2f, #112219); color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 6px; font-weight: 800; letter-spacing: 0.5px; margin-left: 4px; box-shadow: 0 4px 10px rgba(31,63,47,0.15); }
    .btn-logout { background: transparent; border: 1.5px solid #cbd5e1; color: #475569; padding: 8px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; transition: 0.2s; }
    .btn-logout:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

    /* Hero */
    .dash-hero { background: #1f3f2f; padding: 60px 24px 100px; color: #fff; position: relative; overflow: hidden; }
    .dash-hero::after { content: ''; position: absolute; right: 0; top: 0; width: 50%; height: 100%; background: radial-gradient(circle at top right, rgba(239, 184, 79, 0.15), transparent 70%); pointer-events: none; }
    .hero-content { max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }
    .hero-text h1 { margin: 0 0 10px; font-size: 36px; font-weight: 900; letter-spacing: -1px; }
    .hero-text p { margin: 0; color: #94a3b8; font-size: 16px; font-weight: 500; }

    /* Main Container */
    .dash-main { max-width: 1100px; margin: -60px auto 0; padding: 0 24px; position: relative; z-index: 20; }

    /* 🌟 STATS GRID (NEW) */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card { background: #fff; padding: 20px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px; transition: 0.3s; }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 30px rgba(0,0,0,0.06); }
    .icon-wrap { width: 54px; height: 54px; border-radius: 14px; display: grid; place-items: center; }
    .icon-wrap.blue { background: #eff6ff; color: #3b82f6; }
    .icon-wrap.green { background: #ecfdf5; color: #10b981; }
    .icon-wrap.yellow { background: #fffbeb; color: #f59e0b; }
    .icon-wrap.purple { background: #f5f3ff; color: #8b5cf6; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { margin: 0; font-size: 26px; font-weight: 900; color: #0f172a; line-height: 1; }

    /* Segmented Tabs */
    .dash-tabs-container { display: flex; margin-bottom: 24px; }
    .dash-tabs { display: flex; background: #fff; padding: 6px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; gap: 4px; }
    .tab-item { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border: none; background: transparent; border-radius: 8px; font-weight: 700; color: #64748b; font-size: 14px; cursor: pointer; transition: 0.2s; }
    .tab-item:hover { color: #0f172a; }
    .tab-item.active { background: #1f3f2f; color: #fff; box-shadow: 0 4px 12px rgba(31,63,47,0.15); }
    .tab-badge { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 800; }
    .tab-item.active .tab-badge { background: rgba(255,255,255,0.2); color: #fff; }
    .tab-item.active .tab-badge.alt { background: #efb84f; color: #181714; }

    /* Grid & Cards */
    .dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .admin-card { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
    .admin-card:hover { transform: translateY(-6px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08); border-color: rgba(31,63,47,0.1); }
    
    .card-image-box { position: relative; height: 180px; width: 100%; overflow: hidden; }
    .card-image-box img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .admin-card:hover .card-image-box img { transform: scale(1.05); }
    .card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent 50%); }
    
    .badge-status { position: absolute; top: 16px; right: 16px; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(8px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .badge-status.pending { background: rgba(255, 255, 255, 0.95); color: #b45309; }
    .badge-status.active { background: rgba(31, 63, 47, 0.95); color: #fff; }

    .card-content { padding: 20px; flex: 1; }
    .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .meta-category { font-size: 12px; font-weight: 800; color: #1f3f2f; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
    .meta-date { font-size: 12px; color: #94a3b8; font-weight: 600; }
    .card-title { margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.3; }
    .card-text { margin: 0; font-size: 14px; color: #64748b; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .card-actions { padding: 16px 20px; border-top: 1px solid #f1f5f9; display: flex; gap: 8px; background: #faf8f5; }
    .action-btn { flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 13.5px; cursor: pointer; transition: 0.2s; border: none; }
    .action-btn.primary { background: #1f3f2f; color: #efb84f; }
    .action-btn.primary:hover { background: #152b20; box-shadow: 0 6px 15px rgba(31,63,47,0.2); color: #fff; }
    .action-btn.danger-icon { flex: none; width: 44px; background: #fff; border: 1px solid #fecaca; color: #ef4444; }
    .action-btn.danger-icon:hover { background: #fef2f2; }

    /* State Boxes */
    .state-box { text-align: center; padding: 80px 20px; background: #fff; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); border: 1px dashed #cbd5e1; }
    .state-box.empty { background: rgba(255,255,255,0.5); }
    .state-box h3 { font-size: 22px; font-weight: 800; margin: 20px 0 8px; color: #0f172a; }
    .state-box p { color: #64748b; margin: 0; font-size: 15px; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1f3f2f; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }

    /* 🌟 MODAL SPLIT (High-Contrast Premium) */
    .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; padding: 24px; animation: fadeIn 0.2s ease-out; }
    .modal-container { background: #fff; width: 100%; max-width: 960px; max-height: 90vh; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    
    .modal-split { display: flex; height: 100%; max-height: 90vh; }
    
    /* Left: Visual Dark Theme */
    .modal-visual { width: 360px; background: #0f172a; color: #fff; display: flex; flex-direction: column; position: relative; }
    .modal-close-abs { position: absolute; top: 16px; left: 16px; z-index: 20; background: rgba(0,0,0,0.5); color: #fff; border: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; backdrop-filter: blur(4px); transition: 0.2s; }
    .modal-close-abs:hover { background: #ef4444; transform: scale(1.1); }
    .visual-image { height: 280px; width: 100%; position: relative; }
    .visual-image img { width: 100%; height: 100%; object-fit: cover; }
    .visual-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, #0f172a 100%); }
    
    .visual-content { padding: 0 24px 32px; margin-top: -20px; position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column; }
    .v-tag { align-self: flex-start; background: #efb84f; color: #181714; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 6px; margin-bottom: 16px; }
    .v-title { margin: 0 0 24px; font-size: 28px; font-weight: 900; line-height: 1.2; letter-spacing: -0.5px; }
    .v-stats { display: flex; flex-direction: column; gap: 12px; margin-top: auto; }
    .v-stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; }
    .v-stat-box .label { display: block; font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .v-stat-box .value { font-size: 16px; font-weight: 800; }
    .text-green { color: #4ade80 !important; }
    .text-gold { color: #fcd34d !important; }

    /* Right: Data & Form Light Theme */
    .modal-data { flex: 1; display: flex; flex-direction: column; background: #fff; overflow: hidden; }
    .data-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .data-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; }
    .btn-outline-small { background: #fff; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; gap: 8px; align-items: center; color: #334155; transition: 0.2s; }
    .btn-outline-small:hover { border-color: #1f3f2f; color: #1f3f2f; background: #f8fafc; }

    .data-body { flex: 1; padding: 32px; overflow-y: auto; }
    
    /* View Mode */
    .info-grid { display: flex; flex-direction: column; gap: 24px; }
    .info-row { display: flex; gap: 16px; }
    .icon-wrapper { width: 44px; height: 44px; background: #f1f5f9; color: #64748b; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; }
    .info-label { display: block; font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px; }
    .info-value { margin: 0; font-size: 15px; color: #0f172a; font-weight: 500; line-height: 1.6; }
    .info-value.box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-top: 8px; }
    .price-badge { display: inline-block; font-weight: 800; font-size: 16px; color: #1f3f2f; }

    /* Edit Mode */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; }
    .form-group input, .form-group textarea { width: 100%; padding: 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-family: inherit; font-size: 14px; background: #f8fafc; transition: 0.2s; box-sizing: border-box;}
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #1f3f2f; background: #fff; box-shadow: 0 0 0 3px rgba(31,63,47,0.1); }

    /* Modal Footer */
    .data-footer { padding: 20px 32px; border-top: 1px solid #f1f5f9; background: #f8fafc; display: flex; gap: 12px; justify-content: flex-end; }
    .btn-text { padding: 12px 20px; border: none; background: transparent; font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; border-radius: 10px; }
    .btn-text:hover { background: #e2e8f0; color: #0f172a; }
    .btn-solid { padding: 12px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
    .btn-solid.dark { background: #1f3f2f; color: #efb84f; }
    .btn-solid.dark:hover { background: #152b20; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(31,63,47,0.2); }
    .btn-solid.danger { background: #fff; border: 1px solid #fecaca; color: #ef4444; }
    .btn-solid.danger:hover { background: #fef2f2; }
    .btn-solid.success { background: #10b981; color: #fff; }
    .btn-solid.success:hover { background: #059669; box-shadow: 0 8px 16px rgba(16,185,129,0.2); }

    .notice-toast { position: fixed; top: 90px; right: 24px; z-index: 1200; padding: 14px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.15); animation: fadeIn 0.3s ease; }
    .notice-toast.success { background: #10b981; } .notice-toast.error { background: #ef4444; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

    @media (max-width: 768px) {
        .stats-grid { grid-template-columns: 1fr 1fr; }
        .modal-split { flex-direction: column; max-height: 100vh; overflow-y: auto; }
        .modal-visual { width: 100%; flex: none; }
        .modal-container { max-height: 95vh; border-radius: 16px; }
        .dash-tabs { width: 100%; overflow-x: auto; }
        .tab-item { flex: 1; justify-content: center; white-space: nowrap; }
    }
`;

export default AdminDashboard;