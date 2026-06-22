import { useState } from 'react';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthNotice from '../components/AuthNotice';
import BrandLogo from '../components/BrandLogo';
import PasswordStrength from '../components/PasswordStrength';
import { getPasswordStrength, PASSWORD_RULE_MESSAGE } from '../utils/passwordStrength';
import './Login.css';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setNotice(null);

        if (!getPasswordStrength(formData.password).isValid) {
            setNotice({
                type: 'warning',
                title: 'Password belum aman',
                message: PASSWORD_RULE_MESSAGE,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await apiClient.post('/auth/register', {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });
            const verificationEmail = data.email || formData.email.trim().toLowerCase();
            localStorage.setItem('pendingVerificationEmail', verificationEmail);
            navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`, {
                state: {
                    email: verificationEmail,
                    emailSent: data.emailSent,
                    devVerificationCode: data.devVerificationCode,
                    notice: data.message,
                },
            });
        } catch (err) {
            if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
                const verificationEmail = err.response.data.email || formData.email.trim().toLowerCase();
                localStorage.setItem('pendingVerificationEmail', verificationEmail);
                navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`, {
                    state: { email: verificationEmail, notice: err.response.data.message },
                });
                return;
            }

            const message = err.response?.data?.message
                || (err.request ? 'Backend belum aktif. Jalankan npm run backend lalu coba lagi.' : 'Registrasi gagal.');
            setNotice({
                type: err.response?.status === 409 ? 'warning' : 'danger',
                title: err.response?.status === 409 ? 'Data sudah digunakan' : 'Registrasi gagal',
                message,
            });
            setIsSubmitting(false);
        }
    };

    const handleChange = (field) => (e) => {
        setFormData((current) => ({ ...current, [field]: e.target.value }));
    };

    return (
        <main className="login-page register-page">
            <section className="login-panel" aria-label="Registrasi Plus Review">
                <div className="login-visual">
                    <button className="login-brand" onClick={() => navigate('/')}>
                        <BrandLogo tone="light" showSubtitle={false} />
                    </button>

                    <div className="login-visual-copy">
                        <span>Food Review</span>
                        <h1>Daftar untuk berbagi rekomendasi terbaikmu.</h1>
                        <p>
                            Buat akun untuk menambahkan UMKM, memberi rating, dan bantu teman kampus
                            menemukan tempat makan yang layak dicoba.
                        </p>
                    </div>

                    <ul className="auth-benefits" aria-label="Manfaat akun Plus Review">
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
                        <span>Buat akun</span>
                        <h2>Daftar</h2>
                        <p>Isi data singkat di bawah untuk mulai menggunakan aplikasi.</p>
                    </div>

                    <AuthNotice notice={notice} />

                    <form onSubmit={handleRegister} className="login-form">
                        <label>
                            <span>Username</span>
                            <div className="auth-input-shell">
                                <UserRound aria-hidden="true" />
                                <input
                                    type="text"
                                    placeholder="Masukkan username"
                                    value={formData.username}
                                    onChange={handleChange('username')}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </label>

                        <label>
                            <span>Email</span>
                            <div className="auth-input-shell">
                                <Mail aria-hidden="true" />
                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </label>

                        <PasswordField
                            value={formData.password}
                            onChange={handleChange('password')}
                            showPassword={showPassword}
                            onToggle={() => setShowPassword((value) => !value)}
                        />

                        <button type="submit" className="login-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Memproses...' : 'Daftar'}
                        </button>
                    </form>

                    <p className="login-footer">
                        Sudah punya akun? <Link to="/login">Masuk di sini</Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

const PasswordField = ({ value, onChange, showPassword, onToggle }) => (
    <div className="password-field-group">
        <label>
            <span>Password</span>
            <div className="password-field auth-input-shell">
                <LockKeyhole aria-hidden="true" />
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={value}
                    onChange={onChange}
                    autoComplete="new-password"
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
        <PasswordStrength password={value} compact />
    </div>
);

export default Register;
