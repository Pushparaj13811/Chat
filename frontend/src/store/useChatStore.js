import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  selectedUser: null,
  messages: [],
  pinnedMessages: [],
  users: [],
  isMessagesLoading: false,
  isUsersLoading: false,
  replyTo: null,
  socket: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  // Get all users for the sidebar
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
      console.error("Error fetching users:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Get messages between the current user and the selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`);
      set({ messages: res.data });

      // Mark messages as seen if they're from the other user
      const receivedMessages = res.data.filter(
        (msg) => msg.senderId === userId && msg.status !== "seen"
      );
      
      for (const msg of receivedMessages) {
        get().markMessageAsSeen(msg._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message to another user
  sendMessage: async (receiverId, text, attachment, attachmentType, replyToId) => {
    // Create a temporary message ID for local tracking
    const tempId = `temp-${Date.now()}`;
    const authUser = useAuthStore.getState().authUser;
    
    // Create a temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId,
      text: text || "",
      status: "sending",
      createdAt: new Date().toISOString(),
      uploadProgress: attachment ? 0 : null,
      isUploading: !!attachment,
      tempAttachment: null,
    };
    
    // Add specific attachment properties based on type
    if (attachment) {
      if (attachmentType === 'image') {
        // For images, use the imagePreview data URL for immediate display
        if (typeof attachment === 'string' && attachment.startsWith('data:image')) {
          tempMessage.image = attachment;
        } else {
          // If it's a file, create a local URL for preview
          tempMessage.image = URL.createObjectURL(attachment);
        }
      } else if (attachmentType === 'voice') {
        // For voice messages, create a local URL for playback
        tempMessage.type = 'voice';
        tempMessage.tempAttachment = URL.createObjectURL(attachment);
        tempMessage.duration = attachment.duration || 0;
      } else if (attachmentType === 'document') {
        // For documents, just store the file name
        tempMessage.type = 'document';
        tempMessage.fileName = attachment.name;
      }
    }
    
    // If this is a reply, add reply data
    if (replyToId) {
      const messages = get().messages;
      const replyToMessage = messages.find(msg => msg._id === replyToId);
      if (replyToMessage) {
        tempMessage.isReply = true;
        tempMessage.replyTo = replyToMessage;
      }
    }
    
    // Add the temporary message to the UI immediately
    set(state => ({
      messages: [...state.messages, tempMessage]
    }));
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("text", text || "");
      if (replyToId) formData.append("replyToId", replyToId);
      
      // Handle different types of attachments
      if (attachment) {
        // If it's a base64 image string (from imagePreview)
        if (typeof attachment === 'string' && attachment.startsWith('data:image')) {
          // Convert base64 to blob
          const response = await fetch(attachment);
          const blob = await response.blob();
          formData.append("attachment", blob, "image.jpg");
          formData.append("attachmentType", "image");
        } 
        // If it's a file object
        else if (attachment instanceof Blob || attachment instanceof File) {
          formData.append("attachment", attachment, attachment.name || "file");
          formData.append("attachmentType", attachmentType || "document");
          
          // If this is a voice message, also include the duration explicitly
          if (attachmentType === 'voice' && attachment.duration) {
            formData.append("duration", attachment.duration.toString());
            console.log("Sending voice message with duration:", attachment.duration);
          }
        }
      }
      
      // Send the actual request with upload progress tracking
      const res = await axiosInstance.post(`/api/messages/send/${receiverId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Calculate and update progress percentage
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            // Update the temporary message with upload progress
            set(state => ({
              messages: state.messages.map(msg => 
                msg._id === tempId 
                  ? { ...msg, uploadProgress: progress }
                  : msg
              )
            }));
          }
        }
      });
      
      // Update the temporary message with the real message data after upload
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? { ...res.data, uploadProgress: 100, isUploading: false } : msg
        ),
        replyTo: null,
      }));

      return res.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Update the temporary message to show error status
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: "error", isUploading: false, hasError: true }
            : msg
        )
      }));
      
      toast.error(error.response?.data?.message || "Error sending message");
      throw error;
    }
  },

  // Add a new function to retry failed uploads
  retryMessageUpload: async (messageId) => {
    try {
      // Find the failed message
      const failedMessage = get().messages.find(msg => msg._id === messageId);
      if (!failedMessage) return;
      
      // Reset status to sending and uploading
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, status: "sending", isUploading: true, uploadProgress: 0, hasError: false }
            : msg
        )
      }));
      
      // Extract necessary data for resending
      const { receiverId, text, image, tempAttachment, type, replyTo } = failedMessage;
      
      // Recreate attachment from temporary data
      let attachment = null;
      let attachmentType = null;
      
      if (image && image.startsWith('blob:')) {
        // We need to retrieve the file from the cache
        try {
          const response = await fetch(image);
          attachment = await response.blob();
          attachmentType = 'image';
        } catch (err) {
          console.error("Failed to retrieve cached image:", err);
        }
      } else if (tempAttachment && type === 'voice') {
        try {
          const response = await fetch(tempAttachment);
          attachment = await response.blob();
          attachmentType = 'voice';
        } catch (err) {
          console.error("Failed to retrieve cached audio:", err);
        }
      }
      
      // Call the regular send function with the retrieved data
      await get().sendMessage(
        receiverId, 
        text, 
        attachment, 
        attachmentType, 
        replyTo?._id
      );
      
      // Remove the original failed message
      set(state => ({
        messages: state.messages.filter(msg => msg._id !== messageId)
      }));
      
    } catch (error) {
      console.error("Failed to retry message upload:", error);
      toast.error("Failed to retry message upload");
    }
  },

  // Mark a message as delivered
  markMessageAsDelivered: async (messageId) => {
    try {
      const response = await axiosInstance.put(`/api/messages/delivered/${messageId}`);
      
      // Update the message in our local state
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered", deliveredAt: new Date() } : msg
        ),
      }));

      // Emit socket event to notify the sender
      const socket = get().socket;
      if (socket) {
        socket.emit("messageDelivered", { 
          messageId, 
          deliveredAt: new Date() 
        });
      }
      
      return response.data;
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  },

  // Mark a message as seen
  markMessageAsSeen: async (messageId) => {
    try {
      // Don't try to mark undefined or null messageId
      if (!messageId) {
        console.warn("Attempted to mark undefined message as seen");
        return;
      }

      // First check if the message exists in our local state
      const message = get().messages.find(msg => msg._id === messageId);
      if (!message) {
        console.warn(`Message with ID ${messageId} not found in local state`);
        return;
      }

      // Don't send request if message is already seen
      if (message.status === "seen") {
        console.log(`Message ${messageId} is already marked as seen`);
        return;
      }

      // Update local state first for better UX
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, status: "seen", seenAt: new Date() } : msg
        ),
      }));
      
      // Make the API call to mark the message as seen on the server
      const response = await axiosInstance.put(`/api/messages/seen/${messageId}`);
      
      // Only update the rest of the messages after server confirms
      if (response.status === 200) {
        // Emit socket event to notify the sender
        const socket = get().socket;
        if (socket) {
          socket.emit("messageSeen", { 
            messageId, 
            seenAt: new Date() 
          });
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Error marking message as seen:", error);
      // Don't rethrow the error to prevent UI disruption
    }
  },

  // Edit a message
  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/api/messages/edit/${messageId}`, {
        text: newText
      });

      // Update message locally
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      }));

      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error editing message");
      throw error;
    }
  },

  // Delete a message
  deleteMessage: async (messageId, deleteType) => {
    try {
      await axiosInstance.delete(`/api/messages/${messageId}`, {
        data: { deleteType }
      });

      // Update messages locally
      if (deleteType === "everyone") {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg._id === messageId ? { ...msg, isDeleted: true } : msg
          ),
        }));
      } else {
        // For "me" deletion, remove the message from the array
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== messageId),
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting message");
      throw error;
    }
  },

  // Add or remove a reaction from a message
  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/api/messages/reaction/${messageId}`, {
        emoji
      });

      // Update message with reaction data locally
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: res.data.reactions } : msg
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding reaction");
    }
  },

  // Set reply state for replying to messages
  setReplyTo: (replyData) => set({ replyTo: replyData }),

  // Set socket reference
  setSocket: (socket) => set({ socket }),

  // Subscribe to socket events for real-time message updates
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    set({ socket }); // Store the socket reference

    const handleNewMessage = (message) => {
      // Check if message is from the selected user
      if (get().selectedUser?._id === message.senderId) {
        set((state) => ({ messages: [...state.messages, message] }));
        
        // Only mark the message as delivered, not seen
        setTimeout(() => {
          get().markMessageAsDelivered(message._id);
        }, 1000);
        
        // Message will be marked as seen when the user actually views it
        // This is now handled in ChatContainer.jsx based on focus/visibility
      }
    };

    const handleUserOnline = (userId) => {
      // When a user comes online, mark all sent messages to that user as delivered
      const messages = get().messages;
      const pendingMessages = messages.filter(
        (msg) => msg.receiverId === userId && msg.status === "sent"
      );
      
      // Mark each message as delivered
      pendingMessages.forEach((msg) => {
        get().markMessageAsDelivered(msg._id);
      });
    };

    const handleMessageDelivered = ({ messageId, deliveredAt }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId && message.status === "sent"
            ? { ...message, status: "delivered", deliveredAt: new Date(deliveredAt) }
            : message
        ),
      }));
    };

    const handleMessageSeen = ({ messageId, seenAt }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId && (message.status === "sent" || message.status === "delivered")
            ? { ...message, status: "seen", seenAt: new Date(seenAt) }
            : message
        ),
      }));
    };

    const handleMessageEdited = (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === updatedMessage._id ? updatedMessage : message
        ),
      }));
    };

    const handleMessageDeleted = ({ messageId, deleteType }) => {
      if (deleteType === "everyone") {
        set((state) => ({
          messages: state.messages.map((message) =>
            message._id === messageId
              ? { ...message, isDeleted: true }
              : message
          ),
        }));
      } else {
        // For "me" deletion, message will be filtered out when the messages are fetched again
      }
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId ? { ...message, reactions } : message
        ),
      }));
    };

    const handleMessagePinned = (pinnedMessage) => {
      // Update the message in the main messages list
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === pinnedMessage._id ? { ...message, isPinned: true } : message
        ),
      }));
      
      // Add to pinned messages if not already there
      const pinnedMessages = get().pinnedMessages || [];
      const isPinnedAlready = pinnedMessages.some(msg => msg._id === pinnedMessage._id);
      
      if (!isPinnedAlready) {
        set((state) => ({
          pinnedMessages: [...state.pinnedMessages, pinnedMessage]
        }));
        
        // Fetch updated list of pinned messages to ensure we have the latest
        const selectedUserId = get().selectedUser?._id;
        if (selectedUserId) {
          get().getPinnedMessages(selectedUserId);
        }
      }
    };
    
    const handleMessageUnpinned = ({ messageId }) => {
      // Update the message in the main messages list
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId ? { ...message, isPinned: false } : message
        ),
        // Remove from pinned messages array
        pinnedMessages: state.pinnedMessages.filter(msg => msg._id !== messageId)
      }));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userOnline", handleUserOnline);
    socket.on("messageDelivered", handleMessageDelivered);
    socket.on("messageSeen", handleMessageSeen);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("messagePinned", handleMessagePinned);
    socket.on("messageUnpinned", handleMessageUnpinned);

    // Store the event handlers to remove them later
    set({
      messageEventHandlers: {
        newMessage: handleNewMessage,
        userOnline: handleUserOnline,
        messageDelivered: handleMessageDelivered,
        messageSeen: handleMessageSeen,
        messageEdited: handleMessageEdited,
        messageDeleted: handleMessageDeleted,
        messageReaction: handleMessageReaction,
        messagePinned: handleMessagePinned,
        messageUnpinned: handleMessageUnpinned,
      },
    });
  },

  // Unsubscribe from socket events
  unsubscribeFromMessages: () => {
    const socket = get().socket;
    const handlers = get().messageEventHandlers;
    if (!socket || !handlers) return;

    socket.off("newMessage", handlers.newMessage);
    socket.off("userOnline", handlers.userOnline);
    socket.off("messageDelivered", handlers.messageDelivered);
    socket.off("messageSeen", handlers.messageSeen);
    socket.off("messageEdited", handlers.messageEdited);
    socket.off("messageDeleted", handlers.messageDeleted);
    socket.off("messageReaction", handlers.messageReaction);
    socket.off("messagePinned", handlers.messagePinned);
    socket.off("messageUnpinned", handlers.messageUnpinned);

    set({ messageEventHandlers: null });
  },

  // Pin a message
  pinMessage: async (messageId) => {
    try {
      const response = await axiosInstance.post(`/api/messages/${messageId}/pin`);
      
      if (response.status === 200) {
        // Update local state with the pinned message
        const messages = get().messages;
        const pinnedMessages = get().pinnedMessages || [];
        
        // Find the message that was pinned
        const pinnedMessage = messages.find(msg => msg._id === messageId);
        
        if (pinnedMessage) {
          // Add to pinned messages if not already there
          if (!pinnedMessages.some(msg => msg._id === messageId)) {
            set({ 
              pinnedMessages: [...pinnedMessages, {...pinnedMessage, isPinned: true}],
              messages: messages.map(msg => 
                msg._id === messageId ? {...msg, isPinned: true} : msg
              )
            });
          }
        }
      }
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message");
    }
  },
  
  // Unpin a message
  unpinMessage: async (messageId) => {
    try {
      const response = await axiosInstance.post(`/api/messages/${messageId}/unpin`);
      
      if (response.status === 200) {
        // Update local state
        const pinnedMessages = get().pinnedMessages;
        const messages = get().messages;
        
        set({ 
          pinnedMessages: pinnedMessages.filter(msg => msg._id !== messageId),
          messages: messages.map(msg => 
            msg._id === messageId ? {...msg, isPinned: false} : msg
          )
        });
      }
    } catch (error) {
      console.error("Error unpinning message:", error);
      toast.error("Failed to unpin message");
    }
  },
  
  // Get pinned messages for the selected conversation
  getPinnedMessages: async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/messages/pinned/${userId}`);
      
      if (response.status === 200) {
        set({ pinnedMessages: response.data });
      }
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
      // Don't show error toast as this is a background fetch
    }
  },

  // Forward a message to another user
  forwardMessage: async (messageId, receiverId) => {
    try {
      // Call API to forward the message
      const res = await axiosInstance.post(`/api/messages/forward/${messageId}/${receiverId}`);
      
      // If user is in the conversation with the receiver, add message to UI
      if (get().selectedUser?._id === receiverId) {
        set((state) => ({
          messages: [...state.messages, res.data]
        }));
      }
      
      toast.success("Message forwarded successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error forwarding message");
      throw error;
    }
  },
}));
