import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

// Helper function to get allowed origins
const getAllowedOrigins = () => {
  // Get origins from env or use default
  const origins = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
  return origins.split(',');
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST"],
    credentials: true
  },
});

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", async (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    
    // Update user's online status when they connect
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
      socket.broadcast.emit("userOnline", userId);
    } catch (error) {
      console.error("Error updating user online status:", error);
    }
  }

  // Handle events for new message functionality
  socket.on("messageDelivered", ({ messageId, deliveredAt }) => {
    // Get the sender socket ID and emit only to them
    const receiverSocketId = userSocketMap[socket.handshake.query.userId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDelivered", { messageId, deliveredAt });
    } else {
      // Fallback to broadcast if direct communication not possible
      socket.broadcast.emit("messageDelivered", { messageId, deliveredAt });
    }
  });

  socket.on("messageSeen", ({ messageId, seenAt }) => {
    // Get the sender socket ID and emit only to them
    const receiverSocketId = userSocketMap[socket.handshake.query.userId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageSeen", { messageId, seenAt });
    } else {
      // Fallback to broadcast if direct communication not possible
      socket.broadcast.emit("messageSeen", { messageId, seenAt });
    }
  });

  socket.on("messageEdited", (message) => {
    socket.broadcast.emit("messageEdited", message);
  });

  socket.on("messageDeleted", ({ messageId, deleteType }) => {
    socket.broadcast.emit("messageDeleted", { messageId, deleteType });
  });

  // Handle events for message reactions
  socket.on("messageReaction", ({ messageId, reactions }) => {
    socket.broadcast.emit("messageReaction", { messageId, reactions });
  });

  // Handle sending a new message and increment messageCount
  socket.on("sendMessage", async (message) => {
    const receiverSocketId = userSocketMap[message.receiverId];
    
    // Increment message count for sender
    try {
      if (message.senderId) {
        await User.findByIdAndUpdate(
          message.senderId, 
          { $inc: { messageCount: 1 } }
        );
      }
    } catch (error) {
      console.error("Error updating message count:", error);
    }
    
    if (receiverSocketId) {
      // Send message to specific receiver
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  // Group chat related events
  // Join a group (for real-time updates)
  socket.on("joinGroup", (groupId) => {
    socket.join(`group:${groupId}`);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Leave a group
  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log(`User ${userId} left group ${groupId}`);
  });

  // Send a message to a group
  socket.on("sendGroupMessage", async (groupMessage) => {
    try {
      const { groupId } = groupMessage;
      
      // Broadcast message to all members in the group room
      socket.to(`group:${groupId}`).emit("newGroupMessage", groupMessage);
      
      // Increment message count for sender
      if (groupMessage.senderId) {
        await User.findByIdAndUpdate(
          groupMessage.senderId, 
          { $inc: { messageCount: 1 } }
        );
      }
    } catch (error) {
      console.error("Error in sendGroupMessage socket handler:", error);
    }
  });

  // Group message was read by a user
  socket.on("groupMessageRead", ({ messageId, groupId, readBy }) => {
    socket.to(`group:${groupId}`).emit("groupMessageRead", { 
      messageId, 
      readBy 
    });
  });

  // Group message was edited
  socket.on("groupMessageEdited", (message) => {
    const { groupId } = message;
    socket.to(`group:${groupId}`).emit("groupMessageEdited", message);
  });

  // Group message was deleted
  socket.on("groupMessageDeleted", ({ messageId, groupId, deleteType }) => {
    socket.to(`group:${groupId}`).emit("groupMessageDeleted", { 
      messageId, 
      deleteType 
    });
  });

  // Reaction added to a group message
  socket.on("groupMessageReaction", ({ messageId, groupId, reactions }) => {
    socket.to(`group:${groupId}`).emit("groupMessageReaction", { 
      messageId, 
      reactions 
    });
  });

  // Group message was pinned
  socket.on("groupMessagePinned", ({ messageId, groupId, pinnedBy }) => {
    socket.to(`group:${groupId}`).emit("groupMessagePinned", { 
      messageId, 
      pinnedBy 
    });
  });

  // Group message was unpinned
  socket.on("groupMessageUnpinned", ({ messageId, groupId, unpinnedBy }) => {
    socket.to(`group:${groupId}`).emit("groupMessageUnpinned", { 
      messageId, 
      unpinnedBy 
    });
  });

  // Group was updated (name, description, etc.)
  socket.on("groupUpdated", (group) => {
    socket.to(`group:${group._id}`).emit("groupUpdated", group);
  });

  // WebRTC Video/Audio Call Signaling
  // Initiate a call to another user
  socket.on("callUser", ({ userToCall, from, signal, callType }) => {
    try {
      const userSocketId = userSocketMap[userToCall];
      
      if (userSocketId) {
        io.to(userSocketId).emit("incomingCall", { 
          from, 
          signal,
          callType 
        });
        console.log(`Call initiated from ${from.userId} to ${userToCall}, type: ${callType}`);
      } else {
        // If user is not online, inform the caller
        socket.emit("callFailed", { 
          reason: "user_offline",
          message: "User is offline" 
        });
      }
    } catch (error) {
      console.error("Error in callUser handler:", error);
      socket.emit("callFailed", { 
        reason: "server_error",
        message: "Server error occurred" 
      });
    }
  });

  // Answer an incoming call
  socket.on("answerCall", ({ to, signal }) => {
    try {
      const userSocketId = userSocketMap[to];
      
      if (userSocketId) {
        io.to(userSocketId).emit("callAccepted", { signal });
        console.log(`Call answered by ${socket.handshake.query.userId} to ${to}`);
      }
    } catch (error) {
      console.error("Error in answerCall handler:", error);
    }
  });

  // Reject an incoming call
  socket.on("rejectCall", ({ to }) => {
    try {
      const userSocketId = userSocketMap[to];
      
      if (userSocketId) {
        io.to(userSocketId).emit("callRejected");
        console.log(`Call rejected by ${socket.handshake.query.userId}`);
      }
    } catch (error) {
      console.error("Error in rejectCall handler:", error);
    }
  });

  // Handle busy signal
  socket.on("callBusy", ({ to }) => {
    try {
      const userSocketId = userSocketMap[to];
      
      if (userSocketId) {
        io.to(userSocketId).emit("callBusy");
        console.log(`Busy signal sent to ${to}`);
      }
    } catch (error) {
      console.error("Error in callBusy handler:", error);
    }
  });

  // End an ongoing call
  socket.on("endCall", ({ to }) => {
    try {
      const userSocketId = userSocketMap[to];
      
      if (userSocketId) {
        io.to(userSocketId).emit("callEnded");
        console.log(`Call ended by ${socket.handshake.query.userId} to ${to}`);
      }
    } catch (error) {
      console.error("Error in endCall handler:", error);
    }
  });

  // Handle user typing indication
  socket.on("typing", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId: socket.handshake.query.userId });
    }
  });

  socket.on("stoppedTyping", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { userId: socket.handshake.query.userId });
    }
  });

  // User typing in a group
  socket.on("typingInGroup", ({ groupId }) => {
    socket.to(`group:${groupId}`).emit("userTypingInGroup", { 
      userId: socket.handshake.query.userId,
      groupId 
    });
  });

  socket.on("stoppedTypingInGroup", ({ groupId }) => {
    socket.to(`group:${groupId}`).emit("userStoppedTypingInGroup", { 
      userId: socket.handshake.query.userId,
      groupId 
    });
  });

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle disconnections
  socket.on("disconnect", async () => {
    try {
      // Get userId from socket handshake query
      const userId = socket.handshake.query.userId;
      if (!userId) {
        console.log("No userId found during disconnect");
        return;
      }
      
      console.log(`User disconnected: ${userId}`);
      
      // Remove from userSocketMap
      delete userSocketMap[userId];
      
      // Update user status in database - set as offline and update lastSeen
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
        
        // Broadcast user offline event to other users
        socket.broadcast.emit("userOffline", userId);
        
        // Emit updated online users list
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        
        console.log(`User ${userId} marked as offline`);
      } catch (error) {
        console.error("Error updating user status on disconnect:", error);
      }
    } catch (error) {
      console.error("Error in socket disconnect handler:", error);
    }
  });
});

export { io, app, server };


