import { getPasswordStrength } from '../utils/passwordStrength';
import './PasswordStrength.css';

const segmentMap = {
    empty: 0,
    weak: 1,
    strong: 2,
    'very-strong': 3,
};

const PasswordStrength = ({ password, compact = false, emptyLabel = 'Belum diisi' }) => {
    const strength = getPasswordStrength(password);
    const label = password ? strength.label : emptyLabel;
    const activeSegments = segmentMap[strength.level] || 0;

    return (
        <div
            className={[
                'password-strength',
                `password-strength--${strength.level}`,
                compact ? 'password-strength--compact' : '',
            ].filter(Boolean).join(' ')}
            aria-live="polite"
        >
            <div className="password-strength-meter" aria-hidden="true">
                {[1, 2, 3].map((segment) => (
                    <span
                        className={segment <= activeSegments ? 'is-active' : ''}
                        key={segment}
                    />
                ))}
            </div>

            <strong className="password-strength-label">{label}</strong>

            <div className="password-requirements">
                {strength.requirements.map((item) => (
                    <span
                        className={item.met ? 'password-requirement is-met' : 'password-requirement'}
                        key={item.id}
                        title={item.label}
                        aria-label={`${item.label}: ${item.met ? 'terpenuhi' : 'belum terpenuhi'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default PasswordStrength;
