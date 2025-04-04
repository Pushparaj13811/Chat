import { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";

const SocketContext = createContext(null);

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const { socket, authUser, onlineUsers } = useAuthStore();
  const setSocket = useChatStore((state) => state.setSocket);
  const { initializeCallFeature } = useCallStore();

  useEffect(() => {
    if (authUser && !socket) {
      useAuthStore.getState().connectSocket();
    }
    
    // Update socket in chat store if it exists
    if (socket) {
      setSocket(socket);
      
      // Initialize call features when socket is available
      setTimeout(() => {
        initializeCallFeature();
      }, 500); // Small delay to ensure socket is fully connected
    }
    
    return () => {
      if (socket) {
        useAuthStore.getState().disconnectSocket();
      }
    };
  }, [authUser, socket, setSocket, initializeCallFeature]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext; 