import { io } from "socket.io-client";

let socket = null;

export const initSocket = (userId) => {
  if (!socket && userId) {
    socket = io("http://localhost:5001", {
      withCredentials: true,
      query: { userId }
    });
  }
};

export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized. Call initSocket(userId) first.");
  }
  return socket;
};
