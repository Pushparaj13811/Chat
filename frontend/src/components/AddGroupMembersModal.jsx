import { useState, useEffect } from "react";
import { useGroupsContext } from "../context/GroupsContext";
import { useChatStore } from "../store/useChatStore";
import { FaUserPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const AddGroupMembersModal = ({ group, isOpen, onClose }) => {
  const { addGroupMembers } = useGroupsContext();
  const { users, getUsers, isUsersLoading } = useChatStore();
  
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (isOpen && users.length === 0) {
      getUsers();
    }
  }, [isOpen, getUsers, users.length]);
  
  // Reset selections when modal is opened or group changes
  useEffect(() => {
    if (isOpen) {
      setSelectedMembers([]);
      setSearchTerm("");
    }
  }, [isOpen, group]);
  
  const handleSelectMember = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member to add");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addGroupMembers(group._id, selectedMembers);
      toast.success("Members added successfully");
      onClose();
    } catch (error) {
      console.error("Failed to add members:", error);
      toast.error("Failed to add members to group");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter out users who are already in the group
  const filteredUsers = users
    .filter(user => !group.members.some(member => member._id === user._id))
    .filter(user => user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaUserPlus /> Add Members
          </h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <div className="input-group mb-2">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered flex-1" 
                placeholder="Search users"
              />
              <span className="btn btn-square btn-primary">
                <FaUserPlus />
              </span>
            </div>
            
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedMembers.map(userId => {
                  const user = users.find(u => u._id === userId);
                  if (!user) return null;
                  
                  return (
                    <div 
                      key={userId}
                      className="badge badge-primary gap-1 p-3"
                    >
                      <span>{user.fullName}</span>
                      <button 
                        type="button"
                        onClick={() => handleSelectMember(userId)}
                        className="btn-ghost rounded-full p-1"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="bg-base-200 rounded-lg max-h-48 overflow-y-auto">
              {isUsersLoading ? (
                <div className="flex justify-center items-center p-4">
                  <span className="loading loading-spinner"></span>
                </div>
              ) : filteredUsers.length > 0 ? (
                <ul className="menu p-0">
                  {filteredUsers.map(user => (
                    <li key={user._id}>
                      <div 
                        className={`flex items-center py-2 px-3 ${
                          selectedMembers.includes(user._id) ? "bg-base-300" : ""
                        }`}
                        onClick={() => handleSelectMember(user._id)}
                      >
                        <div className="avatar mr-2">
                          <div className="w-8 rounded-full">
                            <img 
                              src={user.profilePic || "/avatar.png"} 
                              alt={user.fullName} 
                            />
                          </div>
                        </div>
                        <div className="flex-1">{user.fullName}</div>
                        <input 
                          type="checkbox" 
                          className="checkbox checkbox-primary" 
                          checked={selectedMembers.includes(user._id)}
                          readOnly
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm 
                    ? "No users match your search" 
                    : "All users are already in this group"
                  }
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || selectedMembers.length === 0}
            >
              {isSubmitting ? <span className="loading loading-spinner"></span> : "Add Members"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupMembersModal; 