import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User { id: number; email: string; name: string }
const saved = localStorage.getItem('user');

const slice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') as string | null,
    user: (saved ? JSON.parse(saved) : null) as User | null,
  },
  reducers: {
    login: (s, a: PayloadAction<{ token: string; user: User }>) => {
      s.token = a.payload.token;
      s.user = a.payload.user;
      localStorage.setItem('token', a.payload.token);
      localStorage.setItem('user', JSON.stringify(a.payload.user));
    },
    logout: (s) => {
      s.token = null;
      s.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
export const { login, logout } = slice.actions;
export default slice.reducer;
