const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

export const API_BASE_URL = normalizedApiBaseUrl.endsWith('/api')
    ? normalizedApiBaseUrl
    : `${normalizedApiBaseUrl}/api`;

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const getUploadUrl = (filename) => {
    if (!filename) return '';
    if (String(filename).startsWith('http')) return filename;
    return `${API_ORIGIN}/uploads/${filename}`;
};
