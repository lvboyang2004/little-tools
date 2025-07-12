import axios from 'axios';

// 创建axios实例
const api = axios.create({
    baseURL: '/',  // 在Vercel环境中，API和前端在同一域名下
    timeout: 30000, // 请求超时时间
});

// 请求拦截器
api.interceptors.request.use(
    config => {
        // 在发送请求之前可以做一些处理
        return config;
    },
    error => {
        // 处理请求错误
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    response => {
        // 对响应数据做一些处理
        return response;
    },
    error => {
        // 处理响应错误
        return Promise.reject(error);
    }
);

export default api; 