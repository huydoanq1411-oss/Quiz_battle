import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
      auth: (cb) => cb({ token: localStorage.getItem('token') }),
      // Wait for Render's free instance to wake up, then reconnect normally.
      timeout: 90_000,
    });
  }
  return socket;
};
export const closeSocket = () => { socket?.disconnect(); socket = null; };
