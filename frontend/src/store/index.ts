import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import game from './gameSlice';

export const store = configureStore({ reducer: { auth, game } });
export type RootState = ReturnType<typeof store.getState>;
