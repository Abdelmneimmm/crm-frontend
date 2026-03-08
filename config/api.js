import axios from 'axios';

// غيّر الـ IP ده لـ IP اللابتوب بتاعكconst BASE_URL = 'https://crm-server-three-blond.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = null;

export const setToken = (token) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearToken = () => {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
};

export const getToken = () => authToken;

export default api;