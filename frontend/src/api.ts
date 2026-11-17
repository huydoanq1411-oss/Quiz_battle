import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 90_000 });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export default api;
