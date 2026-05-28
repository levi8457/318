import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/api/request';

export interface UserInfo {
  id: string;
  username: string;
  role: 'admin' | 'consultant';
  realName: string;
  phone: string;
  avatar?: string;
  isActive: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  function safeParseUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }

  const token = ref(localStorage.getItem('accessToken') || '');
  const user = ref<UserInfo | null>(safeParseUser());

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isConsultant = computed(() => user.value?.role === 'consultant');

  async function login(username: string, password: string) {
    const res: any = await request.post('/auth/login', { username, password });
    token.value = res.accessToken;
    user.value = res.user;
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  }

  async function fetchProfile() {
    const res: any = await request.get('/auth/profile');
    user.value = res;
    localStorage.setItem('user', JSON.stringify(res));
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  return { token, user, isLoggedIn, isAdmin, isConsultant, login, fetchProfile, logout };
});
