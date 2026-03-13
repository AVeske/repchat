import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function connectSocket(accessToken: string) {
  // If token changed, disconnect old socket
  if (socket && currentToken !== accessToken) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL, {
      transports: ["websocket"],
      query: { token: accessToken }, // more reliable than headers in browser
    });

    currentToken = accessToken;
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
