import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthFlowLayout from '../components/AuthFlowLayout';
import AuthNotice from '../components/AuthNotice';
import PasswordStrength from '../components/PasswordStrength';
import { getPasswordStrength, PASSWORD_RULE_MESSAGE } from '../utils/passwordStrength';
import './Login.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [notice, setNotice] = useState(token ? null : {
        type: 'danger',
        title: 'Tautan tidak valid',
        message: 'Minta tautan reset baru dari halaman lupa password.',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setNotice(null);

        if (!getPasswordStrength(password).isValid) {
            setNotice({ type: 'warning', title: 'Password belum aman', message: PASSWORD_RULE_MESSAGE });
            return;
        }
        if (password !== confirmation) {
            setNotice({ type: 'warning', title: 'Password tidak sama', message: 'Ulangi password baru dengan nilai yang sama.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await apiClient.post('/auth/reset-password', { token, password });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setNotice({ type: 'success', title: 'Password diperbarui', message: data.message });
            window.setTimeout(() => navigate('/login', { replace: true }), 1000);
        } catch (error) {
            setNotice({
                type: 'danger',
                title: 'Reset password gagal',
                message: error.response?.data?.message || 'Tautan tidak dapat digunakan. Minta tautan baru.',
            });
            setIsSubmitting(false);
        }
    };

    return (
        <AuthFlowLayout
            eyebrow="Password baru"
            title="Buat akses baru yang lebih kuat."
            description="Tautan ini hanya berlaku satu kali. Setelah berhasil, semua sesi akun sebelumnya otomatis berakhir."
            cardLabel="Atur ulang"
            cardTitle="Password baru"
            cardDescription="Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol."
        >
            <AuthNotice notice={notice} />
            <form className="login-form auth-flow-form" onSubmit={handleSubmit}>
                <PasswordInput
                    label="Password baru"
                    value={password}
                    onChange={setPassword}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                />
                <PasswordStrength password={password} compact />
                <PasswordInput
                    label="Ulangi password"
                    value={confirmation}
                    onChange={setConfirmation}
                    showPassword={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                />
                <button className="login-submit" type="submit" disabled={isSubmitting || !token}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan password baru'}
                </button>
            </form>
            <p className="login-footer">Tautan bermasalah? <Link to="/forgot-password">Minta tautan baru</Link></p>
        </AuthFlowLayout>
    );
};

const PasswordInput = ({ label, value, onChange, showPassword, onToggle }) => (
    <label>
        <span>{label}</span>
        <div className="password-field auth-input-shell">
            <LockKeyhole aria-hidden="true" />
            <input
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Masukkan password"
                autoComplete="new-password"
                required
            />
            <button
                type="button"
                className={showPassword ? 'password-toggle is-visible' : 'password-toggle'}
                onClick={onToggle}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
            ><span /></button>
        </div>
    </label>
);

export default ResetPassword;
