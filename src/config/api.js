const API_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://food-review-backend-j4bk.vercel.app/api';

export const API_BASE_URL = API_URL;
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const getUploadUrl = (filename) => {
    if (!filename) return '';
    if (String(filename).startsWith('http')) return filename;
    return `${API_ORIGIN}/uploads/${filename}`;
};