import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截器：注入 JWT Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理错误，不抛出 rejection 避免 loading 卡死
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '请求失败';

    if (status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      router.push('/login');
      ElMessage.error('登录已过期，请重新登录');
    } else if (status === 403) {
      ElMessage.error('没有权限访问该资源');
    } else {
      ElMessage.error(message);
    }

    // 返回 null 而非抛出 rejection，保证调用方的 loading 状态能正常结束
    return null;
  },
);

export default request;
