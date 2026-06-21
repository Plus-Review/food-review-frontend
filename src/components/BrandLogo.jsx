import { Star } from 'lucide-react';
import './BrandLogo.css';

const BrandLogo = ({ tone = 'dark', showSubtitle = true }) => (
    <span className={`brand-logo brand-logo--${tone}`}>
        <span className="brand-logo-mark" aria-hidden="true">
            <span className="brand-logo-letters">PR</span>
            <span className="brand-logo-plus">+</span>
        </span>

        <span className="brand-logo-copy">
            <span className="brand-logo-name">
                <strong>Plus Review</strong>
                <span className="brand-logo-star" aria-hidden="true">
                    <Star className="brand-logo-star-base" />
                    <Star className="brand-logo-star-shine" />
                </span>
            </span>
            {showSubtitle && <small>UMKM Food Review</small>}
        </span>
    </span>
);

export default BrandLogo;
