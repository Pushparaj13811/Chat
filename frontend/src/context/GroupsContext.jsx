import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketContext } from "./SocketContext";
import toast from "react-hot-toast";

const GroupsContext = createContext();

export const useGroupsContext = () => {
  return useContext(GroupsContext);
};

export const GroupsContextProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState({});
  const [pinnedGroupMessages, setPinnedGroupMessages] = useState({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupMessages, setIsLoadingGroupMessages] = useState(false);
  const { authUser } = useAuthStore();
  const { socket } = useSocketContext();

  useEffect(() => {
    if (authUser) {
      fetchGroups();
    }
  }, [authUser]);

  useEffect(() => {
    if (socket && selectedGroup) {
      socket.emit("joinGroup", selectedGroup._id);

      // Listen for group-related events
      socket.on("newGroupMessage", handleNewGroupMessage);
      socket.on("groupMessageEdited", handleGroupMessageEdited);
      socket.on("groupMessageDeleted", handleGroupMessageDeleted);
      socket.on("groupMessageRead", handleGroupMessageRead);
      socket.on("groupMessageReaction", handleGroupMessageReaction);
      socket.on("groupMessagePinned", handleGroupMessagePinned);
      socket.on("groupMessageUnpinned", handleGroupMessageUnpinned);
      socket.on("groupUpdated", handleGroupUpdated);
      socket.on("userTypingInGroup", handleUserTypingInGroup);
      socket.on("userStoppedTypingInGroup", handleUserStoppedTypingInGroup);
      socket.on("memberRemovedFromGroup", handleMemberRemoved);
      socket.on("membersAddedToGroup", handleMembersAdded);
      socket.on("adminDemoted", handleAdminDemoted);
      socket.on("memberPromoted", handleMemberPromoted);
      socket.on("groupDeleted", handleGroupDeleted);
      socket.on("removedFromGroup", handleRemovedFromGroup);

      // Clean up on component unmount
      return () => {
        socket.off("newGroupMessage", handleNewGroupMessage);
        socket.off("groupMessageEdited", handleGroupMessageEdited);
        socket.off("groupMessageDeleted", handleGroupMessageDeleted);
        socket.off("groupMessageRead", handleGroupMessageRead);
        socket.off("groupMessageReaction", handleGroupMessageReaction);
        socket.off("groupMessagePinned", handleGroupMessagePinned);
        socket.off("groupMessageUnpinned", handleGroupMessageUnpinned);
        socket.off("groupUpdated", handleGroupUpdated);
        socket.off("userTypingInGroup", handleUserTypingInGroup);
        socket.off("userStoppedTypingInGroup", handleUserStoppedTypingInGroup);
        socket.off("memberRemovedFromGroup", handleMemberRemoved);
        socket.off("membersAddedToGroup", handleMembersAdded);
        socket.off("adminDemoted", handleAdminDemoted);
        socket.off("memberPromoted", handleMemberPromoted);
        socket.off("groupDeleted", handleGroupDeleted);
        socket.off("removedFromGroup", handleRemovedFromGroup);
        socket.emit("leaveGroup", selectedGroup._id);
      };
    }
  }, [socket, selectedGroup]);

  // Handle new group added
  useEffect(() => {
    if (socket) {
      socket.on("newGroup", handleNewGroup);
      socket.on("addedToGroup", handleAddedToGroup);

      return () => {
        socket.off("newGroup", handleNewGroup);
        socket.off("addedToGroup", handleAddedToGroup);
      };
    }
  }, [socket]);

  // Fetch all groups for the current user
  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch("/api/groups", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setGroups(data);
      } else {
        toast.error(data.error || "Failed to fetch groups");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to fetch groups");
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  // Fetch messages for a selected group
  const fetchGroupMessages = useCallback(async (groupId) => {
    if (!groupId) return;
    
    // Prevent duplicate requests while loading
    if (isLoadingGroupMessages) return;
    
    setIsLoadingGroupMessages(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setGroupMessages(prev => ({
          ...prev,
          [groupId]: data
        }));
      } else {
        toast.error(data.error || "Failed to fetch group messages");
      }
    } catch (error) {
      console.error("Error fetching group messages:", error);
      toast.error("Failed to fetch group messages");
    } finally {
      setIsLoadingGroupMessages(false);
    }
  }, [isLoadingGroupMessages]);

  // Fetch pinned messages for a selected group
  const fetchPinnedGroupMessages = useCallback(async (groupId) => {
    if (!groupId) return;
    
    try {
      const res = await fetch(`/api/groups/${groupId}/pinned-messages`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setPinnedGroupMessages(prev => ({
          ...prev,
          [groupId]: data
        }));
      } else {
        toast.error(data.error || "Failed to fetch pinned messages");
      }
    } catch (error) {
      console.error("Error fetching pinned group messages:", error);
      toast.error("Failed to fetch pinned messages");
    }
  }, []);

  // Send a new message to a group
  const sendGroupMessage = useCallback(async (message, groupId, attachmentInfo = null) => {
    try {
      const formData = new FormData();
      formData.append("text", message.text || "");
      
      if (message.replyToId) {
        formData.append("replyToId", message.replyToId);
      }
      
      if (attachmentInfo) {
        formData.append("attachment", attachmentInfo.file);
        formData.append("attachmentType", attachmentInfo.type);
        
        if (attachmentInfo.type === "voice" && attachmentInfo.duration) {
          formData.append("duration", attachmentInfo.duration);
        }
      }

      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroupMessages(prev => {
          const updatedMessages = [...(prev[groupId] || []), data];
          return {
            ...prev,
            [groupId]: updatedMessages
          };
        });
        return data;
      } else {
        toast.error(data.error || "Failed to send message");
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending group message:", error);
      toast.error("Failed to send message");
      throw error;
    }
  }, []);

  // Create a new group
  const createGroup = async (groupData, profilePic = null) => {
    try {
      const formData = new FormData();
      formData.append("name", groupData.name);
      
      if (groupData.description) {
        formData.append("description", groupData.description);
      }
      
      if (groupData.members && groupData.members.length > 0) {
        groupData.members.forEach(memberId => {
          formData.append("members", memberId);
        });
      }
      
      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      const res = await fetch("/api/groups/create", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => [data, ...prev]);
        toast.success("Group created successfully");
        return data;
      } else {
        toast.error(data.error || "Failed to create group");
        return null;
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
      return null;
    }
  };

  // Update group information
  const updateGroup = async (groupId, updateData, profilePic = null) => {
    try {
      const formData = new FormData();
      
      if (updateData.name) {
        formData.append("name", updateData.name);
      }
      
      if (updateData.description !== undefined) {
        formData.append("description", updateData.description);
      }
      
      if (profilePic) {
        formData.append("profilePic", profilePic);
      }

      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => 
          prev.map(group => 
            group._id === groupId ? data : group
          )
        );
        
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(data);
        }
        
        toast.success("Group updated successfully");
        return data;
      } else {
        toast.error(data.error || "Failed to update group");
        return null;
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
      return null;
    }
  };

  // Add members to a group
  const addGroupMembers = async (groupId, memberIds) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: memberIds })
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => 
          prev.map(group => 
            group._id === groupId ? data : group
          )
        );
        
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(data);
        }
        
        toast.success("Members added successfully");
        return data;
      } else {
        toast.error(data.error || "Failed to add members");
        return null;
      }
    } catch (error) {
      console.error("Error adding group members:", error);
      toast.error("Failed to add members");
      return null;
    }
  };

  // Remove a member from a group
  const removeGroupMember = async (groupId, memberId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      if (res.ok) {
        // If the group is still active
        if (data.group) {
          setGroups(prev => 
            prev.map(group => 
              group._id === groupId ? data.group : group
            )
          );
          
          if (selectedGroup && selectedGroup._id === groupId) {
            setSelectedGroup(data.group);
          }
        } 
        // If the group was deleted (no members left)
        else {
          setGroups(prev => 
            prev.filter(group => group._id !== groupId)
          );
          
          if (selectedGroup && selectedGroup._id === groupId) {
            setSelectedGroup(null);
          }
        }
        
        toast.success("Member removed successfully");
        return data;
      } else {
        toast.error(data.error || "Failed to remove member");
        return null;
      }
    } catch (error) {
      console.error("Error removing group member:", error);
      toast.error("Failed to remove member");
      return null;
    }
  };

  // Leave a group (current user)
  const leaveGroup = async (groupId) => {
    try {
      return await removeGroupMember(groupId, authUser._id);
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
      return null;
    }
  };

  // Promote a member to admin
  const promoteToAdmin = async (groupId, memberId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/admins/${memberId}`, {
        method: "POST"
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => 
          prev.map(group => 
            group._id === groupId ? data : group
          )
        );
        
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(data);
        }
        
        toast.success("Member promoted to admin");
        return data;
      } else {
        toast.error(data.error || "Failed to promote member");
        return null;
      }
    } catch (error) {
      console.error("Error promoting member to admin:", error);
      toast.error("Failed to promote member");
      return null;
    }
  };

  // Demote an admin to regular member
  const demoteAdmin = async (groupId, adminId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/admins/${adminId}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => 
          prev.map(group => 
            group._id === groupId ? data : group
          )
        );
        
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(data);
        }
        
        toast.success("Admin demoted successfully");
        return data;
      } else {
        toast.error(data.error || "Failed to demote admin");
        return null;
      }
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast.error("Failed to demote admin");
      return null;
    }
  };

  // Delete a group
  const deleteGroup = async (groupId) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      if (res.ok) {
        setGroups(prev => 
          prev.filter(group => group._id !== groupId)
        );
        
        if (selectedGroup && selectedGroup._id === groupId) {
          setSelectedGroup(null);
        }
        
        toast.success("Group deleted successfully");
        return true;
      } else {
        toast.error(data.error || "Failed to delete group");
        return false;
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
      return false;
    }
  };

  // Event handlers for socket events
  const handleNewGroup = (group) => {
    setGroups(prev => [group, ...prev]);
  };

  const handleAddedToGroup = (group) => {
    setGroups(prev => [group, ...prev]);
    toast.success(`You were added to ${group.name}`);
  };

  const handleNewGroupMessage = ({ message, groupId }) => {
    setGroupMessages(prev => {
      const updatedMessages = [...(prev[groupId] || []), message];
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
  };

  const handleGroupMessageEdited = (message) => {
    const groupId = message.groupId;
    setGroupMessages(prev => {
      const updatedMessages = (prev[groupId] || []).map(msg => 
        msg._id === message._id ? message : msg
      );
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
  };

  const handleGroupMessageDeleted = ({ messageId, groupId, deleteType }) => {
    setGroupMessages(prev => {
      const updatedMessages = (prev[groupId] || []).filter(msg => {
        if (msg._id !== messageId) return true;
        if (deleteType === "forMe") {
          // Keep the message in the state but mark it as deleted
          msg.deletedFor = [...(msg.deletedFor || []), authUser._id];
          return false;
        }
        // Remove the message completely if it's deleted for everyone
        return false;
      });
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
    
    // Also remove from pinned messages if it was pinned
    setPinnedGroupMessages(prev => {
      if (!prev[groupId]) return prev;
      
      const updatedPinned = prev[groupId].filter(msg => msg._id !== messageId);
      return {
        ...prev,
        [groupId]: updatedPinned
      };
    });
  };

  const handleGroupMessageRead = ({ messageId, groupId, readByUserId, readAt }) => {
    setGroupMessages(prev => {
      const updatedMessages = (prev[groupId] || []).map(msg => {
        if (msg._id === messageId) {
          // Add the user to readBy if not already there
          const isAlreadyRead = msg.readBy.some(read => 
            read.userId.toString() === readByUserId.toString()
          );
          
          if (!isAlreadyRead) {
            return {
              ...msg,
              readBy: [...msg.readBy, { userId: readByUserId, readAt }]
            };
          }
        }
        return msg;
      });
      
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
  };

  const handleGroupMessageReaction = ({ messageId, groupId, reactions }) => {
    setGroupMessages(prev => {
      const updatedMessages = (prev[groupId] || []).map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      );
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
    
    // Update in pinned messages if it was pinned
    setPinnedGroupMessages(prev => {
      if (!prev[groupId]) return prev;
      
      const updatedPinned = prev[groupId].map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      );
      return {
        ...prev,
        [groupId]: updatedPinned
      };
    });
  };

  const handleGroupMessagePinned = ({ message, groupId }) => {
    // Update in message list
    setGroupMessages(prev => {
      const updatedMessages = (prev[groupId] || []).map(msg => 
        msg._id === message._id ? message : msg
      );
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
    
    // Add to pinned messages
    setPinnedGroupMessages(prev => {
      const currentPinned = prev[groupId] || [];
      const isPinned = currentPinned.some(msg => msg._id === message._id);
      
      if (!isPinned) {
        return {
          ...prev,
          [groupId]: [message, ...currentPinned]
        };
      }
      return prev;
    });
  };

  const handleGroupMessageUnpinned = ({ messageId, groupId }) => {
    // Update in message list
    setGroupMessages(prev => {
      const updatedMessages = (prev[groupId] || []).map(msg => 
        msg._id === messageId ? { ...msg, isPinned: false, pinnedBy: null, pinnedAt: null } : msg
      );
      return {
        ...prev,
        [groupId]: updatedMessages
      };
    });
    
    // Remove from pinned messages
    setPinnedGroupMessages(prev => {
      if (!prev[groupId]) return prev;
      
      const updatedPinned = prev[groupId].filter(msg => msg._id !== messageId);
      return {
        ...prev,
        [groupId]: updatedPinned
      };
    });
  };

  const handleGroupUpdated = (group) => {
    setGroups(prev => 
      prev.map(g => g._id === group._id ? group : g)
    );
    
    if (selectedGroup && selectedGroup._id === group._id) {
      setSelectedGroup(group);
    }
  };

  // These functions are placeholders for typing indicators
  const handleUserTypingInGroup = ({ userId, groupId }) => {
    // Implement typing indicator logic
  };

  const handleUserStoppedTypingInGroup = ({ userId, groupId }) => {
    // Implement typing indicator logic
  };

  const handleMemberRemoved = ({ group, removedMemberId, removedBy }) => {
    setGroups(prev => 
      prev.map(g => g._id === group._id ? group : g)
    );
    
    if (selectedGroup && selectedGroup._id === group._id) {
      setSelectedGroup(group);
    }
  };

  const handleMembersAdded = ({ group, newMembers }) => {
    setGroups(prev => 
      prev.map(g => g._id === group._id ? group : g)
    );
    
    if (selectedGroup && selectedGroup._id === group._id) {
      setSelectedGroup(group);
    }
  };

  const handleAdminDemoted = ({ group, adminId, demotedBy }) => {
    setGroups(prev => 
      prev.map(g => g._id === group._id ? group : g)
    );
    
    if (selectedGroup && selectedGroup._id === group._id) {
      setSelectedGroup(group);
    }
  };

  const handleMemberPromoted = ({ group, memberId, promotedBy }) => {
    setGroups(prev => 
      prev.map(g => g._id === group._id ? group : g)
    );
    
    if (selectedGroup && selectedGroup._id === group._id) {
      setSelectedGroup(group);
    }
  };

  const handleGroupDeleted = ({ groupId }) => {
    setGroups(prev => 
      prev.filter(group => group._id !== groupId)
    );
    
    if (selectedGroup && selectedGroup._id === groupId) {
      setSelectedGroup(null);
      toast.info("This group has been deleted");
    }
  };

  const handleRemovedFromGroup = ({ groupId, isSelfRemoval }) => {
    setGroups(prev => 
      prev.filter(group => group._id !== groupId)
    );
    
    if (selectedGroup && selectedGroup._id === groupId) {
      setSelectedGroup(null);
      if (!isSelfRemoval) {
        toast.info("You have been removed from this group");
      }
    }
  };

  // Check if user is admin or creator of a group
  const isAdminOrCreator = (group) => {
    if (!group || !authUser) return false;
    
    const isCreator = group.creator._id === authUser._id;
    const isAdmin = group.admins.some(admin => 
      admin._id === authUser._id
    );
    
    return isCreator || isAdmin;
  };

  const value = {
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    pinnedGroupMessages,
    isLoadingGroups,
    isLoadingGroupMessages,
    fetchGroups,
    fetchGroupMessages,
    fetchPinnedGroupMessages,
    sendGroupMessage,
    createGroup,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
    promoteToAdmin,
    demoteAdmin,
    deleteGroup,
    isAdminOrCreator
  };

  return (
    <GroupsContext.Provider value={value}>
      {children}
    </GroupsContext.Provider>
  );
}; 