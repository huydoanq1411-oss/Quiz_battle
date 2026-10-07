import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io({ auth: (cb) => cb({ token: localStorage.getItem('token') }) });
  }
  return socket;
};
export const closeSocket = () => { socket?.disconnect(); socket = null; };
