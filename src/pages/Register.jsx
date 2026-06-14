import { useState } from 'react';
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
            await apiClient.post('/auth/register', {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });
            setNotice({
                type: 'success',
                title: 'Registrasi berhasil',
                message: 'Akun sudah dibuat. Kamu akan diarahkan ke halaman login.',
            });
            setTimeout(() => navigate('/login'), 900);
        } catch (err) {
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
                        <span>Akun baru</span>
                        <h1>Mulai berbagi tempat makan favoritmu.</h1>
                        <p>
                            Daftar untuk menambahkan UMKM, memberi rating, dan membantu
                            rekomendasi kuliner kampus jadi lebih lengkap.
                        </p>
                    </div>

                    <ul className="auth-benefits" aria-label="Manfaat akun Plus Review">
                        <li>
                            <span>04</span>
                            <strong>Simpan data UMKM</strong>
                        </li>
                        <li>
                            <span>05</span>
                            <strong>Bagikan pengalaman makan</strong>
                        </li>
                        <li>
                            <span>06</span>
                            <strong>Bantu teman memilih tempat</strong>
                        </li>
                    </ul>
                </div>

                <div className="login-card">
                    <button className="auth-home-button" type="button" onClick={() => navigate('/')}>
                        <span className="auth-home-icon" aria-hidden="true" />
                        <span>Kembali ke Beranda</span>
                    </button>

                    <div className="login-card-header">
                        <span>Buat akun</span>
                        <h2>Register</h2>
                        <p>Isi data singkat di bawah untuk mulai menggunakan aplikasi.</p>
                    </div>

                    <AuthNotice notice={notice} />

                    <form onSubmit={handleRegister} className="login-form">
                        <label>
                            <span>Username</span>
                            <input
                                type="text"
                                placeholder="Masukkan username"
                                value={formData.username}
                                onChange={handleChange('username')}
                                required
                            />
                        </label>

                        <label>
                            <span>Email</span>
                            <input
                                type="email"
                                placeholder="nama@email.com"
                                value={formData.email}
                                onChange={handleChange('email')}
                                required
                            />
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
        <PasswordStrength password={value} compact />
    </div>
);

export default Register;
