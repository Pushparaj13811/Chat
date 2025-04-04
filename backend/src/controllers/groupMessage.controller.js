import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Get messages for a specific group
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    if (!group.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Get messages for the group
    const messages = await GroupMessage.find({
      groupId,
      isDeleted: false
    })
    .populate("senderId", "fullName email profilePic")
    .populate("replyTo", "text senderId")
    .sort({ createdAt: 1 });

    // Filter out messages deleted for the current user
    const filteredMessages = messages.filter(message => 
      !message.deletedFor.includes(userId)
    );

    // Mark messages as read by current user
    const unreadMessages = filteredMessages.filter(
      message => 
        message.senderId._id.toString() !== userId.toString() && 
        !message.readBy.some(read => read.userId.toString() === userId.toString())
    );

    if (unreadMessages.length > 0) {
      const updatePromises = unreadMessages.map(message => {
        message.readBy.push({ userId, readAt: new Date() });
        return message.save();
      });
      
      await Promise.all(updatePromises);
      
      // Notify senders that their messages were read
      unreadMessages.forEach(message => {
        const senderSocketId = getReceiverSocketId(message.senderId._id);
        if (senderSocketId) {
          io.to(senderSocketId).emit("groupMessageRead", {
            messageId: message._id,
            groupId,
            readByUserId: userId,
            readAt: new Date()
          });
        }
      });
    }

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, replyToId, attachmentType } = req.body;
    const senderId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    if (!group.members.some(memberId => memberId.toString() === senderId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Create message data
    const messageData = {
      senderId,
      groupId,
      text: text || "",
      readBy: [{ userId: senderId, readAt: new Date() }]
    };

    // Handle file uploads
    if (req.files && req.files.attachment) {
      const file = req.files.attachment;
      
      // Upload file to cloudinary based on type
      let uploadResult;
      if (attachmentType === 'image') {
        uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: 'image',
          folder: 'group_chat_images'
        });
        messageData.image = uploadResult.secure_url;
        messageData.type = 'image';
      } else if (attachmentType === 'voice') {
        uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: 'auto',
          folder: 'group_chat_audio'
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
      } else {
        // Document or other file types
        uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
          resource_type: 'auto',
          folder: 'group_chat_documents'
        });
        messageData.attachment = uploadResult.secure_url;
        messageData.type = 'document';
        messageData.fileName = file.name;
      }
    }

    // Add reply data if this is a reply
    if (replyToId) {
      const replyToMessage = await GroupMessage.findById(replyToId);
      if (replyToMessage) {
        messageData.isReply = true;
        messageData.replyTo = replyToId;
      }
    }

    const newMessage = new GroupMessage(messageData);
    await newMessage.save();

    // Populate the sender and replyTo fields
    await newMessage.populate("senderId", "fullName email profilePic");
    if (replyToId) {
      await newMessage.populate("replyTo", "text senderId");
    }

    // Update group's last activity
    group.lastActivity = new Date();
    await group.save();

    // Notify group members about the new message
    group.members.forEach(memberId => {
      if (memberId.toString() !== senderId.toString()) {
        const receiverSocketId = getReceiverSocketId(memberId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newGroupMessage", {
            message: newMessage,
            groupId
          });
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit a group message
export const editGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    // Check if message type is text
    if (message.type !== "text") {
      return res.status(400).json({ error: "Only text messages can be edited" });
    }

    // Save the previous text in edit history
    message.editHistory.push({
      text: message.text,
      editedAt: new Date()
    });

    // Update the message
    message.text = text;
    message.isEdited = true;
    await message.save();

    await message.populate("senderId", "fullName email profilePic");
    if (message.isReply) {
      await message.populate("replyTo", "text senderId");
    }

    // Notify group members about the edited message
    const group = await Group.findById(message.groupId);
    if (group) {
      group.members.forEach(memberId => {
        if (memberId.toString() !== userId.toString()) {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) {
            io.to(socketId).emit("groupMessageEdited", message);
          }
        }
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a group message
export const deleteGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body; // "forMe" or "forEveryone"
    const userId = req.user._id;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check permissions based on delete type
    if (deleteType === "forEveryone" && message.senderId.toString() !== userId.toString()) {
      // Check if user is group admin or creator
      const group = await Group.findById(message.groupId);
      const isAdminOrCreator = 
        group && 
        (group.creator.toString() === userId.toString() || 
         group.admins.some(adminId => adminId.toString() === userId.toString()));

      if (!isAdminOrCreator) {
        return res.status(403).json({ 
          error: "Only message sender, group creator, or admins can delete messages for everyone" 
        });
      }
    }

    if (deleteType === "forEveryone") {
      // Mark as deleted for everyone
      message.isDeleted = true;
      message.deletedFor = [];
      await message.save();

      // Notify group members about the deleted message
      const group = await Group.findById(message.groupId);
      if (group) {
        group.members.forEach(memberId => {
          if (memberId.toString() !== userId.toString()) {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("groupMessageDeleted", { 
                messageId: message._id, 
                groupId: message.groupId,
                deleteType 
              });
            }
          }
        });
      }
    } else {
      // Delete just for the current user
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add reaction to a group message
export const addGroupMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is a member of the group
    const group = await Group.findById(message.groupId);
    if (!group || !group.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Convert Map to Object to manipulate it
    const reactions = message.reactions ? Object.fromEntries(message.reactions) : {};
    
    // Initialize the emoji array if it doesn't exist
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }
    
    // Toggle the reaction
    const userIdStr = userId.toString();
    const userIndex = reactions[emoji].findIndex(id => id.toString() === userIdStr);
    
    if (userIndex > -1) {
      // Remove the reaction if it exists
      reactions[emoji].splice(userIndex, 1);
      
      // Remove the emoji from reactions if no users are left
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add the reaction if it doesn't exist
      reactions[emoji].push(userId);
      
      // Remove user from other emoji reactions (one emoji per user)
      Object.keys(reactions).forEach(e => {
        if (e !== emoji) {
          reactions[e] = reactions[e].filter(id => id.toString() !== userIdStr);
          if (reactions[e].length === 0) {
            delete reactions[e];
          }
        }
      });
    }
    
    // Convert reactions back to a Map and save
    message.reactions = new Map(Object.entries(reactions));
    await message.save();

    // Notify group members about the reaction change
    group.members.forEach(memberId => {
      if (memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("groupMessageReaction", { 
            messageId: message._id, 
            groupId: message.groupId,
            reactions: message.reactions
          });
        }
      }
    });

    res.status(200).json({ messageId, reactions: message.reactions });
  } catch (error) {
    console.error("Error in addGroupMessageReaction controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward a message to a group
export const forwardGroupMessage = async (req, res) => {
  try {
    const { messageId, groupId } = req.params;
    const userId = req.user._id;

    // Check if source message exists
    const originalMessage = await GroupMessage.findById(messageId);
    if (!originalMessage && !req.body.originalMessage) {
      return res.status(404).json({ error: "Source message not found" });
    }

    // If message comes from direct chat
    if (req.body.originalMessage) {
      const { text, senderId, senderName, type, image, attachment, fileName, duration } = req.body.originalMessage;
      
      // Check if target group exists and user is a member
      const targetGroup = await Group.findById(groupId);
      if (!targetGroup) {
        return res.status(404).json({ error: "Target group not found" });
      }

      if (!targetGroup.members.some(memberId => memberId.toString() === userId.toString())) {
        return res.status(403).json({ error: "You are not a member of the target group" });
      }

      // Create forwarded message
      const forwardedMessage = new GroupMessage({
        senderId: userId,
        groupId,
        text: text || "",
        type: type || "text",
        image,
        attachment,
        fileName,
        duration,
        isForwarded: true,
        originalSenderId: senderId,
        originalSenderName: senderName,
        readBy: [{ userId, readAt: new Date() }]
      });

      await forwardedMessage.save();
      await forwardedMessage.populate("senderId", "fullName email profilePic");

      // Update group's last activity
      targetGroup.lastActivity = new Date();
      await targetGroup.save();

      // Notify group members about the new message
      targetGroup.members.forEach(memberId => {
        if (memberId.toString() !== userId.toString()) {
          const receiverSocketId = getReceiverSocketId(memberId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newGroupMessage", {
              message: forwardedMessage,
              groupId
            });
          }
        }
      });

      res.status(201).json(forwardedMessage);
    }
    // If message is from another group
    else {
      // Check if target group exists and user is a member
      const targetGroup = await Group.findById(groupId);
      if (!targetGroup) {
        return res.status(404).json({ error: "Target group not found" });
      }

      if (!targetGroup.members.some(memberId => memberId.toString() === userId.toString())) {
        return res.status(403).json({ error: "You are not a member of the target group" });
      }

      // Create forwarded message
      const forwardedMessage = new GroupMessage({
        senderId: userId,
        groupId,
        text: originalMessage.text || "",
        type: originalMessage.type || "text",
        image: originalMessage.image,
        attachment: originalMessage.attachment,
        fileName: originalMessage.fileName,
        duration: originalMessage.duration,
        isForwarded: true,
        originalMessageId: originalMessage._id,
        originalSenderId: originalMessage.senderId,
        originalSenderName: (await originalMessage.populate("senderId", "fullName")).senderId.fullName,
        readBy: [{ userId, readAt: new Date() }]
      });

      await forwardedMessage.save();
      await forwardedMessage.populate("senderId", "fullName email profilePic");

      // Update group's last activity
      targetGroup.lastActivity = new Date();
      await targetGroup.save();

      // Notify group members about the new message
      targetGroup.members.forEach(memberId => {
        if (memberId.toString() !== userId.toString()) {
          const receiverSocketId = getReceiverSocketId(memberId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newGroupMessage", {
              message: forwardedMessage,
              groupId
            });
          }
        }
      });

      res.status(201).json(forwardedMessage);
    }
  } catch (error) {
    console.error("Error in forwardGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin a message in a group
export const pinGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is admin or creator
    const group = await Group.findById(message.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdminOrCreator = 
      group.creator.toString() === userId.toString() || 
      group.admins.some(adminId => adminId.toString() === userId.toString());

    if (!isAdminOrCreator) {
      return res.status(403).json({ error: "Only group admins can pin messages" });
    }

    // Pin the message
    message.isPinned = true;
    message.pinnedBy = userId;
    message.pinnedAt = new Date();
    await message.save();

    await message.populate("senderId", "fullName email profilePic");
    await message.populate("pinnedBy", "fullName");

    // Notify group members about the pinned message
    group.members.forEach(memberId => {
      if (memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("groupMessagePinned", {
            message,
            groupId: group._id,
            pinnedBy: userId
          });
        }
      }
    });

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in pinGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unpin a message in a group
export const unpinGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.isPinned) {
      return res.status(400).json({ error: "Message is not pinned" });
    }

    // Check if user is admin, creator, or the one who pinned the message
    const group = await Group.findById(message.groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdminOrCreator = 
      group.creator.toString() === userId.toString() || 
      group.admins.some(adminId => adminId.toString() === userId.toString());
    const isPinner = message.pinnedBy.toString() === userId.toString();

    if (!isAdminOrCreator && !isPinner) {
      return res.status(403).json({ error: "You don't have permission to unpin this message" });
    }

    // Unpin the message
    message.isPinned = false;
    message.pinnedBy = undefined;
    message.pinnedAt = undefined;
    await message.save();

    // Notify group members about the unpinned message
    group.members.forEach(memberId => {
      if (memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("groupMessageUnpinned", {
            messageId: message._id,
            groupId: group._id,
            unpinnedBy: userId
          });
        }
      }
    });

    res.status(200).json({ message: "Message unpinned successfully" });
  } catch (error) {
    console.error("Error in unpinGroupMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pinned messages in a group
export const getGroupPinnedMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Get pinned messages
    const pinnedMessages = await GroupMessage.find({
      groupId,
      isPinned: true,
      isDeleted: false
    })
    .populate("senderId", "fullName email profilePic")
    .populate("pinnedBy", "fullName")
    .sort({ pinnedAt: -1 });

    // Filter out messages deleted for the current user
    const filteredMessages = pinnedMessages.filter(message => 
      !message.deletedFor.includes(userId)
    );

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.error("Error in getGroupPinnedMessages controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 