export const API_BASE_URL =
    'https://food-review-backend-j4bk.vercel.app/api';

export const API_ORIGIN =
    'https://food-review-backend-j4bk.vercel.app';

export const getUploadUrl = (filename) => {
    if (!filename) return '';
    if (String(filename).startsWith('http')) return filename;
    return `${API_ORIGIN}/uploads/${filename}`;
};
