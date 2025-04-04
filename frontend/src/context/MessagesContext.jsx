import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import { useSocketContext } from "./SocketContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const MessagesContext = createContext();

export const useMessagesContext = () => {
  return useContext(MessagesContext);
};

export const MessagesContextProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { authUser } = useAuthStore();
  const { socket } = useSocketContext();
  const { 
    setSelectedUser, 
    selectedUser, 
    getMessages,
    markMessageAsDelivered,
    markMessageAsSeen
  } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.receiverId === authUser?._id) {
        markMessageAsDelivered(message._id);
        
        // No longer automatically marking as seen when a new message comes in
        // The message will be marked as seen when the user actually views it in ChatContainer
      }
    };

    const handleMessageDelivered = ({ messageId, deliveredAt }) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === messageId 
            ? { ...message, status: "delivered", deliveredAt } 
            : message
        )
      );
    };

    const handleMessageSeen = ({ messageId, seenAt }) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === messageId 
            ? { ...message, status: "seen", seenAt } 
            : message
        )
      );
    };

    const handleMessageEdited = (updatedMessage) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === updatedMessage._id 
            ? updatedMessage 
            : message
        )
      );
    };

    const handleMessageDeleted = ({ messageId, deleteType }) => {
      if (deleteType === "everyone") {
        setMessages((prev) => 
          prev.map((message) => 
            message._id === messageId 
              ? { ...message, isDeleted: true } 
              : message
          )
        );
      } else {
        // For "me" deletion, message will be filtered out when the messages are fetched again
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages((prev) => 
        prev.map((message) => 
          message._id === messageId 
            ? { ...message, reactions } 
            : message
        )
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageSeen", handleMessageSeen);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDelivered", handleMessageDelivered);
      socket.off("messageSeen", handleMessageSeen);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReaction", handleMessageReaction);
    };
  }, [socket, authUser, selectedUser, markMessageAsDelivered, markMessageAsSeen]);

  // Define getConversations with useCallback to prevent it from changing on every render
  const getConversations = useCallback(async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/api/messages/users");
      setConversations(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching conversations");
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    getConversations();
  }, [authUser, getConversations]);

  const sendMessage = async (receiverId, message, image, replyToId) => {
    try {
      const res = await fetch(`/api/messages/send/${receiverId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message, image, replyToId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error sending message");
      }
      return data;
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
        
        // Only mark messages as delivered initially, not seen
        const receivedMessages = data.filter(msg => 
          msg.senderId === conversationId && msg.status === "sent"
        );
        
        for (const msg of receivedMessages) {
          markMessageAsDelivered(msg._id);
        }
      } else {
        throw new Error(data.error || "Error fetching messages");
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const editMessage = async (messageId, newText) => {
    try {
      const res = await fetch(`/api/messages/edit/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newText }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error editing message");
      }
      
      // Update message locally
      setMessages(prev => 
        prev.map(msg => msg._id === messageId ? data : msg)
      );
      
      return data;
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const deleteMessage = async (messageId, deleteType) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteType }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error deleting message");
      }
      
      // Update messages locally
      if (deleteType === "everyone") {
        setMessages(prev => 
          prev.map(msg => msg._id === messageId ? { ...msg, isDeleted: true } : msg)
        );
      } else {
        // For "me" deletion, remove the message from the array
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const res = await fetch(`/api/messages/reaction/${messageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error adding reaction");
      }
      
      // Update message with reaction data locally
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  const value = {
    messages,
    loading,
    error,
    selectedConversation,
    setSelectedConversation,
    conversations,
    isLoading,
    getConversations,
    sendMessage,
    fetchMessages,
    editMessage,
    deleteMessage,
    addReaction,
    replyTo,
    setReplyTo,
    handleSelectUser,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

export default MessagesContext; 