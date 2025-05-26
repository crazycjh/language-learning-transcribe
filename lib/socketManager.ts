import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io("http://localhost:8001");
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance?.id);
    })
    
  }else{
    console.log("Socket already connected:", socketInstance?.id);
  }

  return socketInstance;
};

export const disconnect = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("Socket connection closed");
  }
};

export const removeAllListeners = (eventName: string) => {
  if (socketInstance) {
    socketInstance.removeAllListeners(eventName);
    console.log(`Removed all listeners for event: ${eventName}`);
  }
};

// Create a default export with all the functions
const SocketManager = {
  getSocket,
  disconnect,
  removeAllListeners,
};

export default SocketManager;
