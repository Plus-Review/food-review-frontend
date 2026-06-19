import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminApiClient from '../api/adminApiClient';
import BrandLogo from '../components/BrandLogo';
import './AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setNotice(null);
        setIsSubmitting(true);

        try {
            const { data } = await adminApiClient.post('/login', { username, password });
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
            navigate('/admin/dashboard');
        } catch (error) {
            setNotice(error.response?.data?.message || 'Login admin gagal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="admin-login-page">
            <section className="admin-login-shell">
                <aside className="admin-login-hero">
                    <button className="admin-login-brand" type="button" onClick={() => navigate('/')}>
                        <BrandLogo tone="light" showSubtitle={false} />
                    </button>

                    <div className="admin-login-copy">
                        <span>
                            <ShieldCheck aria-hidden="true" />
                            Admin moderation
                        </span>
                        <h1>Verifikasi UMKM sebelum tampil di feed.</h1>
                        <p>
                            Dashboard ini menjaga data rekomendasi tetap rapi, aman, dan hanya menampilkan UMKM
                            yang sudah lolos review admin.
                        </p>
                    </div>

                    <div className="admin-login-points" aria-label="Fitur admin">
                        <strong>2 akun admin aktif</strong>
                        <span>Approve UMKM baru</span>
                        <span>Review perubahan data</span>
                        <span>Tolak dengan catatan</span>
                    </div>
                </aside>

                <form className="admin-login-card" onSubmit={handleSubmit}>
                    <button className="admin-back-button" type="button" onClick={() => navigate('/')}>
                        <ArrowLeft aria-hidden="true" />
                        <span>Beranda</span>
                    </button>

                    <div className="admin-login-head">
                        <span>Panel Admin</span>
                        <h2>Masuk sebagai admin</h2>
                        <p>Gunakan akun admin khusus untuk membuka antrean verifikasi UMKM.</p>
                    </div>

                    {notice && <div className="admin-login-notice">{notice}</div>}

                    <label>
                        <span>Username admin</span>
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="adminplus"
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label>
                        <span>Password</span>
                        <div className="admin-password-field">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Masukkan password admin"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                onClick={() => setShowPassword((value) => !value)}
                            >
                                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                            </button>
                        </div>
                    </label>

                    <button className="admin-login-submit" type="submit" disabled={isSubmitting}>
                        <LogIn aria-hidden="true" />
                        <span>{isSubmitting ? 'Memeriksa...' : 'Masuk Dashboard'}</span>
                    </button>
                </form>
            </section>
        </main>
    );
};

export default AdminLogin;
