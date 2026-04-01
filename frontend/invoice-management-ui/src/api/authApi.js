import apiClient from './apiClient';

export const authApi = {
  login: async (emailOrUsername, password) => {
    const res = await apiClient.post('/api/auth/login', { username: emailOrUsername, password });
    return res.data;
  },
};
