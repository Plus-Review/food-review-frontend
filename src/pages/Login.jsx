import { useState } from 'react';
import { KeyRound, LockKeyhole, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthNotice from '../components/AuthNotice';
import BrandLogo from '../components/BrandLogo';
import './Login.css';

const ADMIN_USERNAMES = ['fikrank', 'dum', 'gean'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setNotice(null);
        setIsSubmitting(true);
        const cleanLoginId = loginId.trim();
        const isAdminLogin = ADMIN_USERNAMES.includes(cleanLoginId.toLowerCase());
        const isEmailLogin = EMAIL_PATTERN.test(cleanLoginId.toLowerCase());

        if (!isEmailLogin && !isAdminLogin) {
            setNotice({
                type: 'warning',
                title: 'Gunakan email akun',
                message: 'Masukkan email yang terdaftar dengan format yang benar.',
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const { data } = await apiClient.post('/auth/login', { loginId: cleanLoginId, password });

            if (data.user?.role === 'admin') {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.admin || data.user));
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/admin/dashboard');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.dispatchEvent(new Event('profile-updated'));
            navigate('/');
        } catch (err) {
            if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
                const verificationEmail = err.response.data.email || cleanLoginId;
                localStorage.setItem('pendingVerificationEmail', verificationEmail);
                navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`, {
                    state: {
                        email: verificationEmail,
                        notice: err.response.data.message,
                    },
                });
                return;
            }

            const message = err.response?.data?.message || 'Login gagal. Coba lagi beberapa saat.';
            const isWrongPassword = message.toLowerCase().includes('password');
            const isMissingAccount = message.toLowerCase().includes('user');
            const title = isAdminLogin
                ? 'Login admin gagal'
                : isWrongPassword
                    ? 'Password salah'
                    : isMissingAccount
                        ? 'Akun tidak ditemukan'
                        : 'Login gagal';

            setNotice({
                type: 'danger',
                title,
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
                    <div className="login-card-header">
                        <span>Selamat datang kembali</span>
                        <h2>Login</h2>
                        <p>Gunakan akun yang sudah terdaftar untuk masuk ke Plus Review.</p>
                    </div>

                    <AuthNotice notice={notice} />

                    <form onSubmit={handleLogin} className="login-form">
                        <label>
                            <span>Email</span>
                            <div className="auth-input-shell">
                                <UserRound aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="nama@email.com"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </label>

                        <PasswordField
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            showPassword={showPassword}
                            onToggle={() => setShowPassword((value) => !value)}
                        />

                        <div className="login-form-assist">
                            <Link to="/forgot-password">
                                <KeyRound aria-hidden="true" />
                                Lupa Password?
                            </Link>
                        </div>

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
        <div className="password-field auth-input-shell">
            <LockKeyhole aria-hidden="true" />
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={value}
                onChange={onChange}
                autoComplete="current-password"
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
