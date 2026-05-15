import axios from 'axios';

// 你的 Cloudflare Tunnel 绑定的域名
const PROD_API_URL = 'https://api-pjsk.mizuki.top';

const request = axios.create({
    // 开发模式下走 Vite Proxy (/api)，生产环境下直接请求 CF Tunnel 域名
    baseURL: import.meta.env.DEV ? '/api' : PROD_API_URL,
    timeout: 20000,
});

// 请求拦截器：自动注入 JWT Token
request.interceptors.request.use((config) => {
    const token = localStorage.getItem('pjsk_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：处理登录失效
request.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('pjsk_token');
            // 如果不在登录页，则强制跳转回登录页
            if (!window.location.pathname.includes('login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default request;