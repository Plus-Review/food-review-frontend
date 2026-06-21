import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const AuthFlowLayout = ({ eyebrow, title, description, cardLabel, cardTitle, cardDescription, children }) => {
    const navigate = useNavigate();

    return (
        <main className="login-page auth-flow-page">
            <section className="login-panel" aria-label={cardTitle}>
                <div className="login-visual">
                    <button className="login-brand" type="button" onClick={() => navigate('/')}>
                        <BrandLogo tone="light" showSubtitle={false} />
                    </button>

                    <div className="login-visual-copy">
                        <span>{eyebrow}</span>
                        <h1>{title}</h1>
                        <p>{description}</p>
                    </div>

                    <ul className="auth-benefits" aria-label="Perlindungan akun Plus Review">
                        <li><span>01</span><strong>Email terverifikasi</strong></li>
                        <li><span>02</span><strong>Kode dan tautan terbatas</strong></li>
                        <li><span>03</span><strong>Password tersimpan aman</strong></li>
                    </ul>
                </div>

                <div className="login-card auth-flow-card">
                    <div className="auth-flow-symbol" aria-hidden="true">
                        <ShieldCheck />
                    </div>
                    <div className="login-card-header">
                        <span>{cardLabel}</span>
                        <h2>{cardTitle}</h2>
                        <p>{cardDescription}</p>
                    </div>
                    {children}
                </div>
            </section>
        </main>
    );
};

export default AuthFlowLayout;
