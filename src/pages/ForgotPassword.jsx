import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthFlowLayout from '../components/AuthFlowLayout';
import AuthNotice from '../components/AuthNotice';
import './Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [notice, setNotice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [devResetUrl, setDevResetUrl] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setNotice(null);
        setDevResetUrl('');
        setIsSubmitting(true);
        try {
            const { data } = await apiClient.post('/auth/forgot-password', {
                email: email.trim().toLowerCase(),
            });
            if (data.devResetToken) {
                setDevResetUrl(`/reset-password?token=${encodeURIComponent(data.devResetToken)}`);
            }
            setNotice({
                type: 'success',
                title: 'Periksa kotak masuk',
                message: data.message,
            });
        } catch (error) {
            setNotice({
                type: error.response?.status === 429 ? 'warning' : 'danger',
                title: 'Permintaan belum diproses',
                message: error.response?.data?.message || 'Coba lagi beberapa saat.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthFlowLayout
            eyebrow="Pemulihan akun"
            title="Kembali ke akunmu dengan aman."
            description="Kami mengirim tautan sekali pakai agar hanya pemilik email yang dapat membuat password baru."
            cardLabel="Lupa password"
            cardTitle="Pulihkan akun"
            cardDescription="Masukkan email yang terdaftar. Tautan reset berlaku selama 30 menit."
        >
            <AuthNotice notice={notice} />
            <form className="login-form auth-flow-form" onSubmit={handleSubmit}>
                <label>
                    <span>Email</span>
                    <div className="auth-input-shell">
                        <Mail aria-hidden="true" />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="nama@email.com"
                            autoComplete="email"
                            required
                        />
                    </div>
                </label>
                <button className="login-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Mengirim...' : 'Kirim tautan reset'}
                </button>
            </form>
            {devResetUrl && (
                <Link className="auth-development-link" to={devResetUrl}>
                    Buka tautan reset lokal
                </Link>
            )}
            <p className="login-footer">Ingat password? <Link to="/login">Kembali ke login</Link></p>
        </AuthFlowLayout>
    );
};

export default ForgotPassword;
