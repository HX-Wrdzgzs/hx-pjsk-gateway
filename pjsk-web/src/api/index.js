import axios from 'axios';

const request = axios.create({
    baseURL: '/api', // 开发环境通过 Vite 代理，生产环境依靠 CF Pages 变量或同源策略
    timeout: 20000,
});

request.interceptors.request.use((config) => {
    const token = localStorage.getItem('pjsk_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

request.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('pjsk_token');
            window.location.href = '/login'; // Token 失效强制踢回登录
        }
        return Promise.reject(error);
    }
);

export default request;
