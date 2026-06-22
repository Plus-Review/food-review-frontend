import { useEffect, useRef } from 'react';
import { PencilLine, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './ProfilePhotoViewer.css';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ProfilePhotoViewer = ({ imageUrl, name, email, onClose, onEdit, editLabel = 'Edit Profile' }) => {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);

    useEffect(() => {
        const previousActiveElement = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            previousActiveElement?.focus?.();
        };
    }, [onClose]);

    if (!imageUrl) return null;

    return createPortal(
        <div className="profile-photo-viewer" role="presentation">
            <button className="profile-photo-viewer-backdrop" type="button" aria-label="Tutup tampilan foto" onClick={onClose} />
            <section
                ref={dialogRef}
                className="profile-photo-viewer-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-photo-viewer-title"
            >
                <header className="profile-photo-viewer-head">
                    <div>
                        <span>Foto akun</span>
                        <h2 id="profile-photo-viewer-title">Foto Profile</h2>
                    </div>
                    <button ref={closeButtonRef} type="button" aria-label="Tutup foto profile" onClick={onClose}>
                        <X aria-hidden="true" />
                    </button>
                </header>

                <div className="profile-photo-viewer-media">
                    <img src={imageUrl} alt={`Foto profile ${name || 'pengguna'}`} decoding="async" />
                </div>

                <footer className="profile-photo-viewer-footer">
                    <div>
                        <strong>{name || 'Akun Plus Review'}</strong>
                        {email && <small>{email}</small>}
                    </div>
                    {onEdit && (
                        <button type="button" onClick={onEdit}>
                            <PencilLine aria-hidden="true" />
                            <span>{editLabel}</span>
                        </button>
                    )}
                </footer>
            </section>
        </div>,
        document.body,
    );
};

export default ProfilePhotoViewer;
