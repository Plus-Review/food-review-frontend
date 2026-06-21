import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        Accept: 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
