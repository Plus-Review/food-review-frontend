import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './BackToTopButton.css';

const MOBILE_QUERY = '(max-width: 760px)';
const SCROLL_THRESHOLD = 360;
const HIDDEN_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
const SCROLL_TARGET_SELECTOR = [
    '.admin-main',
    '.profile-page',
    '.umkm-detail-page',
    '.add-umkm-page',
    '.category-feed-page',
    '.popular-feed-page',
    '.saved-page',
    '.my-umkm-page',
    '.activity-page',
    '.notifications-page',
].join(',');

const getScrollAmount = () => {
    const documentScroll = Math.max(
        window.scrollY || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0,
    );

    const containerScroll = Array.from(document.querySelectorAll(SCROLL_TARGET_SELECTOR))
        .reduce((highest, element) => Math.max(highest, element.scrollTop || 0), 0);

    return Math.max(documentScroll, containerScroll);
};

const scrollPageToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
    document.body?.scrollTo?.({ top: 0, behavior: 'smooth' });

    document.querySelectorAll(SCROLL_TARGET_SELECTOR).forEach((element) => {
        element.scrollTo?.({ top: 0, behavior: 'smooth' });
    });
};

const BackToTopButton = () => {
    const { pathname } = useLocation();
    const visibilityFrameRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const isHiddenRoute = HIDDEN_ROUTES.includes(pathname);
    const shouldShow = isMobile && !isHiddenRoute && isVisible;

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_QUERY);

        const updateViewport = () => {
            setIsMobile(mediaQuery.matches);
        };

        updateViewport();
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateViewport);
        } else {
            mediaQuery.addListener(updateViewport);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', updateViewport);
            } else {
                mediaQuery.removeListener(updateViewport);
            }
        };
    }, []);

    useEffect(() => {
        if (!isMobile || isHiddenRoute) {
            return undefined;
        }

        const updateVisibility = () => {
            setIsVisible(getScrollAmount() > SCROLL_THRESHOLD);
        };

        const scheduleVisibilityUpdate = () => {
            if (visibilityFrameRef.current !== null) return;

            visibilityFrameRef.current = window.requestAnimationFrame(() => {
                visibilityFrameRef.current = null;
                updateVisibility();
            });
        };

        scheduleVisibilityUpdate();
        window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
        document.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true, capture: true });

        return () => {
            if (visibilityFrameRef.current !== null) {
                window.cancelAnimationFrame(visibilityFrameRef.current);
                visibilityFrameRef.current = null;
            }
            window.removeEventListener('scroll', scheduleVisibilityUpdate);
            document.removeEventListener('scroll', scheduleVisibilityUpdate, { capture: true });
        };
    }, [isHiddenRoute, isMobile, pathname]);

    const handleClick = () => {
        scrollPageToTop();
    };

    return (
        <button
            className={shouldShow ? 'back-to-top-button is-visible' : 'back-to-top-button'}
            type="button"
            aria-label="Kembali ke atas halaman"
            onClick={handleClick}
            tabIndex={shouldShow ? 0 : -1}
        >
            <ArrowUp aria-hidden="true" />
            <span>Atas</span>
        </button>
    );
};

export default BackToTopButton;
