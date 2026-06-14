import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthNotice from '../components/AuthNotice';
import BrandLogo from '../components/BrandLogo';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setNotice(null);
        setIsSubmitting(true);
        try {
            const { data } = await apiClient.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('profile-updated'));
            navigate('/');
        } catch (err) {
            const message = err.response?.data?.message || 'Login gagal. Coba lagi beberapa saat.';
            const isWrongPassword = message.toLowerCase().includes('password');
            const isMissingAccount = message.toLowerCase().includes('user');

            setNotice({
                type: 'danger',
                title: isWrongPassword ? 'Password salah' : isMissingAccount ? 'Akun tidak ditemukan' : 'Login gagal',
                message,
            });
            setIsSubmitting(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-panel" aria-label="Login Plus Review">
                <div className="login-visual">
                    <button className="login-brand" onClick={() => navigate('/')}>
                        <BrandLogo tone="light" showSubtitle={false} />
                    </button>

                    <div className="login-visual-copy">
                        <span>Food Review</span>
                        <h1>Masuk untuk berbagi rekomendasi terbaikmu.</h1>
                        <p>
                            Tambahkan UMKM, tulis review, dan bantu teman kampus
                            menemukan tempat makan yang layak dicoba.
                        </p>
                    </div>

                    <ul className="auth-benefits" aria-label="Fitur Plus Review">
                        <li>
                            <span>01</span>
                            <strong>Tambah UMKM kampus</strong>
                        </li>
                        <li>
                            <span>02</span>
                            <strong>Review dan rating makanan</strong>
                        </li>
                        <li>
                            <span>03</span>
                            <strong>Temukan tempat favorit</strong>
                        </li>
                    </ul>
                </div>

                <div className="login-card">
                    <button className="auth-home-button" type="button" onClick={() => navigate('/')}>
                        <span className="auth-home-icon" aria-hidden="true" />
                        <span>Kembali ke Beranda</span>
                    </button>

                    <div className="login-card-header">
                        <span>Selamat datang kembali</span>
                        <h2>Login</h2>
                        <p>Gunakan email dan password yang sudah terdaftar.</p>
                    </div>

                    <AuthNotice notice={notice} />

                    <form onSubmit={handleLogin} className="login-form">
                        <label>
                            <span>Email</span>
                            <input
                                type="email"
                                placeholder="nama@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>

                        <PasswordField
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            showPassword={showPassword}
                            onToggle={() => setShowPassword((value) => !value)}
                        />

                        <button type="submit" className="login-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Memeriksa...' : 'Masuk'}
                        </button>
                    </form>

                    <p className="login-footer">
                        Belum punya akun? <Link to="/register">Daftar sekarang</Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

const PasswordField = ({ value, onChange, showPassword, onToggle }) => (
    <label>
        <span>Password</span>
        <div className="password-field">
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={value}
                onChange={onChange}
                required
            />
            <button
                type="button"
                className={showPassword ? 'password-toggle is-visible' : 'password-toggle'}
                onClick={onToggle}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            >
                <span />
            </button>
        </div>
    </label>
);

export default Login;
