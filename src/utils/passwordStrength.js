export const PASSWORD_RULE_MESSAGE = 'Password wajib memiliki huruf besar, huruf kecil, angka, dan karakter unik.';

export const PASSWORD_REQUIREMENTS = [
    {
        id: 'upper',
        label: 'Besar',
        test: (value) => /[A-Z]/.test(value),
    },
    {
        id: 'lower',
        label: 'Kecil',
        test: (value) => /[a-z]/.test(value),
    },
    {
        id: 'number',
        label: 'Angka',
        test: (value) => /\d/.test(value),
    },
    {
        id: 'special',
        label: 'Simbol',
        test: (value) => /[^A-Za-z0-9]/.test(value),
    },
];

export const getPasswordStrength = (password = '') => {
    const value = String(password);
    const requirements = PASSWORD_REQUIREMENTS.map((item) => ({
        ...item,
        met: item.test(value),
    }));
    const passed = requirements.filter((item) => item.met).length;
    const isValid = requirements.every((item) => item.met);
    const bonus = (value.length >= 8 ? 1 : 0) + (value.length >= 12 ? 1 : 0);
    const score = passed + bonus;

    if (!value) {
        return {
            level: 'empty',
            label: 'Belum diisi',
            percent: 0,
            isValid: false,
            requirements,
        };
    }

    if (!isValid) {
        return {
            level: 'weak',
            label: 'Lemah',
            percent: Math.max(18, passed * 18),
            isValid,
            requirements,
        };
    }

    if (score >= 6) {
        return {
            level: 'very-strong',
            label: 'Sangat kuat',
            percent: 100,
            isValid,
            requirements,
        };
    }

    return {
        level: 'strong',
        label: 'Kuat',
        percent: 74,
        isValid,
        requirements,
    };
};
