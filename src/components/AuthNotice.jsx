const AuthNotice = ({ notice }) => {
    if (!notice) return null;

    return (
        <div className={`auth-notice auth-notice--${notice.type || 'info'}`} role="status" aria-live="polite">
            <span className="auth-notice-icon" aria-hidden="true" />
            <div>
                <strong>{notice.title}</strong>
                <p>{notice.message}</p>
            </div>
        </div>
    );
};

export default AuthNotice;
