import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate("replyTo", "text senderId"); // Populate reply information
    
    // Filter out messages deleted for the current user
    const filteredMessages = messages.filter(message => 
      !message.deletedFor.includes(myId)
    );

    // Mark messages as delivered if they were sent to current user and not already seen
    const messagesToMark = filteredMessages.filter(
      msg => 
        msg.receiverId.toString() === myId.toString() && 
        msg.status !== "seen"
    );

    if (messagesToMark.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: messagesToMark.map(msg => msg._id) },
          status: { $ne: "seen" }
        },
        { 
          status: "delivered",
          deliveredAt: new Date()
        }
      );

      // Notify the sender that messages were delivered
      const receiverSocketId = getReceiverSocketId(userToChatId);
      if (receiverSocketId) {
        messagesToMark.forEach(msg => {
          io.to(receiverSocketId).emit("messageDelivered", { 
            messageId: msg._id, 
            deliveredAt: new Date() 
          });
        });
      }
    }

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, replyToId, attachmentType } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Create message data
    const messageData = {
      senderId,
      receiverId,
      text: text || "",
      status: "sent"
    };

    // Handle file uploads
    if (req.files && req.files.attachment) {
      const file = req.files.attachment;
      
      // Upload file to cloudinary based on type
      let uploadResult;
      if (attachmentType === 'image') {
        uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: 'image',
          folder: 'chat_images'
        });
        messageData.image = uploadResult.secure_url;
      } else if (attachmentType === 'voice') {
        uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: 'auto',
          folder: 'chat_audio'
        });
        messageData.attachment = uploadResult.secure_url;
        messageData.type = 'voice';
        
        // Parse duration carefully to ensure it's a valid number
        let duration = 0;
        if (req.body.duration) {
          try {
            duration = parseFloat(req.body.duration);
            if (isNaN(duration) || !isFinite(duration)) {
              duration = 0;
            }
          } catch (err) {
            console.error("Error parsing voice message duration:", err);
          }
        }
        
        messageData.duration = duration;
        console.log("Voice message duration saved:", duration);
      } else {
        // Document or other file types
        uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: 'auto',
          folder: 'chat_documents'
        });
        messageData.attachment = uploadResult.secure_url;
        messageData.type = 'document';
        messageData.fileName = file.name;
      }
    }

    // Add reply data if this is a reply
    if (replyToId) {
      const replyToMessage = await Message.findById(replyToId);
      if (replyToMessage) {
        messageData.isReply = true;
        messageData.replyTo = replyToId;
      }
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Populate the replyTo field if needed
    if (replyToId) {
      await newMessage.populate("replyTo", "text senderId");
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Validate messageId
    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only mark as seen if the current user is the recipient
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to mark this message as seen" });
    }

    // Update message status only if not already seen
    if (message.status !== "seen") {
      message.status = "seen";
      message.seenAt = new Date();
      await message.save();

      // Notify the sender
      const senderSocketId = getReceiverSocketId(message.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSeen", { 
          messageId: message._id, 
          seenAt: message.seenAt 
        });
      }
    }

    res.status(200).json({ message: "Message marked as seen" });
  } catch (error) {
    console.log("Error in markMessageSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow editing of own messages
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to edit this message" });
    }

    // Check 15-minute time limit for editing
    const messageDate = new Date(message.createdAt);
    const currentDate = new Date();
    const timeDifference = (currentDate - messageDate) / (1000 * 60); // in minutes
    
    if (timeDifference > 15) {
      return res.status(400).json({ error: "Cannot edit messages older than 15 minutes" });
    }

    // Save the original text to edit history
    if (!message.isEdited) {
      message.editHistory = [{
        text: message.text,
        editedAt: message.createdAt
      }];
    } else {
      message.editHistory.push({
        text: message.text,
        editedAt: new Date()
      });
    }

    // Update the message
    message.text = text;
    message.isEdited = true;
    await message.save();

    // Notify the receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body; // "everyone" or "me"
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (deleteType === "everyone") {
      // Only message sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Unauthorized to delete this message for everyone" });
      }

      message.isDeleted = true;
      await message.save();

      // Notify the receiver
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId: message._id,
          deleteType: "everyone"
        });
      }
    } else if (deleteType === "me") {
      // Anyone can delete for themselves
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    } else {
      return res.status(400).json({ error: "Invalid delete type" });
    }

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id.toString();

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get current reactions or initialize empty map
    const reactions = message.reactions || new Map();
    
    // Get users who reacted with this emoji
    let emojiReactions = reactions.get(emoji) || [];
    
    // Check if user already reacted with this emoji
    const userIndex = emojiReactions.findIndex(id => id.toString() === userId);
    
    if (userIndex !== -1) {
      // User already reacted with this emoji, remove the reaction
      emojiReactions.splice(userIndex, 1);
    } else {
      // Add new reaction
      emojiReactions.push(userId);
    }
    
    // Update reactions in the database
    if (emojiReactions.length === 0) {
      // Remove emoji key if no reactions left
      reactions.delete(emoji);
    } else {
      reactions.set(emoji, emojiReactions);
    }
    
    message.reactions = reactions;
    await message.save();

    // Notify both users about the reaction update
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", { messageId, reactions: Object.fromEntries(reactions) });
    }
    
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageReaction", { messageId, reactions: Object.fromEntries(reactions) });
    }

    res.status(200).json({ messageId, reactions: Object.fromEntries(reactions) });
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageDelivered = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only mark as delivered if the current user is the recipient
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to mark this message as delivered" });
    }

    // Update message status only if it's currently "sent"
    if (message.status === "sent") {
      message.status = "delivered";
      message.deliveredAt = new Date();
      await message.save();

      // Notify the sender
      const senderSocketId = getReceiverSocketId(message.senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", { 
          messageId: message._id, 
          deliveredAt: message.deliveredAt 
        });
      }
    }

    res.status(200).json({ message: "Message marked as delivered" });
  } catch (error) {
    console.log("Error in markMessageDelivered controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin a message
export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is part of the conversation
    const isConversationMember = 
      message.senderId.toString() === userId.toString() || 
      message.receiverId.toString() === userId.toString();

    if (!isConversationMember) {
      return res.status(403).json({ error: "Unauthorized to pin this message" });
    }

    // Pin the message for the conversation
    if (!message.isPinned) {
      message.isPinned = true;
      message.pinnedBy = userId;
      message.pinnedAt = new Date();
      await message.save();
    }

    // Notify the other user if they're online
    const otherUserId = message.senderId.toString() === userId.toString() 
      ? message.receiverId 
      : message.senderId;
    
    const otherUserSocketId = getReceiverSocketId(otherUserId);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messagePinned", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in pinMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unpin a message
export const unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is part of the conversation
    const isConversationMember = 
      message.senderId.toString() === userId.toString() || 
      message.receiverId.toString() === userId.toString();

    if (!isConversationMember) {
      return res.status(403).json({ error: "Unauthorized to unpin this message" });
    }

    // Only allow the user who pinned it or conversation members to unpin
    if (message.isPinned) {
      message.isPinned = false;
      message.pinnedBy = null;
      message.pinnedAt = null;
      await message.save();
    }

    // Notify the other user if they're online
    const otherUserId = message.senderId.toString() === userId.toString() 
      ? message.receiverId 
      : message.senderId;
    
    const otherUserSocketId = getReceiverSocketId(otherUserId);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messageUnpinned", { messageId: message._id });
    }

    res.status(200).json({ message: "Message unpinned successfully" });
  } catch (error) {
    console.log("Error in unpinMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all pinned messages for a conversation
export const getPinnedMessages = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const myId = req.user._id;

    // Find all pinned messages between the two users
    const pinnedMessages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
      isPinned: true,
      deletedFor: { $ne: myId } // Don't include messages deleted for current user
    }).populate("replyTo", "text senderId").sort({ pinnedAt: -1 });

    res.status(200).json(pinnedMessages);
  } catch (error) {
    console.log("Error in getPinnedMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward a message to another user with original sender info
export const forwardMessage = async (req, res) => {
  try {
    const { messageId, receiverId } = req.params;
    const senderId = req.user._id;

    // Find the original message
    const originalMessage = await Message.findById(messageId)
      .populate("senderId", "fullName profilePic");
      
    if (!originalMessage) {
      return res.status(404).json({ error: "Original message not found" });
    }

    // Check if the message is deleted for everyone
    if (originalMessage.isDeleted) {
      return res.status(400).json({ error: "Cannot forward a deleted message" });
    }

    // Create a new message with the same content
    const newMessage = new Message({
      senderId,
      receiverId,
      text: originalMessage.text,
      isForwarded: true,
      originalMessageId: originalMessage._id,
      originalSenderId: originalMessage.senderId._id,
      originalSenderName: originalMessage.senderId.fullName,
      type: originalMessage.type || "text", // Ensure type is copied
    });

    // Handle attachments based on message type
    if (originalMessage.image) {
      newMessage.image = originalMessage.image;
      if (!newMessage.type || newMessage.type === "text") {
        newMessage.type = "image";
      }
    }

    if (originalMessage.attachment) {
      newMessage.attachment = originalMessage.attachment;
      
      // Set appropriate type and additional properties based on original message
      if (originalMessage.type === 'voice') {
        newMessage.type = 'voice';
        newMessage.duration = originalMessage.duration;
      } else if (originalMessage.type === 'document') {
        newMessage.type = 'document';
        newMessage.fileName = originalMessage.fileName;
      }
    }

    // Save the new message
    await newMessage.save();

    // Send real-time update using socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // If receiver is online, send the message in real-time
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    console.error("Error in forwardMessage controller:", error.message);
    res.status(500).json({ error: "Failed to forward message" });
  }
};
