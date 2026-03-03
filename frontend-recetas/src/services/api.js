import axios from 'axios';

const api = axios.create({
    baseURL: '', // Vite proxy se encargará de redirigir /api y /uploads al backend
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
