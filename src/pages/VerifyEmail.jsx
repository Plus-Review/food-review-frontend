import { useEffect, useState } from 'react';
import { KeyRound, Mail, RotateCw } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AuthFlowLayout from '../components/AuthFlowLayout';
import AuthNotice from '../components/AuthNotice';
import './Login.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(
        searchParams.get('email')
        || location.state?.email
        || localStorage.getItem('pendingVerificationEmail')
        || '',
    );
    const [code, setCode] = useState(location.state?.devVerificationCode || '');
    const [notice, setNotice] = useState(location.state?.notice ? {
        type: 'success',
        title: 'Periksa email kamu',
        message: location.state.notice,
    } : null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendWait, setResendWait] = useState(location.state?.emailSent ? 60 : 0);
    const [devCode, setDevCode] = useState(location.state?.devVerificationCode || '');

    useEffect(() => {
        if (resendWait <= 0) return undefined;
        const timer = window.setInterval(() => {
            setResendWait((current) => Math.max(0, current - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [resendWait]);

    const handleVerify = async (event) => {
        event.preventDefault();
        setNotice(null);
        setIsSubmitting(true);
        try {
            const { data } = await apiClient.post('/auth/verify-email', {
                email: email.trim().toLowerCase(),
                code,
            });
            localStorage.removeItem('pendingVerificationEmail');
            setNotice({ type: 'success', title: 'Email terverifikasi', message: data.message });
            window.setTimeout(() => navigate('/login', { replace: true }), 1000);
        } catch (error) {
            setNotice({
                type: 'danger',
                title: 'Verifikasi gagal',
                message: error.response?.data?.message || 'Kode tidak dapat diverifikasi. Coba lagi.',
            });
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!email.trim() || resendWait > 0 || isResending) return;
        setNotice(null);
        setIsResending(true);
        try {
            const { data } = await apiClient.post('/auth/resend-verification', {
                email: email.trim().toLowerCase(),
            });
            setDevCode(data.devVerificationCode || '');
            if (data.devVerificationCode) setCode(data.devVerificationCode);
            setResendWait(60);
            setNotice({ type: 'success', title: 'Permintaan diproses', message: data.message });
        } catch (error) {
            setNotice({
                type: error.response?.status === 429 ? 'warning' : 'danger',
                title: 'Kode belum terkirim',
                message: error.response?.data?.message || 'Kode belum dapat dikirim. Coba lagi.',
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthFlowLayout
            eyebrow="Keamanan akun"
            title="Pastikan akun benar-benar milikmu."
            description="Satu langkah singkat untuk menjaga identitas, review, dan UMKM yang kamu kelola tetap aman."
            cardLabel="Verifikasi email"
            cardTitle="Masukkan kode"
            cardDescription="Kode 6 angka berlaku selama 15 menit dan hanya dapat dipakai satu kali."
        >
            <AuthNotice notice={notice} />
            {devCode && (
                <AuthNotice notice={{
                    type: 'warning',
                    title: 'Mode lokal',
                    message: `SMTP belum aktif. Gunakan kode pengembangan ${devCode}.`,
                }} />
            )}
            <form className="login-form auth-flow-form" onSubmit={handleVerify}>
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
                <label>
                    <span>Kode verifikasi</span>
                    <div className="auth-input-shell auth-code-shell">
                        <KeyRound aria-hidden="true" />
                        <input
                            value={code}
                            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            aria-label="Kode verifikasi 6 angka"
                            required
                        />
                    </div>
                </label>
                <button className="login-submit" type="submit" disabled={isSubmitting || code.length !== 6}>
                    {isSubmitting ? 'Memverifikasi...' : 'Verifikasi email'}
                </button>
            </form>
            <button
                className="auth-text-action"
                type="button"
                onClick={handleResend}
                disabled={isResending || resendWait > 0 || !email.trim()}
            >
                <RotateCw aria-hidden="true" />
                {resendWait > 0 ? `Kirim ulang dalam ${resendWait} detik` : 'Kirim ulang kode'}
            </button>
            <p className="login-footer">Sudah terverifikasi? <Link to="/login">Kembali ke login</Link></p>
        </AuthFlowLayout>
    );
};

export default VerifyEmail;
