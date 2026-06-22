import {
    Compass,
    Copyright,
    ExternalLink,
    Phone,
    UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import igOwnerIcon from '../assets/igowner.png';
import igTeamIcon from '../assets/igteam.png';
import BrandLogo from './BrandLogo';
import './SiteFooter.css';

const CONTACTS = [
    {
        name: 'Sheif Abdummalik A',
        phone: '+62 853-9939-8922',
        href: 'tel:+6285399398922',
        instagram: 'https://www.instagram.com/nestapenetrator?igsh=bGJ6ZW5lZHcwbnFx&utm_source=qr',
    },
    {
        name: 'Fikrank',
        phone: '+62 853-2360-8781',
        href: 'tel:+6285323608781',
        instagram: 'https://www.instagram.com/r.x.b.r_?igsh=MTN6aDlnczBiYm80cw==',
    },
    {
        name: 'Gean Hervicky Thamrin',
        phone: '+62 812-4488-9020',
        href: 'tel:+6281244889020',
        instagram: 'https://www.instagram.com/gian_hervicky?igsh=bzNlcnNkdXZzamQz',
    },
];

const SITEMAP_LINKS = [
    { label: 'Beranda', to: '/' },
    { label: 'Feed populer', to: '/populer' },
    { label: 'Makanan berat', to: '/kategori/makanan-berat' },
    { label: 'Snacks & Dessert', to: '/kategori/dessert-snacks' },
    { label: 'Drinks', to: '/kategori/drinks' },
    { label: 'UMKM disimpan', to: '/tersimpan' },
];

const INSTAGRAM_URL = 'https://www.instagram.com/gian_hervicky?igsh=bzNlcnNkdXZzamQz';

const SiteFooter = () => (
    <footer className="site-footer" aria-label="Informasi Plus Review">
        <div className="site-footer-shell">
            <div className="site-footer-main">
                <section className="site-footer-brand" aria-label="Tentang Plus Review">
                    <BrandLogo showSubtitle={false} />
                    <p>
                        Ruang rekomendasi UMKM kampus untuk menemukan tempat makan,
                        menyimpan pilihan, dan membaca review dengan lebih rapi.
                    </p>
                    <a className="site-footer-social" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                        <span className="site-footer-social-icon" aria-hidden="true">
                            <img src={igTeamIcon} alt="" loading="lazy" decoding="async" />
                        </span>
                        <span>Instagram Plus Review</span>
                        <ExternalLink aria-hidden="true" />
                    </a>
                </section>

                <nav className="site-footer-column site-footer-sitemap" aria-labelledby="site-footer-sitemap-title">
                    <div className="site-footer-heading">
                        <Compass aria-hidden="true" />
                        <h2 id="site-footer-sitemap-title">Sitemap</h2>
                    </div>
                    <ul className="site-footer-sitemap-list">
                        {SITEMAP_LINKS.map((item) => (
                            <li key={item.to}>
                                <Link to={item.to}>{item.label}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section className="site-footer-column site-footer-team-column" aria-labelledby="site-footer-team-title">
                    <div className="site-footer-heading">
                        <UsersRound aria-hidden="true" />
                        <h2 id="site-footer-team-title">Tim pengembang</h2>
                    </div>
                    <ul className="site-footer-team">
                        {CONTACTS.map((contact) => (
                            <li key={contact.name}>
                                <span>{contact.name}</span>
                                <a className="site-footer-ig-button" href={contact.instagram} target="_blank" rel="noreferrer" aria-label={`Instagram ${contact.name}`}>
                                    <img src={igOwnerIcon} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="site-footer-column" aria-labelledby="site-footer-contact-title">
                    <div className="site-footer-heading">
                        <Phone aria-hidden="true" />
                        <h2 id="site-footer-contact-title">Kontak</h2>
                    </div>
                    <ul className="site-footer-contact">
                        {CONTACTS.map((contact) => (
                            <li key={contact.href}>
                                <span>{contact.name}</span>
                                <a href={contact.href}>{contact.phone}</a>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="site-footer-bottom">
                <span className="site-footer-copyright">
                    <Copyright aria-hidden="true" />
                    <span>2026 Plus Review. All rights reserved.</span>
                </span>
                <span>Review UMKM kampus yang lebih jelas, ringkas, dan mudah dipercaya.</span>
            </div>
        </div>
    </footer>
);

export default SiteFooter;
