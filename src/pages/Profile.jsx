import { useEffect, useMemo, useState } from 'react';
import { Camera, Eye, EyeOff, ImagePlus, Lock, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import AppNavbar from '../components/AppNavbar';
import PasswordStrength from '../components/PasswordStrength';
import ProfilePhotoViewer from '../components/ProfilePhotoViewer';
import { getUploadUrl } from '../config/api';
import { getPasswordStrength, PASSWORD_RULE_MESSAGE } from '../utils/passwordStrength';
import './Profile.css';
import { optimizeImageFile } from '../utils/imageUpload';

const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return '';
    return getUploadUrl(profileImage);
};

const Profile = () => {
    const navigate = useNavigate();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showProfilePhoto, setShowProfilePhoto] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return undefined;
        }

        let ignore = false;

        const loadProfile = async () => {
            try {
                const { data } = await apiClient.get('/auth/profile');
                if (ignore) return;

                setProfile(data.user);
                setFormData({
                    username: data.user.username || '',
                    email: data.user.email || '',
                    password: '',
                });
                localStorage.setItem('user', JSON.stringify(data.user));
            } catch (err) {
                if (!ignore) {
                    setStatusType('error');
                    setStatus(err.response?.data?.message || 'Gagal memuat profile.');
                }
            } finally {
                if (!ignore) setIsLoading(false);
            }
        };

        loadProfile();

        return () => {
            ignore = true;
        };
    }, [isLoggedIn, navigate]);

    useEffect(() => (
        () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        }
    ), [previewUrl]);

    const imageUrl = previewUrl || getProfileImageUrl(profile?.profileImage);
    const initials = useMemo(() => (
        String(formData.username || formData.email || 'A').trim().charAt(0).toUpperCase() || 'A'
    ), [formData.email, formData.username]);

    const handleChange = (field) => (event) => {
        setFormData((current) => ({ ...current, [field]: event.target.value }));
    };

    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const optimizedFile = await optimizeImageFile(file, { maxBytes: 320 * 1024, maxDimension: 1000 });
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setProfileImage(optimizedFile);
            setPreviewUrl(URL.createObjectURL(optimizedFile));
        } catch {
            setStatusType('warning');
            setStatus('Foto tidak dapat diproses. Gunakan JPG, PNG, atau WEBP lain.');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus('');
        setStatusType('info');

        const nextUsername = formData.username.trim();
        const nextEmail = formData.email.trim().toLowerCase();
        const hasChanges = Boolean(profileImage)
            || nextUsername !== String(profile?.username || '').trim()
            || nextEmail !== String(profile?.email || '').trim().toLowerCase()
            || Boolean(formData.password.trim());

        if (!hasChanges) {
            setStatusType('warning');
            setStatus('Isi terlebih dahulu perubahannya sebelum menyimpan.');
            return;
        }

        if (formData.password.trim() && !getPasswordStrength(formData.password).isValid) {
            setStatusType('warning');
            setStatus(PASSWORD_RULE_MESSAGE);
            return;
        }

        const payload = new FormData();
        payload.append('username', nextUsername);
        payload.append('email', nextEmail);
        if (formData.password.trim()) {
            payload.append('password', formData.password);
        }
        if (profileImage) {
            payload.append('profileImage', profileImage);
        }

        setIsSaving(true);
        try {
            const { data } = await apiClient.put('/auth/profile', payload);
            setProfile(data.user);
            setFormData((current) => ({ ...current, password: '' }));
            setProfileImage(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl('');
            }
            localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('profile-updated'));

            if (data.requiresVerification) {
                const verificationEmail = data.email || data.user.email;
                localStorage.setItem('pendingVerificationEmail', verificationEmail);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`, {
                    replace: true,
                    state: {
                        email: verificationEmail,
                        emailSent: data.emailSent,
                        devVerificationCode: data.devVerificationCode,
                        notice: data.message,
                    },
                });
                return;
            }

            if (data.sessionInvalidated) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login', { replace: true });
                return;
            }

            setStatusType('success');
            setStatus(data.message || 'Profile berhasil diperbarui.');
        } catch (err) {
            setStatusType('error');
            setStatus(err.response?.data?.message || 'Gagal memperbarui profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="profile-page">
            <AppNavbar active="profile" isLoggedIn={isLoggedIn} />

            <section className="profile-shell">
                <aside className="profile-summary">
                    <span className="profile-kicker">Akun Plus Review</span>
                    <h1>Edit Profile</h1>
                    <p>
                        Rapikan identitas akunmu supaya setiap review dan rekomendasi tampil lebih personal.
                    </p>

                    <div className="profile-photo-card">
                        <button
                            className="profile-photo-preview"
                            type="button"
                            aria-label={imageUrl ? 'Lihat foto profile' : 'Foto profile belum tersedia'}
                            title={imageUrl ? 'Lihat foto profile' : 'Pilih foto pada form di samping'}
                            disabled={!imageUrl}
                            onClick={() => setShowProfilePhoto(true)}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt={formData.username || 'Foto profil'} />
                            ) : (
                                <span className="profile-photo-initial">{initials}</span>
                            )}
                            {imageUrl && (
                                <span className="profile-photo-view-hint" aria-hidden="true">
                                    <Eye />
                                </span>
                            )}
                        </button>
                        <div>
                            <strong>{formData.username || 'Nama pengguna'}</strong>
                            <small>{formData.email || 'email@plusreview.test'}</small>
                        </div>
                    </div>

                    <div className="profile-note">
                        <ShieldCheck aria-hidden="true" />
                        <span>Password hanya berubah kalau kolom password baru diisi.</span>
                    </div>
                </aside>

                <form className="profile-form-panel" onSubmit={handleSubmit}>
                    <div className="profile-form-header">
                        <span>Detail akun</span>
                        <h2>Data Profile</h2>
                        <p>Ubah nama, email, password, dan foto profile dengan nyaman.</p>
                    </div>

                    <label className="profile-upload">
                        <span className="profile-upload-preview">
                            {imageUrl ? (
                                <img src={imageUrl} alt="" />
                            ) : (
                                <Camera aria-hidden="true" />
                            )}
                        </span>
                        <span className="profile-upload-copy">
                            <strong>Foto profile</strong>
                            <small>Pilih JPG atau PNG maksimal 2MB.</small>
                        </span>
                        <span className="profile-upload-action">
                            <ImagePlus aria-hidden="true" />
                            Ganti foto
                        </span>
                        <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </label>

                    <div className="profile-field-grid">
                        <ProfileField icon={<UserRound aria-hidden="true" />} label="Nama">
                            <input
                                value={formData.username}
                                onChange={handleChange('username')}
                                placeholder="Masukkan nama"
                                required
                            />
                        </ProfileField>

                        <ProfileField icon={<Mail aria-hidden="true" />} label="Email">
                            <input
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                placeholder="nama@email.com"
                                required
                            />
                        </ProfileField>

                        <ProfileField icon={<Lock aria-hidden="true" />} label="Password baru" wide>
                            <div className="profile-password-shell">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    placeholder="Kosongkan jika tidak ingin mengganti"
                                />
                                <button
                                    type="button"
                                    className="profile-password-toggle"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                >
                                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                                </button>
                            </div>
                            <PasswordStrength password={formData.password} compact emptyLabel="Tidak diganti" />
                        </ProfileField>
                    </div>

                    {status && <p className={`profile-status is-${statusType}`}>{status}</p>}

                    <div className="profile-actions">
                        <button type="button" className="profile-secondary" onClick={() => navigate('/')}>
                            Batal
                        </button>
                        <button type="submit" className="profile-primary" disabled={isSaving || isLoading}>
                            <Save aria-hidden="true" />
                            <span>{isSaving ? 'Menyimpan...' : 'Simpan perubahan'}</span>
                        </button>
                    </div>
                </form>
            </section>
            {showProfilePhoto && imageUrl && (
                <ProfilePhotoViewer
                    imageUrl={imageUrl}
                    name={formData.username}
                    email={formData.email}
                    editLabel="Ganti foto"
                    onClose={() => setShowProfilePhoto(false)}
                    onEdit={() => {
                        setShowProfilePhoto(false);
                        window.requestAnimationFrame(() => {
                            document.querySelector('.profile-upload input[type="file"]')?.click();
                        });
                    }}
                />
            )}
        </main>
    );
};

const ProfileField = ({ icon, label, children, wide = false }) => (
    <label className={wide ? 'profile-field is-wide' : 'profile-field'}>
        <span>
            {icon}
            {label}
        </span>
        {children}
    </label>
);

export default Profile;
