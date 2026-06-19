import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const adminApiClient = axios.create({
    baseURL: `${API_BASE_URL}/admin`,
});

adminApiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default adminApiClient;
