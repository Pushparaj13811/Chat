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
      if (!userToCall || !from || !signal || !callType) {
        console.error("Invalid call data received:", { userToCall, from, hasSignal: !!signal, callType });
        socket.emit("callFailed", { 
          reason: "invalid_data",
          message: "Invalid call data" 
        });
        return;
      }

      // Check if caller is calling themselves on another device/tab
      const callerId = socket.handshake.query.userId;
      if (callerId === userToCall) {
        console.log(`[CALL DEBUG] User ${callerId} is trying to call themselves. Blocking call.`);
        socket.emit("callFailed", { 
          reason: "self_call",
          message: "Cannot call yourself on another session" 
        });
        return;
      }

      console.log(`[CALL DEBUG] Call initiated from ${from.userId} to ${userToCall}, type: ${callType}`);
      console.log(`[CALL DEBUG] User socket map entries:`, Object.keys(userSocketMap).length);
      console.log(`[CALL DEBUG] Socket ID for ${userToCall}:`, userSocketMap[userToCall]);
      
      // Get the active socket for target user
      const userSocketId = userSocketMap[userToCall];
      
      if (userSocketId) {
        // Check if the socket is actually connected
        const targetSocket = io.sockets.sockets.get(userSocketId);
        if (!targetSocket) {
          console.log(`[CALL DEBUG] Target socket exists in map but not in active sockets`);
          
          // Clean up stale entry
          delete userSocketMap[userToCall];
          
          socket.emit("callFailed", { 
            reason: "user_unavailable",
            message: "User is unavailable" 
          });
          return;
        }
        
        console.log(`[CALL DEBUG] Emitting incomingCall event to ${userSocketId}`);
        io.to(userSocketId).emit("incomingCall", { 
          from, 
          signal,
          callType 
        });
        
        console.log(`[CALL DEBUG] Call notification sent to ${userToCall}`);
      } else {
        // If user is not online, inform the caller
        console.log(`[CALL DEBUG] User ${userToCall} is not online/connected`);
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
  socket.on("answerCall", ({ to, signal, isFallback }) => {
    try {
      if (!to || !signal) {
        console.error("Invalid answer call data:", { to, hasSignal: !!signal });
        return;
      }

      console.log(`[CALL DEBUG] Call being answered by ${socket.handshake.query.userId} to ${to}, signal type: ${signal.type || 'unknown'}, is fallback: ${!!isFallback}`);
      
      // Add debug log with SDP info (truncated)
      if (signal.sdp) {
        const sdpPreview = signal.sdp.substring(0, 100) + '...';
        console.log(`[CALL DEBUG] SDP preview: ${sdpPreview}`);
      }
      
      const userSocketId = userSocketMap[to];
      
      if (userSocketId) {
        // Check if the socket is actually connected
        const targetSocket = io.sockets.sockets.get(userSocketId);
        if (!targetSocket) {
          console.log(`[CALL DEBUG] Target socket exists in map but not in active sockets`);
          socket.emit("callFailed", { 
            reason: "user_unavailable",
            message: "User is unavailable" 
          });
          return;
        }
        
        // Ensure the signal type is appropriate for the scenario
        if (!signal.type || signal.type === 'answer') {
          console.log(`[CALL DEBUG] Emitting callAccepted event to ${userSocketId}`);
          io.to(userSocketId).emit("callAccepted", { 
            signal,
            from: socket.handshake.query.userId,
            isFallback
          });
        } else {
          console.log(`[CALL DEBUG] Received unexpected signal type: ${signal.type} during answerCall`);
          
          // Handle the case where we get an offer instead of an answer (signaling conflict)
          if (signal.type === 'offer' && !isFallback) {
            console.log(`[CALL DEBUG] Signaling conflict detected - handling as special case`);
            
            // Send a special error to help client resolve the conflict
            io.to(userSocketId).emit("signalingConflict", {
              from: socket.handshake.query.userId,
              signal: signal,
              timestamp: Date.now()
            });
            
            socket.emit("signalingConflict", {
              from: to,
              timestamp: Date.now()
            });
          }
        }
      } else {
        console.log(`[CALL DEBUG] User ${to} is no longer connected, cannot answer call`);
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

  // WebRTC ICE Candidate debugging
  socket.on("iceCandidate", ({ to, candidate, type }) => {
    try {
      console.log(`[ICE DEBUG] ${type} candidate from ${socket.handshake.query.userId}:`, candidate.candidate);
      
      const userSocketId = userSocketMap[to];
      if (userSocketId) {
        io.to(userSocketId).emit("iceCandidate", {
          from: socket.handshake.query.userId,
          candidate,
          type
        });
      }
    } catch (error) {
      console.error("Error in iceCandidate handler:", error);
    }
  });

  // Log WebRTC connection state changes
  socket.on("webrtcState", ({ state, details }) => {
    console.log(`[WEBRTC DEBUG] User ${socket.handshake.query.userId} connection state: ${state}`, details);
  });

  // Call diagnostic handler
  socket.on("callDiagnostic", (data) => {
    console.log(`[CALL DIAGNOSTIC] From user ${socket.handshake.query.userId}:`, data);
    
    // Send back diagnostic info if requested
    if (data.requestInfo) {
      socket.emit("callDiagnosticInfo", {
        timestamp: new Date().toISOString(),
        userSocketMap: Object.keys(userSocketMap).length,
        socketId: socket.id,
        isSocketInMap: !!Object.entries(userSocketMap).find(([userId, socketId]) => socketId === socket.id),
        activeSocketsCount: io.sockets.sockets.size
      });
    }
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


