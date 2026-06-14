import './BrandLogo.css';

const BrandLogo = ({ tone = 'dark', showSubtitle = true }) => (
    <span className={`brand-logo brand-logo--${tone}`}>
        <span className="brand-logo-mark" aria-hidden="true">
            <span className="brand-logo-letters">PR</span>
            <span className="brand-logo-plus">+</span>
        </span>

        <span className="brand-logo-copy">
            <strong>Plus Review</strong>
            {showSubtitle && <small>UMKM Food Review</small>}
        </span>
    </span>
);

export default BrandLogo;
