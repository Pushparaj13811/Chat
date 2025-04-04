import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const creatorId = req.user._id;
    
    // Extract members from the form data
    let members = [];
    if (req.body.members) {
      // Handle single member or array of members
      members = Array.isArray(req.body.members) 
        ? req.body.members 
        : [req.body.members];
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    let profilePic = "";

    // Handle profile picture upload if provided
    if (req.files && req.files.profilePic) {
      const file = req.files.profilePic;
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        resource_type: 'image',
        folder: 'group_profile_pics'
      });
      profilePic = uploadResult.secure_url;
    }

    // Create the group with initial data
    const newGroup = new Group({
      name,
      description: description || "",
      creator: creatorId,
      admins: [creatorId],
      members: [creatorId, ...members],
      profilePic
    });

    await newGroup.save();

    // Populate creator and members information
    await newGroup.populate([
      { path: "creator", select: "fullName email profilePic" },
      { path: "members", select: "fullName email profilePic" }
    ]);

    // Notify group members about the new group
    newGroup.members.forEach(member => {
      // Skip the creator as they already know
      if (member._id.toString() !== creatorId.toString()) {
        const socketId = getReceiverSocketId(member._id);
        if (socketId) {
          io.to(socketId).emit("newGroup", newGroup);
        }
      }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all groups where the user is a member
    const groups = await Group.find({ 
      members: userId,
      isActive: true 
    })
    .populate("creator", "fullName email profilePic")
    .populate("members", "fullName email profilePic")
    .sort({ lastActivity: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific group by ID
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("creator", "fullName email profilePic")
      .populate("members", "fullName email profilePic")
      .populate("admins", "fullName email profilePic");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member._id.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupById controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update group info
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin or creator
    if (!group.admins.includes(userId) && group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You don't have permission to update this group" });
    }

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    // Handle profile picture update if provided
    if (req.files && req.files.profilePic) {
      const file = req.files.profilePic;
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        resource_type: 'image',
        folder: 'group_profile_pics'
      });
      group.profilePic = uploadResult.secure_url;
    }

    group.lastActivity = new Date();
    await group.save();

    await group.populate([
      { path: "creator", select: "fullName email profilePic" },
      { path: "members", select: "fullName email profilePic" },
      { path: "admins", select: "fullName email profilePic" }
    ]);

    // Notify group members about the update
    group.members.forEach(member => {
      const socketId = getReceiverSocketId(member._id);
      if (socketId) {
        io.to(socketId).emit("groupUpdated", group);
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in updateGroup controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add members to a group
export const addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "Valid members array is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is admin or creator
    if (!group.admins.includes(userId) && group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You don't have permission to add members" });
    }

    // Add new members that aren't already in the group
    const newMembers = members.filter(memberId => 
      !group.members.includes(memberId)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({ error: "All users are already members of this group" });
    }

    group.members.push(...newMembers);
    group.lastActivity = new Date();
    await group.save();

    await group.populate([
      { path: "creator", select: "fullName email profilePic" },
      { path: "members", select: "fullName email profilePic" },
      { path: "admins", select: "fullName email profilePic" }
    ]);

    // Notify new members about being added to the group
    newMembers.forEach(memberId => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("addedToGroup", group);
      }
    });

    // Notify existing members about new members
    group.members.forEach(member => {
      if (!newMembers.includes(member._id.toString()) && member._id.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(member._id);
        if (socketId) {
          io.to(socketId).emit("membersAddedToGroup", { group, newMembers });
        }
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in addGroupMembers controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove a member from a group
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check permissions: User must be an admin to remove others, or removing themselves
    const isAdmin = group.admins.includes(userId) || group.creator.toString() === userId.toString();
    const isSelfRemoval = memberId === userId.toString();

    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({ error: "You don't have permission to remove members" });
    }

    // Check if removing the creator
    if (memberId === group.creator.toString() && !isSelfRemoval) {
      return res.status(403).json({ error: "Cannot remove the group creator" });
    }

    // Remove member from the group
    group.members = group.members.filter(id => id.toString() !== memberId);
    
    // If member was an admin, remove from admins list too
    group.admins = group.admins.filter(id => id.toString() !== memberId);
    
    // If the creator is leaving, assign a new creator if there are admins
    if (isSelfRemoval && userId.toString() === group.creator.toString()) {
      if (group.admins.length > 0) {
        group.creator = group.admins[0];
      } else if (group.members.length > 0) {
        group.creator = group.members[0];
        group.admins.push(group.members[0]);
      } else {
        // No members left, mark group as inactive
        group.isActive = false;
      }
    }

    group.lastActivity = new Date();
    await group.save();

    // Only populate if group is still active
    if (group.isActive) {
      await group.populate([
        { path: "creator", select: "fullName email profilePic" },
        { path: "members", select: "fullName email profilePic" },
        { path: "admins", select: "fullName email profilePic" }
      ]);
    }

    // Notify the removed member
    const removedSocketId = getReceiverSocketId(memberId);
    if (removedSocketId) {
      io.to(removedSocketId).emit("removedFromGroup", {
        groupId,
        isSelfRemoval
      });
    }

    // Notify remaining members
    group.members.forEach(member => {
      if (member._id.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(member._id);
        if (socketId) {
          io.to(socketId).emit("memberRemovedFromGroup", {
            group,
            removedMemberId: memberId,
            removedBy: userId
          });
        }
      }
    });

    res.status(200).json({ message: "Member removed successfully", group });
  } catch (error) {
    console.error("Error in removeGroupMember controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Promote a member to admin
export const promoteToAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is creator or admin
    if (group.creator.toString() !== userId.toString() && !group.admins.includes(userId)) {
      return res.status(403).json({ error: "You don't have permission to promote members" });
    }

    // Check if member exists in the group
    if (!group.members.some(id => id.toString() === memberId)) {
      return res.status(400).json({ error: "User is not a member of this group" });
    }

    // Check if member is already an admin
    if (group.admins.some(id => id.toString() === memberId)) {
      return res.status(400).json({ error: "User is already an admin" });
    }

    group.admins.push(memberId);
    group.lastActivity = new Date();
    await group.save();

    await group.populate([
      { path: "creator", select: "fullName email profilePic" },
      { path: "members", select: "fullName email profilePic" },
      { path: "admins", select: "fullName email profilePic" }
    ]);

    // Notify the promoted member
    const promotedSocketId = getReceiverSocketId(memberId);
    if (promotedSocketId) {
      io.to(promotedSocketId).emit("promotedToAdmin", { groupId, group });
    }

    // Notify other members
    group.members.forEach(member => {
      if (member._id.toString() !== memberId && member._id.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(member._id);
        if (socketId) {
          io.to(socketId).emit("memberPromoted", { 
            group, 
            memberId, 
            promotedBy: userId 
          });
        }
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in promoteToAdmin controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Demote an admin to regular member
export const demoteAdmin = async (req, res) => {
  try {
    const { groupId, adminId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is creator
    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the group creator can demote admins" });
    }

    // Check if admin exists and is not the creator
    if (!group.admins.some(id => id.toString() === adminId) || adminId === group.creator.toString()) {
      return res.status(400).json({ error: "Cannot demote this user" });
    }

    group.admins = group.admins.filter(id => id.toString() !== adminId);
    group.lastActivity = new Date();
    await group.save();

    await group.populate([
      { path: "creator", select: "fullName email profilePic" },
      { path: "members", select: "fullName email profilePic" },
      { path: "admins", select: "fullName email profilePic" }
    ]);

    // Notify the demoted admin
    const demotedSocketId = getReceiverSocketId(adminId);
    if (demotedSocketId) {
      io.to(demotedSocketId).emit("demotedFromAdmin", { groupId, group });
    }

    // Notify other members
    group.members.forEach(member => {
      if (member._id.toString() !== adminId && member._id.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(member._id);
        if (socketId) {
          io.to(socketId).emit("adminDemoted", { 
            group, 
            adminId, 
            demotedBy: userId 
          });
        }
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in demoteAdmin controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete/Deactivate a group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only creator can delete the group
    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the group creator can delete the group" });
    }

    // Mark group as inactive instead of deleting
    group.isActive = false;
    await group.save();

    // Notify all members about group deletion
    group.members.forEach(memberId => {
      if (memberId.toString() !== userId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("groupDeleted", { groupId });
        }
      }
    });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 