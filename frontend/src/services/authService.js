import api from './api';

export const authService = {
  login: async (credentials) => {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await api.post('/api/auth/login', formData);
    return response.data;
  },
  
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};
